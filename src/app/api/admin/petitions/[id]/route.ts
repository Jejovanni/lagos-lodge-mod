// src/app/api/admin/petitions/[id]/route.ts
// PATCH /api/admin/petitions/[id]
// Grand Masters review and update the status of candidate petitions/manifestos.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApplicationStatus, LicenseTier } from '@/types/mod';
import type { ApiError } from '@/types/mod';

interface ReviewBody {
  status: ApplicationStatus;
  reviewer_notes?: string;
  license_tier?: LicenseTier;
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

  // ── Fetch the petition ─────────────────────────────────────────────────
  const { data: petition, error: fetchError } = await supabaseAdmin
    .from('petition_applications')
    .select('id, applicant_name, email, status')
    .eq('id', petitionId)
    .maybeSingle();

  if (fetchError) return errorResponse('Internal server error', 500);
  if (!petition)  return errorResponse('Petition not found', 404);

  // ── Update petition status ─────────────────────────────────────────────
  const updates: Record<string, unknown> = {
    status,
    reviewer_id: reviewerId,
    reviewer_notes: reviewer_notes ?? null,
    reviewed_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabaseAdmin
    .from('petition_applications')
    .update(updates)
    .eq('id', petitionId);

  if (updateError) {
    console.error('[admin/petitions/[id]] Update error:', updateError.message);
    return errorResponse('Failed to update petition', 500);
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

  if (!session || session.revoked_at || new Date(session.expires_at) < new Date()) {
    return null;
  }

  // Verify the member holds grand_master rank
  const { data: member } = await supabaseAdmin
    .from('members')
    .select('id, rank')
    .eq('id', session.member_id)
    .maybeSingle();

  if (!member || member.rank !== 'grand_master') {
    return null;
  }

  return member.id;
}

function errorResponse(error: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error }, { status });
}
