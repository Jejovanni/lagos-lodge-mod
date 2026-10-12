// src/app/api/admin/petitions/[id]/route.ts
// PATCH /api/admin/petitions/[id]
// Grand Masters review and update the status of a petition.
// On acceptance: provisions a license key and emails the applicant.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { provisionLicenseKey } from '@/lib/license';
import { sendEmail, licenseDeliveryEmail } from '@/lib/email';
import type { ApplicationStatus, LicenseTier } from '@/types/mod';
import type { ApiError } from '@/types/mod';
import { randomBytes } from 'crypto';

interface ReviewBody {
  status: ApplicationStatus;
  reviewer_notes?: string;
  license_tier?: LicenseTier; // required when status === 'accepted'
}

const VALID_REVIEW_STATUSES: ApplicationStatus[] = [
  'under_review', 'accepted', 'rejected', 'waitlisted',
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  // ── Admin auth ─────────────────────────────────────────────────────────
  const reviewerId = await requireAdminSession(req);
  if (!reviewerId) return errorResponse('Unauthorized', 401);

  const petitionId = params.id;
  if (!petitionId) return errorResponse('Petition ID is required', 400);

  // ── Parse body ─────────────────────────────────────────────────────────
  let body: ReviewBody;
  try {
    body = (await req.json()) as ReviewBody;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { status, reviewer_notes, license_tier } = body;

  if (!VALID_REVIEW_STATUSES.includes(status)) {
    return errorResponse(
      `Invalid status. Allowed: ${VALID_REVIEW_STATUSES.join(', ')}`,
      422,
    );
  }
  if (status === 'accepted' && !license_tier) {
    return errorResponse('license_tier is required when accepting a petition', 422);
  }

  // ── Fetch the petition ─────────────────────────────────────────────────
  const { data: petition, error: fetchError } = await supabaseAdmin
    .from('petition_applications')
    .select('id, applicant_name, email, status')
    .eq('id', petitionId)
    .maybeSingle();

  if (fetchError) return errorResponse('Internal server error', 500);
  if (!petition)  return errorResponse('Petition not found', 404);

  // Prevent re-processing an already accepted petition
  if (petition.status === 'accepted') {
    return errorResponse('Petition already accepted — license already issued', 409);
  }

  // ── Update petition status ─────────────────────────────────────────────
  const updates: Record<string, unknown> = {
    status,
    reviewer_id: reviewerId,
    reviewer_notes: reviewer_notes ?? null,
    reviewed_at: new Date().toISOString(),
  };

  let rawLicenseKey: string | null = null;

  // ── If accepted: provision a complimentary license ─────────────────────
  if (status === 'accepted' && license_tier) {
    const freeRef = `ADMIN-GRANT-${randomBytes(8).toString('hex').toUpperCase()}`;
    const { rawKey, licenseId } = await provisionLicenseKey({
      tier: license_tier,
      paystackReference: freeRef,
    });
    rawLicenseKey = rawKey;
    updates['license_id'] = licenseId;
  }

  const { error: updateError } = await supabaseAdmin
    .from('petition_applications')
    .update(updates)
    .eq('id', petitionId);

  if (updateError) {
    console.error('[admin/petitions/[id]] Update error:', updateError.message);
    return errorResponse('Failed to update petition', 500);
  }

  // ── Email the applicant ────────────────────────────────────────────────
  if (status === 'accepted' && rawLicenseKey && license_tier) {
    await sendEmail({
      to: petition.email,
      subject: '⬡ Your Secret Lodge License Key',
      html: licenseDeliveryEmail({
        displayName: petition.applicant_name,
        licenseKey: rawLicenseKey,
        tier: license_tier,
      }),
    });
  }

  // ── Audit log ──────────────────────────────────────────────────────────
  await supabaseAdmin.from('audit_log').insert({
    actor_id: reviewerId,
    action: `petition.${status}`,
    target_type: 'petition_application',
    target_id: petitionId,
    metadata: { reviewer_notes, license_tier: license_tier ?? null },
  });

  return NextResponse.json(
    { success: true, message: `Petition marked as ${status}.` },
    { status: 200 },
  );
}

// ── Shared admin session check ─────────────────────────────────────────────

async function requireAdminSession(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const sessionToken = authHeader.slice(7).trim();

  const { data: session } = await supabaseAdmin
    .from('lodge_sessions')
    .select('member_id, expires_at, revoked_at')
    .eq('session_token', sessionToken)
    .maybeSingle();

  if (!session || session.revoked_at || new Date(session.expires_at) < new Date()) return null;
  if (!session.member_id) return null;

  const { data: member } = await supabaseAdmin
    .from('members')
    .select('rank, is_active')
    .eq('id', session.member_id)
    .maybeSingle();

  if (!member?.is_active) return null;
  if (!['master', 'grand_master'].includes(member.rank)) return null;

  return session.member_id as string;
}

function errorResponse(error: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error }, { status });
}
