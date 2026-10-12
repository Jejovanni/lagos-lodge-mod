-- ============================================================
-- Lagos Life Secret Society Mod — Supabase Schema
-- File: supabase/schema.sql
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE membership_rank AS ENUM (
  'novice',
  'initiate',
  'craftsman',
  'fellowcraft',
  'master',
  'grand_master'
);

CREATE TYPE application_status AS ENUM (
  'pending',
  'under_review',
  'accepted',
  'rejected',
  'waitlisted'
);

CREATE TYPE license_tier AS ENUM (
  'standard',   -- access to Novice–Craftsman ranks
  'premium',    -- access to all ranks + treasury dashboard
  'lifetime'    -- permanent premium access
);

CREATE TYPE contribution_type AS ENUM (
  'gold_coins',
  'prestige_points',
  'real_currency',
  'ritual_items'
);

-- ============================================================
-- TABLES
-- ============================================================

-- ── 1. License Keys ─────────────────────────────────────────
-- Each purchase generates one license key (via Stripe/LemonSqueezy webhook)
CREATE TABLE license_keys (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_hash          TEXT NOT NULL UNIQUE,          -- SHA-256 hash of the raw key
  tier              license_tier NOT NULL DEFAULT 'standard',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  max_activations   INT NOT NULL DEFAULT 1,
  activation_count  INT NOT NULL DEFAULT 0,
  stripe_payment_id TEXT,                          -- Stripe charge / LemonSqueezy order ID
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ,                   -- NULL = never expires
  revoked_at        TIMESTAMPTZ,
  revoked_reason    TEXT
);

CREATE INDEX idx_license_keys_key_hash   ON license_keys (key_hash);
CREATE INDEX idx_license_keys_is_active  ON license_keys (is_active);

-- ── 2. Members ──────────────────────────────────────────────
-- One row per registered mod user (created after license validation)
CREATE TABLE members (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_id        UUID NOT NULL REFERENCES license_keys (id) ON DELETE RESTRICT,
  display_name      TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  password_hash     TEXT NOT NULL,                 -- bcrypt via Supabase Auth or custom
  rank              membership_rank NOT NULL DEFAULT 'novice',
  prestige_points   BIGINT NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT email_format CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$')
);

CREATE INDEX idx_members_email      ON members (email);
CREATE INDEX idx_members_license_id ON members (license_id);
CREATE INDEX idx_members_rank       ON members (rank);

-- ── 3. Lodge Sessions ───────────────────────────────────────
-- Tracks mod loader activations / active browser sessions
CREATE TABLE lodge_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id    UUID NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  license_id   UUID NOT NULL REFERENCES license_keys (id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  user_agent   TEXT,
  ip_hash      TEXT,                               -- hashed IP for fraud detection, not raw
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  revoked_at   TIMESTAMPTZ
);

CREATE INDEX idx_lodge_sessions_member_id     ON lodge_sessions (member_id);
CREATE INDEX idx_lodge_sessions_session_token ON lodge_sessions (session_token);

-- ── 4. Petition Applications ────────────────────────────────
-- Players submit to join the secret society
CREATE TABLE petition_applications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_name  TEXT NOT NULL,
  email           TEXT NOT NULL,
  in_game_name    TEXT NOT NULL,
  answers         JSONB NOT NULL,                  -- { question_id: answer_text, ... }
  status          application_status NOT NULL DEFAULT 'pending',
  reviewer_id     UUID REFERENCES members (id),   -- Grand Master who reviewed
  reviewer_notes  TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  license_id      UUID REFERENCES license_keys (id) -- set when accepted + key issued

  CONSTRAINT answers_is_object CHECK (jsonb_typeof(answers) = 'object')
);

CREATE INDEX idx_petitions_status       ON petition_applications (status);
CREATE INDEX idx_petitions_email        ON petition_applications (email);
CREATE INDEX idx_petitions_submitted_at ON petition_applications (submitted_at DESC);

-- ── 5. Secret Tasks ─────────────────────────────────────────
-- Tasks / rituals assigned to members at each rank
CREATE TABLE secret_tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rank_required membership_rank NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  prestige_reward BIGINT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction: which members have completed which tasks
CREATE TABLE member_task_completions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id   UUID NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  task_id     UUID NOT NULL REFERENCES secret_tasks (id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  proof_data  JSONB,                               -- optional screenshot hash / game event ID

  UNIQUE (member_id, task_id)
);

CREATE INDEX idx_task_completions_member_id ON member_task_completions (member_id);

-- ── 6. Lodge Treasury ───────────────────────────────────────
-- Tracks resources/money contributed by members
CREATE TABLE treasury_contributions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id         UUID NOT NULL REFERENCES members (id) ON DELETE CASCADE,
  contribution_type contribution_type NOT NULL,
  amount            NUMERIC(18, 4) NOT NULL,
  description       TEXT,
  verified          BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by       UUID REFERENCES members (id),
  game_event_ref    TEXT,                          -- in-game transaction ID if available
  contributed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_treasury_member_id       ON treasury_contributions (member_id);
CREATE INDEX idx_treasury_type            ON treasury_contributions (contribution_type);
CREATE INDEX idx_treasury_contributed_at  ON treasury_contributions (contributed_at DESC);

-- ── 7. Audit Log ────────────────────────────────────────────
-- Immutable audit trail for all sensitive actions
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    UUID REFERENCES members (id),        -- NULL if unauthenticated action
  action      TEXT NOT NULL,                       -- e.g. 'license.verified', 'rank.promoted'
  target_type TEXT,                                -- e.g. 'member', 'license_key'
  target_id   UUID,
  metadata    JSONB,
  ip_hash     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor_id   ON audit_log (actor_id);
CREATE INDEX idx_audit_action     ON audit_log (action);
CREATE INDEX idx_audit_created_at ON audit_log (created_at DESC);

-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE license_keys           ENABLE ROW LEVEL SECURITY;
ALTER TABLE members                ENABLE ROW LEVEL SECURITY;
ALTER TABLE lodge_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_applications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log              ENABLE ROW LEVEL SECURITY;

-- Members can only read/update their own row
CREATE POLICY members_self_read ON members
  FOR SELECT USING (auth.uid()::TEXT = id::TEXT);

CREATE POLICY members_self_update ON members
  FOR UPDATE USING (auth.uid()::TEXT = id::TEXT);

-- Members can read their own sessions
CREATE POLICY sessions_self_read ON lodge_sessions
  FOR SELECT USING (auth.uid()::TEXT = member_id::TEXT);

-- Members can read their own treasury contributions
CREATE POLICY treasury_self_read ON treasury_contributions
  FOR SELECT USING (auth.uid()::TEXT = member_id::TEXT);

-- Members can read their own task completions
CREATE POLICY task_completions_self_read ON member_task_completions
  FOR SELECT USING (auth.uid()::TEXT = member_id::TEXT);

-- Active tasks visible to all authenticated users
CREATE POLICY tasks_read_all ON secret_tasks
  FOR SELECT USING (is_active = TRUE AND auth.role() = 'authenticated');

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at on members
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Award prestige points + check for rank promotion
CREATE OR REPLACE FUNCTION award_prestige(
  p_member_id UUID,
  p_points    BIGINT
)
RETURNS membership_rank LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_points BIGINT;
  new_rank   membership_rank;
BEGIN
  UPDATE members
  SET prestige_points = prestige_points + p_points
  WHERE id = p_member_id
  RETURNING prestige_points INTO new_points;

  -- Promotion thresholds (tune as needed)
  new_rank := CASE
    WHEN new_points >= 10000 THEN 'grand_master'::membership_rank
    WHEN new_points >= 5000  THEN 'master'::membership_rank
    WHEN new_points >= 2000  THEN 'fellowcraft'::membership_rank
    WHEN new_points >= 750   THEN 'craftsman'::membership_rank
    WHEN new_points >= 200   THEN 'initiate'::membership_rank
    ELSE                          'novice'::membership_rank
  END;

  UPDATE members SET rank = new_rank WHERE id = p_member_id;

  INSERT INTO audit_log (actor_id, action, target_type, target_id, metadata)
  VALUES (p_member_id, 'prestige.awarded', 'member', p_member_id,
          jsonb_build_object('points_awarded', p_points, 'new_total', new_points, 'new_rank', new_rank));

  RETURN new_rank;
END;
$$;
