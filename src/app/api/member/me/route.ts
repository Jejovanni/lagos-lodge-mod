// src/app/api/member/me/route.ts
// GET /api/member/me
// Returns the authenticated member's profile for the Inner Sanctum panel.
// Auth: Bearer session token (from lodge_sessions table).

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { Member, ApiError } from '@/types/mod';

export async function GET(req: NextRequest): Promise<NextResponse> {
  // ── Extract session token from Authorization header ─────────────────────
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse('Missing or malformed Authorization header', 401);
  }
  const sessionToken = authHeader.slice(7).trim();

  if (!sessionToken) {
    return errorResponse('Session token is required', 401);
  }

  // ── Look up session ─────────────────────────────────────────────────────
  const { data: session, error: sessionError } = await supabaseAdmin
    .from('lodge_sessions')
    .select('member_id, expires_at, revoked_at')
    .eq('session_token', sessionToken)
    .maybeSingle();

  if (sessionError) {
    console.error('[member/me] Session lookup error:', sessionError.message);
    return errorResponse('Internal server error', 500);
  }

  if (!session) {
    return errorResponse('Invalid session token', 401);
  }

  if (session.revoked_at) {
    return errorResponse('Session has been revoked', 401);
  }

  if (new Date(session.expires_at) < new Date()) {
    return errorResponse('Session has expired', 401);
  }

  if (!session.member_id) {
    // Session exists but member not yet linked (license verified but no account created)
    return errorResponse('No member account linked to this session', 404);
  }

  // ── Fetch member profile ────────────────────────────────────────────────
  const { data: member, error: memberError } = await supabaseAdmin
    .from('members')
    .select('id, display_name, email, rank, prestige_points, is_active, last_seen_at, created_at')
    .eq('id', session.member_id)
    .maybeSingle();

  if (memberError) {
    console.error('[member/me] Member lookup error:', memberError.message);
    return errorResponse('Internal server error', 500);
  }

  if (!member) {
    return errorResponse('Member not found', 404);
  }

  if (!member.is_active) {
    return errorResponse('Member account is suspended', 403);
  }

  // ── Update last_seen_at ────────────────────────────────────────────────
  await supabaseAdmin
    .from('members')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', member.id);

  // ── Fetch active tasks for this rank ──────────────────────────────────
  const { data: tasks } = await supabaseAdmin
    .from('secret_tasks')
    .select('id, title, description, prestige_reward')
    .eq('rank_required', member.rank)
    .eq('is_active', true)
    .order('prestige_reward', { ascending: false });

  // Which tasks has this member completed?
  const { data: completions } = await supabaseAdmin
    .from('member_task_completions')
    .select('task_id')
    .eq('member_id', member.id);

  const completedTaskIds = new Set((completions ?? []).map((c) => c.task_id));

  const enrichedTasks = (tasks ?? []).map((t) => ({
    ...t,
    completed: completedTaskIds.has(t.id),
  }));

  const response: Member & { tasks: typeof enrichedTasks } = {
    ...(member as Member),
    tasks: enrichedTasks,
  };

  return NextResponse.json(response, { status: 200 });
}

function errorResponse(error: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error }, { status });
}
