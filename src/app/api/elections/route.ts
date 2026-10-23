// src/app/api/elections/route.ts
// GET /api/elections: returns candidates
// POST /api/elections: applies for candidacy slot or casts vote

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(): Promise<NextResponse> {
  const { data, error } = await supabaseAdmin
    .from('lri_elections')
    .select('*')
    .eq('is_shortlisted', true)
    .order('votes', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ candidates: data ?? [] }, { status: 200 });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { action, candidate_handle, candidate_id } = body;

    if (action === 'vote') {
      if (!candidate_id) {
        return NextResponse.json({ error: 'Candidate ID required' }, { status: 422 });
      }

      // Fetch current votes
      const { data: candidate } = await supabaseAdmin
        .from('lri_elections')
        .select('votes')
        .eq('id', candidate_id)
        .maybeSingle();

      const newVotes = (candidate?.votes || 0) + 1;

      const { data, error } = await supabaseAdmin
        .from('lri_elections')
        .update({ votes: newVotes })
        .eq('id', candidate_id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, candidate: data }, { status: 200 });
    }

    // Default action: Apply for candidacy race
    if (!candidate_handle?.trim()) {
      return NextResponse.json({ error: 'Candidate handle is required' }, { status: 422 });
    }

    const { data: currentShortlist } = await supabaseAdmin
      .from('lri_elections')
      .select('id')
      .eq('is_shortlisted', true);

    if (currentShortlist && currentShortlist.length >= 5) {
      return NextResponse.json({ error: 'All 5 candidate slots for this week have been filled!' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('lri_elections')
      .insert({
        candidate_handle: candidate_handle.trim(),
        is_shortlisted: true,
        votes: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, candidate: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
