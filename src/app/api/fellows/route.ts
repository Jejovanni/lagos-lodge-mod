// src/app/api/fellows/route.ts
// GET /api/fellows: returns the list of active LRI members

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(): Promise<NextResponse> {
  const { data, error } = await supabaseAdmin
    .from('lri_members')
    .select('in_game_handle, research_rank, contribution_points, is_active, created_at')
    .order('contribution_points', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ fellows: data ?? [] }, { status: 200 });
}
