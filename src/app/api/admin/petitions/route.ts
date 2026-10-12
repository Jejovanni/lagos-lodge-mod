// src/app/api/admin/petitions/route.ts
// GET  /api/admin/petitions       — list petitions (with optional ?status= filter)
// POST /api/admin/petitions/[id]  — handled in [id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApplicationStatus } from '@/types/mod';
import type { ApiError } from '@/types/mod';

const VALID_STATUSES: ApplicationStatus[] = [
  'pending', 'under_review', 'accepted', 'rejected', 'waitlisted',
];

export async function GET(req: NextRequest): Promise<NextResponse> {
  // ── Admin auth: must be a grand_master or master ────────────────────────
  const memberId = await requireAdminSession(req);
  if (!memberId) return errorResponse('Unauthorized', 401);

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status') as ApplicationStatus | null;

  let query = supabaseAdmin
    .from('petition_applications')
    .select(
      'id, applicant_name, email, in_game_name, status, submitted_at, reviewed_at, reviewer_notes',
    )
    .order('submitted_at', { ascending: false })
    .limit(100);

  if (statusFilter) {
    if (!VALID_STATUSES.includes(statusFilter)) {
      return errorResponse(`Invalid status filter. Valid values: ${VALID_STATUSES.join(', ')}`, 422);
    }
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[admin/petitions] Query error:', error.message);
    return errorResponse('Internal server error', 500);
  }

  return NextResponse.json({ petitions: data ?? [] }, { status: 200 });
}

// ── Auth helper: validates session and checks rank ─────────────────────────

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
  if (!session.member_id) return null;

  const { data: member } = await supabaseAdmin
    .from('members')
    .select('rank, is_active')
    .eq('id', session.member_id)
    .maybeSingle();

  if (!member?.is_active) return null;

  const adminRanks = ['master', 'grand_master'];
  if (!adminRanks.includes(member.rank)) return null;

  return session.member_id as string;
}

function errorResponse(error: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error }, { status });
}
