// src/app/api/webhooks/paystack/route.ts
// POST /api/webhooks/paystack
//
// Receives Paystack webhook events (charge.success, etc.).
// Security contract:
//   1. Verify HMAC-SHA512 signature BEFORE reading any payload data.
//   2. Re-verify the charge directly against Paystack API (defence-in-depth).
//   3. Idempotency guard prevents double license provisioning.
//   4. Raw body must be read BEFORE Next.js parses it (use req.arrayBuffer()).
//   5. Always return 200 to Paystack quickly — heavy work is done synchronously
//      but within the 30 s Netlify function timeout.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashIp } from '@/lib/crypto';
import {
  verifyPaystackSignature,
  verifyTransaction,
  type PaystackWebhookEvent,
  type PaystackTransactionMetadata,
} from '@/lib/paystack';
import { provisionLicenseKey } from '@/lib/license';
import { sendEmail, licenseDeliveryEmail } from '@/lib/email';
import type { LicenseTier } from '@/types/mod';

// Paystack only sends from these IPs — defence-in-depth allowlist
// https://paystack.com/docs/payments/webhooks/#ip-whitelisting
const PAYSTACK_IP_ALLOWLIST = new Set([
  '52.31.139.75',
  '52.49.173.169',
  '52.214.14.220',
]);

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 0. IP allowlist check ──────────────────────────────────────────────
  const forwardedIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwardedIp && !PAYSTACK_IP_ALLOWLIST.has(forwardedIp)) {
    await writeAuditLog('webhook.paystack.ip_rejected', { ip: hashIp(forwardedIp) });
    // Return 200 to avoid info-leaking to attackers that we rejected them
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // ── 1. Read raw body as Buffer for HMAC verification ──────────────────
  let rawBodyBuffer: Buffer;
  try {
    rawBodyBuffer = Buffer.from(await req.arrayBuffer());
  } catch {
    return NextResponse.json({ error: 'Failed to read body' }, { status: 400 });
  }

  // ── 2. Verify HMAC-SHA512 signature ───────────────────────────────────
  const signature = req.headers.get('x-paystack-signature');
  const isValid = verifyPaystackSignature(rawBodyBuffer, signature);

  if (!isValid) {
    await writeAuditLog('webhook.paystack.invalid_signature', {});
    console.error('[paystack webhook] Invalid HMAC signature — rejecting.');
    return NextResponse.json({ received: true }, { status: 200 }); // 200 to not alert attackers
  }

  // ── 3. Parse body ──────────────────────────────────────────────────────
  let event: PaystackWebhookEvent;
  try {
    event = JSON.parse(rawBodyBuffer.toString('utf-8')) as PaystackWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // ── 4. Route by event type ─────────────────────────────────────────────
  switch (event.event) {
    case 'charge.success':
      await handleChargeSuccess(event);
      break;

    case 'charge.failed':
      await writeAuditLog('webhook.paystack.charge_failed', {
        reference: event.data.reference,
      });
      break;

    default:
      // Acknowledge unhandled events silently
      console.info('[paystack webhook] Unhandled event:', event.event);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

// ── Event handlers ─────────────────────────────────────────────────────────

async function handleChargeSuccess(event: PaystackWebhookEvent): Promise<void> {
  const txn = event.data;
  const reference = txn.reference;

  // ── 4a. Re-verify against Paystack API (defence-in-depth) ─────────────
  let verified: Awaited<ReturnType<typeof verifyTransaction>>;
  try {
    verified = await verifyTransaction(reference);
  } catch (err) {
    console.error('[paystack webhook] Re-verification failed:', err);
    await writeAuditLog('webhook.paystack.reverify_failed', { reference });
    return; // Don't provision if we can't confirm with Paystack
  }

  if (!verified.status || verified.data.status !== 'success') {
    console.warn('[paystack webhook] Transaction not confirmed as success:', reference);
    await writeAuditLog('webhook.paystack.not_confirmed', { reference });
    return;
  }

  const confirmedTxn = verified.data;
  const email        = confirmedTxn.customer.email;
  const firstName    = confirmedTxn.customer.first_name ?? 'Brother';
  const metadata     = (confirmedTxn.metadata ?? {}) as PaystackTransactionMetadata;
  const tier         = (metadata.license_tier ?? 'standard') as LicenseTier;

  // ── 4b. Validate tier value ────────────────────────────────────────────
  const validTiers: LicenseTier[] = ['standard', 'premium', 'lifetime'];
  if (!validTiers.includes(tier)) {
    console.error('[paystack webhook] Invalid tier in metadata:', tier);
    await writeAuditLog('webhook.paystack.invalid_tier', { reference, tier });
    return;
  }

  // ── 4c. Provision license (idempotent) ────────────────────────────────
  let rawKey: string;
  try {
    const result = await provisionLicenseKey({
      tier,
      paystackReference: reference,
    });
    rawKey = result.rawKey;

    await writeAuditLog('webhook.paystack.license_provisioned', {
      reference,
      tier,
      license_id: result.licenseId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('already provisioned')) {
      // Idempotency — Paystack may retry webhooks; this is fine
      console.info('[paystack webhook] License already provisioned for:', reference);
      return;
    }
    console.error('[paystack webhook] Provisioning failed:', message);
    await writeAuditLog('webhook.paystack.provision_failed', { reference, error: message });
    return;
  }

  // ── 4d. Email the license key to the buyer ────────────────────────────
  await sendEmail({
    to: email,
    subject: '⬡ Your Secret Lodge License Key',
    html: licenseDeliveryEmail({
      displayName: firstName,
      licenseKey: rawKey,
      tier,
    }),
  });

  console.info(`[paystack webhook] License provisioned and emailed. ref=${reference} tier=${tier}`);
}

// ── Utilities ──────────────────────────────────────────────────────────────

async function writeAuditLog(
  action: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  await supabaseAdmin.from('audit_log').insert({ action, metadata });
}
