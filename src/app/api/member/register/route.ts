// src/app/api/member/register/route.ts
// POST /api/member/register
// Converts a valid license key into a registered member profile and binds it to a session token.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashLicenseKey, hashIp } from '@/lib/crypto';
import type { ApiError, Member, MembershipRank } from '@/types/mod';

interface MemberRegisterRequest {
  licenseKey: string;
  displayName: string;
  email: string;
  passwordHash?: string; // Optional if using external auth/passwordless
}

interface MemberRegisterResponse {
  success: boolean;
  member: Member;
  sessionToken: string;
  message: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: MemberRegisterRequest;
  try {
    body = (await req.json()) as MemberRegisterRequest;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { licenseKey, displayName, email } = body;

  if (!licenseKey?.trim()) return errorResponse('licenseKey is required', 422);
  if (!displayName?.trim() || displayName.length < 2) return errorResponse('displayName must be at least 2 characters', 422);
  if (!email?.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) return errorResponse('Valid email is required', 422);

  const normalizedEmail = email.trim().toLowerCase();
  const keyHash = hashLicenseKey(licenseKey);

  // 1. Verify license key validity
  const { data: license, error: licError } = await supabaseAdmin
    .from('license_keys')
    .select('id, is_active, revoked_at, expires_at, tier')
    .eq('key_hash', keyHash)
    .maybeSingle();

  if (licError || !license) {
    return errorResponse('Invalid license key', 404);
  }

  if (!license.is_active || license.revoked_at) {
    return errorResponse('This license key has been revoked', 403);
  }

  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return errorResponse('This license key has expired', 403);
  }

  // 2. Check if a member already registered with this license or email
  const { data: existingLicenseMember } = await supabaseAdmin
    .from('members')
    .select('id')
    .eq('license_id', license.id)
    .maybeSingle();

  if (existingLicenseMember) {
    return errorResponse('A member is already registered with this license key', 409);
  }

  const { data: existingEmailMember } = await supabaseAdmin
    .from('members')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existingEmailMember) {
    return errorResponse('A member with this email already exists', 409);
  }

  // 3. Create member record
  const initialRank: MembershipRank = 'novice';
  const { data: newMember, error: createError } = await supabaseAdmin
    .from('members')
    .insert({
      license_id: license.id,
      display_name: displayName.trim(),
      email: normalizedEmail,
      password_hash: body.passwordHash ?? 'SSO_OR_TOKEN_MANAGED',
      rank: initialRank,
      prestige_points: 0,
      is_active: true,
      last_seen_at: new Date().toISOString(),
    })
    .select('id, display_name, email, rank, prestige_points, is_active, last_seen_at, created_at')
    .single();

  if (createError || !newMember) {
    console.error('[member/register] Error creating member:', createError?.message);
    return errorResponse('Failed to create member profile', 500);
  }

  // 4. Create active lodge session
  const ipRaw = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('lodge_sessions')
    .insert({
      member_id: newMember.id,
      license_id: license.id,
      user_agent: req.headers.get('user-agent'),
      ip_hash: hashIp(ipRaw),
    })
    .select('session_token')
    .single();

  if (sessionError || !session) {
    console.error('[member/register] Session generation error:', sessionError?.message);
    return errorResponse('Member created but failed to generate session', 500);
  }

  // 5. Audit log
  await supabaseAdmin.from('audit_log').insert({
    actor_id: newMember.id,
    action: 'member.registered',
    target_type: 'member',
    target_id: newMember.id,
    metadata: { tier: license.tier },
    ip_hash: hashIp(ipRaw),
  });

  return NextResponse.json<MemberRegisterResponse>(
    {
      success: true,
      member: newMember as Member,
      sessionToken: session.session_token,
      message: 'Welcome to the Brotherhood. Your initiation has commenced.',
    },
    { status: 201 }
  );
}

function errorResponse(error: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error }, { status });
}
