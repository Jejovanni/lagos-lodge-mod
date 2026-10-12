// src/types/mod.ts
// Shared TypeScript types for the Lagos Life Secret Society Mod

export type MembershipRank =
  | 'novice'
  | 'initiate'
  | 'craftsman'
  | 'fellowcraft'
  | 'master'
  | 'grand_master';

export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'waitlisted';

export type LicenseTier = 'standard' | 'premium' | 'lifetime';

export type ContributionType =
  | 'gold_coins'
  | 'prestige_points'
  | 'real_currency'
  | 'ritual_items';

// ── License ────────────────────────────────────────────────

export interface LicenseKey {
  id: string;
  key_hash: string;
  tier: LicenseTier;
  is_active: boolean;
  max_activations: number;
  activation_count: number;
  stripe_payment_id: string | null;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
}

export interface LicenseVerifyRequest {
  licenseKey: string; // raw key — will be hashed server-side
  userAgent?: string;
}

export interface LicenseVerifyResponse {
  valid: boolean;
  tier?: LicenseTier;
  message: string;
  sessionToken?: string; // issued on valid verification
}

// ── Member ─────────────────────────────────────────────────

export interface Member {
  id: string;
  display_name: string;
  email: string;
  rank: MembershipRank;
  prestige_points: number;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
}

// ── Petition ───────────────────────────────────────────────

export interface PetitionAnswers {
  [questionId: string]: string;
}

export interface PetitionSubmitRequest {
  applicant_name: string;
  email: string;
  in_game_name: string;
  answers: PetitionAnswers;
}

export interface PetitionSubmitResponse {
  success: boolean;
  applicationId?: string;
  message: string;
}

// ── Treasury ───────────────────────────────────────────────

export interface TreasuryContribution {
  id: string;
  member_id: string;
  contribution_type: ContributionType;
  amount: number;
  description: string | null;
  verified: boolean;
  game_event_ref: string | null;
  contributed_at: string;
}

// ── API Error ──────────────────────────────────────────────

export interface ApiError {
  error: string;
  code?: string;
}
