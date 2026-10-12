// src/app/api/license/verify/route.ts
// POST /api/license/verify
// Called by the mod loader script on extension install / game load.
// Validates a raw license key and issues a signed session token.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashLicenseKey, hashIp } from '@/lib/crypto';
import type {
  LicenseVerifyRequest,
  LicenseVerifyResponse,
  ApiError,
} from '@/types/mod';

// Rate-limit hint — pair with Netlify Edge rate-limiting or Upstash Redis
const MAX_BODY_BYTES = 1024;

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Parse & validate body ──────────────────────────────────
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return errorResponse('Request body too large', 413);
  }

  let body: LicenseVerifyRequest;
  try {
    body = (await req.json()) as LicenseVerifyRequest;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { licenseKey, userAgent } = body;

  if (typeof licenseKey !== 'string' || licenseKey.trim().length === 0) {
    return errorResponse('licenseKey is required', 400);
  }

  // ── Hash the raw key ───────────────────────────────────────
  const keyHash = hashLicenseKey(licenseKey);

  // ── Look up license in Supabase ────────────────────────────
  const { data: license, error: lookupError } = await supabaseAdmin
    .from('license_keys')
    .select('id, tier, is_active, max_activations, activation_count, expires_at, revoked_at')
    .eq('key_hash', keyHash)
    .maybeSingle();

  if (lookupError) {
    console.error('[license/verify] DB error:', lookupError.message);
    return errorResponse('Internal server error', 500);
  }

  if (!license) {
    await writeAuditLog(null, 'license.verify.not_found', { key_hash_prefix: keyHash.slice(0, 8) }, req);
    return invalidResponse('License key not found.');
  }

  // ── Validate license state ─────────────────────────────────
  if (!license.is_active || license.revoked_at) {
    await writeAuditLog(license.id, 'license.verify.revoked', {}, req);
    return invalidResponse('This license key has been revoked.');
  }

  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    await writeAuditLog(license.id, 'license.verify.expired', {}, req);
    return invalidResponse('This license key has expired.');
  }

  if (license.activation_count >= license.max_activations) {
    await writeAuditLog(license.id, 'license.verify.max_activations', {}, req);
    return invalidResponse('Maximum activations reached for this key.');
  }

  // ── Increment activation count & create session ────────────
  const ipRaw = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const ipHash = hashIp(ipRaw);

  // Upsert a session (idempotent for same license + user-agent combo)
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('lodge_sessions')
    .insert({
      // member_id will be set after member lookup/creation flow; placeholder null
      license_id: license.id,
      user_agent: userAgent ?? req.headers.get('user-agent'),
      ip_hash: ipHash,
    })
    .select('session_token')
    .single();

  if (sessionError) {
    console.error('[license/verify] Session creation error:', sessionError.message);
    return errorResponse('Failed to create session', 500);
  }

  // Increment activation count
  await supabaseAdmin
    .from('license_keys')
    .update({ activation_count: license.activation_count + 1 })
    .eq('id', license.id);

  await writeAuditLog(license.id, 'license.verify.success', { tier: license.tier }, req);

  const response: LicenseVerifyResponse = {
    valid: true,
    tier: license.tier,
    message: 'License verified. Welcome, Brother.',
    sessionToken: session.session_token,
  };

  return NextResponse.json(response, { status: 200 });
}

// ── Helpers ────────────────────────────────────────────────

function invalidResponse(message: string): NextResponse<LicenseVerifyResponse> {
  return NextResponse.json({ valid: false, message }, { status: 200 });
}

function errorResponse(error: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error }, { status });
}

async function writeAuditLog(
  targetId: string | null,
  action: string,
  metadata: Record<string, unknown>,
  req: NextRequest,
): Promise<void> {
  const ipRaw = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  await supabaseAdmin.from('audit_log').insert({
    action,
    target_type: 'license_key',
    target_id: targetId,
    metadata,
    ip_hash: hashIp(ipRaw),
  });
}
