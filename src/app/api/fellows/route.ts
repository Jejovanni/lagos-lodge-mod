// src/app/api/fellows/route.ts
// GET /api/fellows: returns the list of active LRI members

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(): Promise<NextResponse> {
  // Query both lri_members and members table so newly registered users in either appear immediately
  const [{ data: lriData }, { data: membersData }] = await Promise.all([
    supabaseAdmin
      .from('lri_members')
      .select('in_game_handle, research_rank, contribution_points, is_active, created_at')
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('members')
      .select('display_name, rank, prestige_points, is_active, created_at')
      .order('created_at', { ascending: false })
  ]);

  const map = new Map<string, {
    in_game_handle: string;
    research_rank?: string;
    contribution_points?: number;
    created_at?: string;
    is_active?: boolean;
  }>();

  (lriData ?? []).forEach(f => {
    if (f.in_game_handle) {
      map.set(f.in_game_handle.toLowerCase(), {
        in_game_handle: f.in_game_handle,
        research_rank: f.research_rank || 'Initiate',
        contribution_points: f.contribution_points ?? 10,
        created_at: f.created_at,
        is_active: f.is_active !== false,
      });
    }
  });

  (membersData ?? []).forEach(m => {
    if (m.display_name) {
      const key = m.display_name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          in_game_handle: m.display_name,
          research_rank: m.rank ? `${m.rank.charAt(0).toUpperCase() + m.rank.slice(1)} Fellow` : 'Active Fellow',
          contribution_points: m.prestige_points ?? 25,
          created_at: m.created_at,
          is_active: m.is_active !== false,
        });
      }
    }
  });

  const fellows = Array.from(map.values()).sort(
    (a, b) => (b.contribution_points ?? 0) - (a.contribution_points ?? 0)
  );

  return NextResponse.json({ fellows }, { status: 200 });
}
