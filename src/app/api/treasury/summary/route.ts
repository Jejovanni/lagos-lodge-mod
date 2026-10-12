// src/app/api/treasury/summary/route.ts
// GET /api/treasury/summary
// Returns aggregated lodge treasury data for the Treasury panel.
// Auth: valid Bearer session token.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ContributionType } from '@/types/mod';
import type { ApiError } from '@/types/mod';

interface TreasurySummaryRow {
  contribution_type: ContributionType;
  total: number;
}

interface TreasurySummaryResponse {
  grand_total: string;
  currency_symbol: string;
  by_type: Array<{ label: string; total: string; raw: number }>;
  top_contributors: Array<{
    display_name: string;
    total: number;
    rank: string;
  }>;
  last_updated: string;
}

const CONTRIBUTION_LABELS: Record<ContributionType, string> = {
  gold_coins:      '🪙 Gold Coins',
  prestige_points: '⭐ Prestige Points',
  real_currency:   '₦ Real Currency',
  ritual_items:    '🕯️ Ritual Items',
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  // ── Auth: verify session token ─────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse('Unauthorized', 401);
  }
  const sessionToken = authHeader.slice(7).trim();

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('lodge_sessions')
    .select('member_id, expires_at, revoked_at')
    .eq('session_token', sessionToken)
    .maybeSingle();

  if (sessionError || !session || session.revoked_at) {
    return errorResponse('Invalid or expired session', 401);
  }
  if (new Date(session.expires_at) < new Date()) {
    return errorResponse('Session expired', 401);
  }

  // ── Aggregate totals by type ────────────────────────────────────────────
  const { data: byType, error: aggError } = await supabaseAdmin
    .rpc('treasury_summary_by_type') as {
      data: TreasurySummaryRow[] | null;
      error: { message: string } | null;
    };

  // Fallback to manual aggregation if RPC not yet deployed
  const summaryRows: TreasurySummaryRow[] = byType ?? [];
  if (aggError) {
    // RPC doesn't exist yet — fall back to a direct query
    const { data: fallback } = await supabaseAdmin
      .from('treasury_contributions')
      .select('contribution_type, amount')
      .eq('verified', true);

    const grouped: Partial<Record<ContributionType, number>> = {};
    for (const row of fallback ?? []) {
      const t = row.contribution_type as ContributionType;
      grouped[t] = (grouped[t] ?? 0) + Number(row.amount);
    }
    for (const [type, total] of Object.entries(grouped)) {
      summaryRows.push({ contribution_type: type as ContributionType, total: total as number });
    }
  }

  // ── Grand total (real currency only for display) ───────────────────────
  const realTotal = summaryRows
    .filter((r) => r.contribution_type === 'real_currency')
    .reduce((sum, r) => sum + r.total, 0);

  // ── Top 5 contributors (verified contributions) ────────────────────────
  const { data: topRaw } = await supabaseAdmin
    .from('treasury_contributions')
    .select(`
      amount,
      member_id,
      members!inner ( display_name, rank )
    `)
    .eq('verified', true)
    .order('amount', { ascending: false })
    .limit(20);

  // Group by member and sum
  const memberTotals = new Map<string, { display_name: string; rank: string; total: number }>();
  for (const row of topRaw ?? []) {
    const m = row.members as { display_name: string; rank: string };
    const prev = memberTotals.get(row.member_id) ?? { display_name: m.display_name, rank: m.rank, total: 0 };
    prev.total += Number(row.amount);
    memberTotals.set(row.member_id, prev);
  }

  const topContributors = [...memberTotals.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((m) => ({
      display_name: m.display_name,
      total: m.total,
      rank: m.rank.replace(/_/g, ' '),
    }));

  const response: TreasurySummaryResponse = {
    grand_total: `₦${realTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
    currency_symbol: '₦',
    by_type: summaryRows.map((r) => ({
      label: CONTRIBUTION_LABELS[r.contribution_type] ?? r.contribution_type,
      total: r.total.toLocaleString(),
      raw: r.total,
    })),
    top_contributors: topContributors,
    last_updated: new Date().toISOString(),
  };

  return NextResponse.json(response, { status: 200 });
}

function errorResponse(error: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error }, { status });
}
