// src/app/api/lobby/route.ts
// GET /api/lobby: returns public candidate manifesto platforms
// POST /api/lobby: submits a platform to the manifesto board

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(): Promise<NextResponse> {
  const { data, error } = await supabaseAdmin
    .from('lri_ballots_and_lobbies')
    .select('*')
    .eq('type', 'lobby_petition')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ petitions: data ?? [] }, { status: 200 });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { candidate_handle, platform_text } = body;

    if (!candidate_handle?.trim() || !platform_text?.trim()) {
      return NextResponse.json({ error: 'Handle and platform text are required' }, { status: 422 });
    }

    const { data, error } = await supabaseAdmin
      .from('lri_ballots_and_lobbies')
      .insert({
        type: 'lobby_petition',
        candidate_handle: candidate_handle.trim(),
        platform_text: platform_text.trim(),
        votes_count: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, petition: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
