// src/app/api/apply/route.ts
// POST /api/apply
// Accepts Petition Portal submissions from aspiring members.
// Validates input, checks for duplicate applications, stores in Supabase.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashIp } from '@/lib/crypto';
import type {
  PetitionSubmitRequest,
  PetitionSubmitResponse,
  ApiError,
} from '@/types/mod';

// The canonical petition questions — IDs must match the frontend form
const REQUIRED_QUESTION_IDS = [
  'q_why_join',        // "Why do you seek entry into the Lodge?"
  'q_contribution',    // "What will you bring to the Brotherhood?"
  'q_secret_kept',     // "Describe a secret you have kept and why."
  'q_sponsor',         // "Do you have a sponsor within the Lodge? If so, their name."
] as const;

const MAX_ANSWER_LENGTH = 1000;
const MAX_BODY_BYTES = 8192;

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Body size guard ────────────────────────────────────────
  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return errorResponse('Request body too large', 413);
  }

  let body: PetitionSubmitRequest;
  try {
    body = (await req.json()) as PetitionSubmitRequest;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  // ── Field validation ───────────────────────────────────────
  const validationError = validatePetition(body);
  if (validationError) {
    return errorResponse(validationError, 422);
  }

  const { applicant_name, email, in_game_name, answers } = body;
  const normalizedEmail = email.trim().toLowerCase();

  // ── Duplicate check ────────────────────────────────────────
  const { data: existing, error: dupError } = await supabaseAdmin
    .from('petition_applications')
    .select('id, status')
    .eq('email', normalizedEmail)
    .in('status', ['pending', 'under_review', 'accepted'])
    .maybeSingle();

  if (dupError) {
    console.error('[apply] Duplicate check error:', dupError.message);
    return errorResponse('Internal server error', 500);
  }

  if (existing) {
    const statusMsg =
      existing.status === 'accepted'
        ? 'You have already been accepted into the Lodge.'
        : 'A petition from this email address is already under consideration.';
    return NextResponse.json<PetitionSubmitResponse>(
      { success: false, message: statusMsg },
      { status: 200 },
    );
  }

  // ── Persist application ────────────────────────────────────
  const { data: application, error: insertError } = await supabaseAdmin
    .from('petition_applications')
    .insert({
      applicant_name: applicant_name.trim(),
      email: normalizedEmail,
      in_game_name: in_game_name.trim(),
      answers,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[apply] Insert error:', insertError.message);
    return errorResponse('Failed to submit petition', 500);
  }

  // ── Audit log ──────────────────────────────────────────────
  const ipRaw = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  await supabaseAdmin.from('audit_log').insert({
    action: 'petition.submitted',
    target_type: 'petition_application',
    target_id: application.id,
    metadata: { in_game_name, email_hash: hashIp(normalizedEmail) },
    ip_hash: hashIp(ipRaw),
  });

  return NextResponse.json<PetitionSubmitResponse>(
    {
      success: true,
      applicationId: application.id,
      message:
        'Your petition has been received. The Lodge will deliberate. Await our word in silence.',
    },
    { status: 201 },
  );
}

// ── Validation ─────────────────────────────────────────────

function validatePetition(body: PetitionSubmitRequest): string | null {
  if (!body.applicant_name?.trim()) return 'applicant_name is required';
  if (!body.email?.trim()) return 'email is required';
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(body.email)) return 'email format is invalid';
  if (!body.in_game_name?.trim()) return 'in_game_name is required';
  if (typeof body.answers !== 'object' || Array.isArray(body.answers)) {
    return 'answers must be an object';
  }

  for (const qId of REQUIRED_QUESTION_IDS) {
    const answer = body.answers[qId];
    if (typeof answer !== 'string' || answer.trim().length < 10) {
      return `Answer to "${qId}" is required (min 10 characters)`;
    }
    if (answer.trim().length > MAX_ANSWER_LENGTH) {
      return `Answer to "${qId}" exceeds ${MAX_ANSWER_LENGTH} characters`;
    }
  }

  return null;
}

function errorResponse(error: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error }, { status });
}
