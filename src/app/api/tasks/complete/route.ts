// src/app/api/tasks/complete/route.ts
// POST /api/tasks/complete
// Allows members to submit task/ritual completions and earn prestige points + potential promotion.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiError, MembershipRank } from '@/types/mod';

interface TaskCompleteRequest {
  taskId: string;
  proofData?: Record<string, unknown>;
}

interface TaskCompleteResponse {
  success: boolean;
  pointsAwarded: number;
  currentRank: MembershipRank;
  message: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse('Missing Authorization header', 401);
  }
  const sessionToken = authHeader.slice(7).trim();

  // 1. Authenticate member from session
  const { data: session } = await supabaseAdmin
    .from('lodge_sessions')
    .select('member_id, expires_at, revoked_at')
    .eq('session_token', sessionToken)
    .maybeSingle();

  if (!session || session.revoked_at || new Date(session.expires_at) < new Date()) {
    return errorResponse('Invalid or expired session', 401);
  }
  if (!session.member_id) {
    return errorResponse('No active member found for this session', 403);
  }

  let body: TaskCompleteRequest;
  try {
    body = (await req.json()) as TaskCompleteRequest;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { taskId, proofData } = body;
  if (!taskId) return errorResponse('taskId is required', 422);

  // 2. Fetch the task
  const { data: task, error: taskError } = await supabaseAdmin
    .from('secret_tasks')
    .select('id, title, prestige_reward, rank_required, is_active')
    .eq('id', taskId)
    .maybeSingle();

  if (taskError || !task) {
    return errorResponse('Task not found', 404);
  }
  if (!task.is_active) {
    return errorResponse('Task is no longer active', 400);
  }

  // 3. Check for prior completion
  const { data: existingCompletion } = await supabaseAdmin
    .from('member_task_completions')
    .select('id')
    .eq('member_id', session.member_id)
    .eq('task_id', taskId)
    .maybeSingle();

  if (existingCompletion) {
    return errorResponse('You have already completed this secret task', 409);
  }

  // 4. Record task completion
  const { error: insertError } = await supabaseAdmin
    .from('member_task_completions')
    .insert({
      member_id: session.member_id,
      task_id: taskId,
      proof_data: proofData ?? null,
    });

  if (insertError) {
    console.error('[tasks/complete] Insert error:', insertError.message);
    return errorResponse('Failed to record completion', 500);
  }

  // 5. Award prestige points and trigger rank progression using award_prestige function
  const { data: newRank, error: awardError } = await supabaseAdmin.rpc('award_prestige', {
    p_member_id: session.member_id,
    p_points: task.prestige_reward,
  });

  if (awardError) {
    console.error('[tasks/complete] award_prestige RPC error:', awardError.message);
    return errorResponse('Task marked complete but failed to award prestige', 500);
  }

  return NextResponse.json<TaskCompleteResponse>(
    {
      success: true,
      pointsAwarded: Number(task.prestige_reward),
      currentRank: newRank as MembershipRank,
      message: `Task completed. ${task.prestige_reward} Prestige points awarded.`,
    },
    { status: 200 }
  );
}

function errorResponse(error: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error }, { status });
}
