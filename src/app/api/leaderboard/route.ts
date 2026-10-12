// src/app/api/leaderboard/route.ts
// GET /api/leaderboard
// Returns public/member leaderboard ranking the top brothers by prestige.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiError, MembershipRank } from '@/types/mod';

interface LeaderboardEntry {
  displayName: string;
  rank: MembershipRank;
  prestigePoints: number;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const limitParam = parseInt(searchParams.get('limit') ?? '20', 10);
  const limit = isNaN(limitParam) || limitParam <= 0 ? 20 : Math.min(limitParam, 50);

  const { data: members, error } = await supabaseAdmin
    .from('members')
    .select('display_name, rank, prestige_points')
    .eq('is_active', true)
    .order('prestige_points', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[leaderboard] Query error:', error.message);
    return errorResponse('Failed to load leaderboard', 500);
  }

  const entries: LeaderboardEntry[] = (members ?? []).map((m) => ({
    displayName: m.display_name,
    rank: m.rank,
    prestigePoints: Number(m.prestige_points),
  }));

  return NextResponse.json({ leaderboard: entries }, { status: 200 });
}

function errorResponse(error: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error }, { status });
}
