// src/lib/license.ts
// Generates and provisions license keys server-side.

import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { hashLicenseKey } from '@/lib/crypto';
import type { LicenseTier } from '@/types/mod';

/**
 * Generates a human-readable license key in the format:
 *   LODGE-XXXX-XXXX-XXXX-XXXX
 * where each segment is uppercase alphanumeric (Base32 alphabet, no O/0/I/1 confusion).
 */
export function generateRawLicenseKey(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars, no ambiguous chars
  const segment = () =>
    Array.from({ length: 4 }, () => alphabet[randomBytes(1)[0] % 32]).join('');
  return `LODGE-${segment()}-${segment()}-${segment()}-${segment()}`;
}

/**
 * Provisions a new license key in the database.
 * Called by the Paystack webhook after a successful charge.
 * Idempotent on `paystack_reference` — won't double-create.
 */
export async function provisionLicenseKey(opts: {
  tier: LicenseTier;
  paystackReference: string;
  expiresAt?: Date;
}): Promise<{ rawKey: string; licenseId: string }> {
  // Check for existing key with this payment reference (idempotency guard)
  const { data: existing } = await supabaseAdmin
    .from('license_keys')
    .select('id, key_hash')
    .eq('stripe_payment_id', opts.paystackReference) // column reused for Paystack ref
    .maybeSingle();

  if (existing) {
    throw new Error(
      `License already provisioned for reference: ${opts.paystackReference}`,
    );
  }

  const rawKey = generateRawLicenseKey();
  const keyHash = hashLicenseKey(rawKey);

  const { data: license, error } = await supabaseAdmin
    .from('license_keys')
    .insert({
      key_hash: keyHash,
      tier: opts.tier,
      is_active: true,
      max_activations: opts.tier === 'lifetime' ? 3 : 1,
      stripe_payment_id: opts.paystackReference, // stores Paystack ref here
      expires_at: opts.expiresAt?.toISOString() ?? null,
    })
    .select('id')
    .single();

  if (error || !license) {
    throw new Error(`Failed to insert license key: ${error?.message}`);
  }

  return { rawKey, licenseId: license.id };
}
