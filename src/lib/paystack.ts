// src/lib/paystack.ts
// Type-safe Paystack server-side utilities.
// NEVER import this file in client components or the browser bundle.

import { createHmac, timingSafeEqual } from 'crypto';

// ── Environment guards ─────────────────────────────────────────────────────
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!PAYSTACK_SECRET_KEY) {
  throw new Error('Missing environment variable: PAYSTACK_SECRET_KEY');
}

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// ── Types ──────────────────────────────────────────────────────────────────

export interface PaystackCustomer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  customer_code: string;
}

export interface PaystackTransaction {
  id: number;
  reference: string;
  amount: number;          // in kobo (NGN) or smallest currency unit
  currency: string;
  status: 'success' | 'failed' | 'abandoned';
  paid_at: string;
  customer: PaystackCustomer;
  metadata: PaystackTransactionMetadata | null;
}

export interface PaystackTransactionMetadata {
  license_tier?: string;  // 'standard' | 'premium' | 'lifetime'
  custom_fields?: Array<{ display_name: string; variable_name: string; value: string }>;
}

export interface PaystackWebhookEvent {
  event: string;           // e.g. 'charge.success'
  data: PaystackTransaction;
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: PaystackTransaction;
}

// ── Webhook signature verification ────────────────────────────────────────

/**
 * Verifies the HMAC-SHA512 signature Paystack sends in the
 * `x-paystack-signature` header. Uses timing-safe comparison
 * to prevent timing attacks.
 *
 * @throws never — returns false on any failure so callers can reject cleanly.
 */
export function verifyPaystackSignature(
  rawBody: Buffer,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false;

  try {
    const expected = createHmac('sha512', PAYSTACK_SECRET_KEY!)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(signatureHeader, 'hex');

    // Buffers must be same length for timingSafeEqual
    if (expectedBuf.length !== receivedBuf.length) return false;

    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

// ── API helpers ────────────────────────────────────────────────────────────

/**
 * Verify a transaction reference directly against the Paystack API.
 * Use this as a secondary check inside the webhook handler.
 */
export async function verifyTransaction(
  reference: string,
): Promise<PaystackVerifyResponse> {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      // Abort after 10 s to avoid hanging the webhook handler
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paystack verify failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<PaystackVerifyResponse>;
}

/**
 * Initialise a Paystack transaction (server-to-server).
 * Returns the checkout URL to redirect the user to.
 */
export async function initializeTransaction(opts: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: PaystackTransactionMetadata;
}): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: opts.email,
      amount: opts.amountKobo,
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      metadata: opts.metadata,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paystack init failed (${res.status}): ${text}`);
  }

  const json = await res.json() as { status: boolean; data: { authorization_url: string; access_code: string; reference: string } };
  if (!json.status) throw new Error('Paystack returned status=false on init');
  return json.data;
}
