// src/app/api/checkout/initialize/route.ts
// POST /api/checkout/initialize
//
// Server-side checkout initialiser. The client sends the buyer's email +
// chosen tier; we calculate the price, generate a reference, then call
// Paystack's /transaction/initialize endpoint and return the checkout URL.
// We never expose PAYSTACK_SECRET_KEY to the frontend.

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { initializeTransaction } from '@/lib/paystack';
import type { LicenseTier } from '@/types/mod';
import type { ApiError } from '@/types/mod';

// ── Pricing (in kobo — 1 NGN = 100 kobo) ─────────────────────────────────
// Adjust currency/amounts as needed for your market.
const TIER_PRICING: Record<LicenseTier, { amountKobo: number; label: string }> = {
  standard: { amountKobo: 2_500_00,  label: 'Standard Membership'  }, // ₦2,500
  premium:  { amountKobo: 7_500_00,  label: 'Premium Membership'   }, // ₦7,500
  lifetime: { amountKobo: 25_000_00, label: 'Lifetime Membership'  }, // ₦25,000
};

interface CheckoutInitRequest {
  email: string;
  tier: LicenseTier;
}

interface CheckoutInitResponse {
  checkoutUrl: string;
  reference: string;
}

const VALID_TIERS: LicenseTier[] = ['standard', 'premium', 'lifetime'];
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://your-netlify-app.netlify.app';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Parse body ─────────────────────────────────────────────────────────
  let body: CheckoutInitRequest;
  try {
    body = (await req.json()) as CheckoutInitRequest;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { email, tier } = body;

  // ── Validate inputs ────────────────────────────────────────────────────
  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    return errorResponse('A valid email address is required', 422);
  }
  if (!VALID_TIERS.includes(tier)) {
    return errorResponse(`Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}`, 422);
  }

  const pricing = TIER_PRICING[tier];

  // ── Generate a unique, unpredictable reference ─────────────────────────
  const reference = `LODGE-${randomBytes(12).toString('hex').toUpperCase()}`;

  // ── Call Paystack ──────────────────────────────────────────────────────
  try {
    const txn = await initializeTransaction({
      email,
      amountKobo: pricing.amountKobo,
      reference,
      callbackUrl: `${APP_BASE_URL}/checkout/success?ref=${reference}`,
      metadata: {
        license_tier: tier,
        custom_fields: [
          {
            display_name: 'Membership Tier',
            variable_name: 'license_tier',
            value: pricing.label,
          },
        ],
      },
    });

    return NextResponse.json<CheckoutInitResponse>(
      { checkoutUrl: txn.authorization_url, reference: txn.reference },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[checkout/initialize] Paystack error:', message);
    return errorResponse('Failed to initialise checkout. Please try again.', 502);
  }
}

function errorResponse(error: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error }, { status });
}
