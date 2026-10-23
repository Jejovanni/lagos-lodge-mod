// src/app/api/directives/route.ts
// GET /api/directives: returns active policy directives
// POST /api/directives: publishes a new directive

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(): Promise<NextResponse> {
  const { data, error } = await supabaseAdmin
    .from('lri_directives')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ directives: data ?? [] }, { status: 200 });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { directive_text, author_handle } = body;

    if (!directive_text?.trim()) {
      return NextResponse.json({ error: 'Directive text is required' }, { status: 422 });
    }

    const { data, error } = await supabaseAdmin
      .from('lri_directives')
      .insert({
        directive_text: directive_text.trim(),
        author_handle: author_handle?.trim() || 'Director Adebayo',
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, directive: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
