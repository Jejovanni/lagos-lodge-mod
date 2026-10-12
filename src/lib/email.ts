// src/lib/email.ts
// Sends transactional emails via Resend (swap for SendGrid/Postmark as needed).
// Server-side only.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS   = process.env.EMAIL_FROM ?? 'noreply@yourdomain.com';
const RESEND_URL     = 'https://api.resend.com/emails';

export interface SendEmailOpts {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends a transactional email using Resend.
 * Logs a warning (but does not throw) if RESEND_API_KEY is missing,
 * so webhook processing is never blocked by a missing email config.
 */
export async function sendEmail(opts: SendEmailOpts): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email to', opts.to);
    return;
  }

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!res.ok) {
    // Non-fatal — log and continue; payment has already been processed
    console.error('[email] Failed to send:', res.status, await res.text());
  }
}

// ── Templates ──────────────────────────────────────────────────────────────

export function licenseDeliveryEmail(opts: {
  displayName: string;
  licenseKey: string;
  tier: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="background:#0f0e0c;margin:0;padding:32px 16px;font-family:Georgia,serif;color:#e8d98c;">
  <div style="max-width:480px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:32px;">⬡</span>
      <h1 style="color:#d4af37;font-size:22px;letter-spacing:0.12em;margin:8px 0 4px;">
        THE SECRET LODGE
      </h1>
      <p style="color:#8b7320;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">
        Your Petition Has Been Granted
      </p>
    </div>

    <p>Brother / Sister <strong>${opts.displayName}</strong>,</p>
    <p>The Lodge has accepted your offering. Your passage key is sealed below.
       Guard it with your life — it grants entry to the Inner Sanctum.</p>

    <div style="background:#1a1810;border:1px solid #d4af37;border-radius:8px;
                padding:20px;text-align:center;margin:24px 0;">
      <p style="color:#8b7320;font-size:11px;letter-spacing:0.12em;
                text-transform:uppercase;margin:0 0 8px;">Your License Key</p>
      <code style="color:#d4af37;font-size:20px;letter-spacing:0.18em;
                   font-family:'Courier New',monospace;">
        ${opts.licenseKey}
      </code>
      <p style="color:#4a4030;font-size:11px;margin:12px 0 0;">
        Tier: <strong style="color:#a08030;">${opts.tier.toUpperCase()}</strong>
      </p>
    </div>

    <p style="font-size:13px;color:#8b7320;">
      To activate, install the Lodge browser extension and enter this key when prompted.
      The Brotherhood watches. Welcome.
    </p>

    <hr style="border:none;border-top:1px solid #2a2518;margin:32px 0;">
    <p style="font-size:11px;color:#3a3020;text-align:center;">
      This key is personal and non-transferable. Do not share it.
    </p>
  </div>
</body>
</html>`;
}
