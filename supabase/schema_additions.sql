-- supabase/schema_additions.sql
-- Additions to the Phase 1 schema for Phase 2 features.
-- Run this AFTER schema.sql.

-- ── 1. Treasury summary RPC (used by /api/treasury/summary) ───────────────
CREATE OR REPLACE FUNCTION treasury_summary_by_type()
RETURNS TABLE (contribution_type TEXT, total NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    contribution_type::TEXT,
    SUM(amount) AS total
  FROM treasury_contributions
  WHERE verified = TRUE
  GROUP BY contribution_type
  ORDER BY total DESC;
$$;

-- ── 2. Rename stripe_payment_id to payment_reference ──────────────────────
-- More payment-provider-agnostic naming.
-- Only run if you haven't deployed schema.sql to production yet;
-- otherwise use a migration tool (e.g. Supabase CLI migrations).
-- ALTER TABLE license_keys RENAME COLUMN stripe_payment_id TO payment_reference;

-- ── 3. Index to speed up payment reference lookups ────────────────────────
CREATE INDEX IF NOT EXISTS idx_license_keys_payment_ref
  ON license_keys (stripe_payment_id);

-- ── 4. Paystack webhook events log (idempotency + debugging) ──────────────
CREATE TABLE IF NOT EXISTS paystack_webhook_events (
  id            BIGSERIAL PRIMARY KEY,
  event_type    TEXT NOT NULL,
  reference     TEXT NOT NULL UNIQUE,    -- Paystack transaction reference
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload       JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_paystack_events_reference
  ON paystack_webhook_events (reference);

-- ── 5. RLS for paystack_webhook_events (service role only) ────────────────
ALTER TABLE paystack_webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies = only service role key can access (default deny for anon/authenticated)

-- ── 6. Add checkout_sessions table for tracking incomplete payments ────────
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference     TEXT NOT NULL UNIQUE,
  email         TEXT NOT NULL,
  tier          license_tier NOT NULL,
  amount_kobo   BIGINT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'completed' | 'abandoned'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_reference ON checkout_sessions (reference);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_email     ON checkout_sessions (email);
