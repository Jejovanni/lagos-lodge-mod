// src/app/api/member/register/route.ts
// POST /api/member/register
// Registers or signs in a user simply using their Lagos Life username.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashIp } from '@/lib/crypto';
import type { ApiError, Member, MembershipRank } from '@/types/mod';

interface MemberRegisterRequest {
  username: string;
}

interface MemberRegisterResponse {
  success: boolean;
  member: Member;
  sessionToken: string;
  message: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: MemberRegisterRequest;
  try {
    body = (await req.json()) as MemberRegisterRequest;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const rawUsername = body.username;
  if (!rawUsername || typeof rawUsername !== 'string' || rawUsername.trim().length < 2) {
    return errorResponse('Username must be at least 2 characters', 422);
  }

  const username = rawUsername.trim();
  const normalizedEmail = `${username.toLowerCase().replace(/[^a-z0-9_.-]/g, '')}@lagoslife.app`;
  const ipRaw = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const ipHash = hashIp(ipRaw);

  try {
    // 1. Check if member already exists by display_name
    let { data: member, error: lookupError } = await supabaseAdmin
      .from('members')
      .select('id, display_name, email, rank, prestige_points, is_active, last_seen_at, created_at')
      .ilike('display_name', username)
      .maybeSingle();

    if (lookupError) {
      console.error('[member/register] Lookup error:', lookupError.message);
      return errorResponse('Database error during lookup', 500);
    }

    // 2. If not found, create new member record
    if (!member) {
      // Ensure we have a default/fallback license record if foreign key constraints exist
      let fallbackLicenseId: string | null = null;
      const { data: existingLicense } = await supabaseAdmin
        .from('license_keys')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existingLicense?.id) {
        fallbackLicenseId = existingLicense.id;
      } else {
        const { data: createdLic } = await supabaseAdmin
          .from('license_keys')
          .insert({
            key_hash: hashIp(`open_access_${Date.now()}_${Math.random()}`),
            tier: 'standard',
            is_active: true,
            max_activations: 999999,
          })
          .select('id')
          .maybeSingle();
        if (createdLic?.id) {
          fallbackLicenseId = createdLic.id;
        }
      }

      const initialRank: MembershipRank = 'novice';
      const insertPayload: Record<string, unknown> = {
        display_name: username,
        email: normalizedEmail,
        password_hash: 'OPEN_ACCESS_USERNAME_AUTH',
        rank: initialRank,
        prestige_points: 0,
        is_active: true,
        last_seen_at: new Date().toISOString(),
      };

      if (fallbackLicenseId) {
        insertPayload.license_id = fallbackLicenseId;
      }

      const { data: createdMember, error: createError } = await supabaseAdmin
        .from('members')
        .insert(insertPayload)
        .select('id, display_name, email, rank, prestige_points, is_active, last_seen_at, created_at')
        .single();

      if (createError || !createdMember) {
        console.error('[member/register] Error creating member:', createError?.message);
        return errorResponse('Failed to create member profile', 500);
      }

      member = createdMember;
    }

    if (!member.is_active) {
      return errorResponse('This member account has been suspended', 403);
    }

    // 3. Create or reuse active lodge session
    const sessionPayload: Record<string, unknown> = {
      member_id: member.id,
      user_agent: req.headers.get('user-agent'),
      ip_hash: ipHash,
    };

    // If lodge_sessions requires a license_id, query member's license or fallback
    const { data: memberLic } = await supabaseAdmin
      .from('members')
      .select('license_id')
      .eq('id', member.id)
      .maybeSingle();

    if (memberLic?.license_id) {
      sessionPayload.license_id = memberLic.license_id;
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('lodge_sessions')
      .insert(sessionPayload)
      .select('session_token')
      .single();

    if (sessionError || !session) {
      console.error('[member/register] Session error:', sessionError?.message);
      return errorResponse('Failed to generate session', 500);
    }

    // 4. Update last seen
    await supabaseAdmin
      .from('members')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', member.id);

    return NextResponse.json<MemberRegisterResponse>(
      {
        success: true,
        member: member as Member,
        sessionToken: session.session_token,
        message: `Welcome to the Syndicate, ${member.display_name}.`,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('[member/register] Unexpected error:', err);
    return errorResponse('Unexpected server error', 500);
  }
}

function errorResponse(error: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error }, { status });
}
