// src/app/api/checkout/verify/route.ts
// GET /api/checkout/verify?ref=LODGE-...
// Allows the checkout success page to verify payment with Paystack,
// provision the license key, and display it directly on screen.
// 100% Free: No domain or paid email service needed.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyTransaction, type PaystackTransactionMetadata } from '@/lib/paystack';
import { provisionLicenseKey } from '@/lib/license';
import type { LicenseTier, ApiError } from '@/types/mod';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get('ref');

  if (!ref || !ref.trim()) {
    return errorResponse('Missing transaction reference', 400);
  }

  // 1. Check if license was already provisioned in Supabase for this reference
  const { data: existingLicense } = await supabaseAdmin
    .from('license_keys')
    .select('id, tier, is_active, stripe_payment_id')
    .eq('stripe_payment_id', ref)
    .maybeSingle();

  // If already provisioned, fetch the raw key from checkout_sessions if saved, or return status
  const { data: sessionData } = await supabaseAdmin
    .from('checkout_sessions')
    .select('reference, email, tier, status')
    .eq('reference', ref)
    .maybeSingle();

  // 2. If not yet provisioned, query Paystack API directly
  try {
    const verified = await verifyTransaction(ref);

    if (!verified.status || verified.data.status !== 'success') {
      return NextResponse.json({
        success: false,
        status: verified.data?.status ?? 'pending',
        message: 'Payment is not yet confirmed by Paystack.',
      }, { status: 200 });
    }

    const txn = verified.data;
    const metadata = (txn.metadata ?? {}) as PaystackTransactionMetadata;
    const tier = (metadata.license_tier ?? 'standard') as LicenseTier;

    // 3. Provision license key if not already done
    let rawKey: string | null = null;
    if (!existingLicense) {
      const result = await provisionLicenseKey({
        tier,
        paystackReference: ref,
      });
      rawKey = result.rawKey;

      // Update checkout session status
      await supabaseAdmin
        .from('checkout_sessions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('reference', ref);
    }

    return NextResponse.json({
      success: true,
      status: 'success',
      tier,
      licenseKey: rawKey,
      email: txn.customer.email,
      message: 'Payment verified successfully.',
    }, { status: 200 });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[checkout/verify] Error verifying transaction:', msg);
    return errorResponse('Failed to verify payment with Paystack', 500);
  }
}

function errorResponse(error: string, status: number): NextResponse<ApiError> {
  return NextResponse.json({ error }, { status });
}
