# Lagos Life — Secret Lodge Mod

A Freemason-inspired secret society browser extension mod for Lagos Life.  
Built with **Next.js 14 App Router**, **Supabase**, **TypeScript**, and **Tailwind CSS**.  
Deployed on **Netlify**. Extension targets Chrome/Edge (Manifest V3) and Firefox.

---

## Project Structure

```
lagos-mod/
├── supabase/
│   └── schema.sql                    ← Full PostgreSQL schema + RLS + helper functions
│
├── src/
│   ├── types/
│   │   └── mod.ts                    ← Shared TypeScript types
│   ├── lib/
│   │   ├── supabase.ts               ← Supabase admin client (server-only)
│   │   └── crypto.ts                 ← SHA-256 key hashing, IP anonymisation
│   └── app/
│       └── api/
│           ├── license/
│           │   └── verify/
│           │       └── route.ts      ← POST /api/license/verify
│           └── apply/
│               └── route.ts          ← POST /api/apply
│
└── public/
    ├── manifest.json                 ← Chrome MV3 extension manifest
    └── injector/
        └── loader.js                 ← Content script (Shadow DOM injector)
```

---

## Database Schema Overview

| Table | Purpose |
|---|---|
| `license_keys` | Purchased license keys (stored as SHA-256 hashes) |
| `members` | Registered mod users with rank & prestige points |
| `lodge_sessions` | Active browser sessions (30-day TTL) |
| `petition_applications` | Join requests with JSONB answers |
| `secret_tasks` | Rank-gated tasks/rituals |
| `member_task_completions` | Which tasks each member has completed |
| `treasury_contributions` | Resource/money contributions by members |
| `audit_log` | Immutable audit trail for all sensitive actions |

---

## API Routes

### `POST /api/license/verify`
Called by the content script on every page load.

**Request:**
```json
{ "licenseKey": "LODGE-XXXX-XXXX-XXXX", "userAgent": "..." }
```
**Response (valid):**
```json
{ "valid": true, "tier": "premium", "message": "Welcome, Brother.", "sessionToken": "..." }
```

### `POST /api/apply`
Accepts petition submissions from the Petition Portal tab.

**Request:**
```json
{
  "applicant_name": "...",
  "email": "...",
  "in_game_name": "...",
  "answers": {
    "q_why_join": "...",
    "q_contribution": "...",
    "q_secret_kept": "...",
    "q_sponsor": "..."
  }
}
```

---

## Environment Variables

Create a `.env.local` file:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
IP_HASH_SALT=change-this-to-a-random-secret
```

> ⚠️ **Never commit `.env.local`** — add it to `.gitignore`.  
> On Netlify, set these as **Environment Variables** in the site settings.

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run schema against your Supabase project
# Paste supabase/schema.sql into the Supabase SQL Editor and run

# 3. Start dev server
npm run dev

# 4. Load the extension in Chrome
# chrome://extensions → Enable Developer Mode → Load Unpacked → select /public
```

---

## Phase 2 — Complete ✅

| File | Feature |
|---|---|
| `src/lib/paystack.ts` | HMAC-SHA512 webhook verification + Paystack API client |
| `src/lib/license.ts` | Idempotent license key generator + provisioner |
| `src/lib/email.ts` | Transactional email via Resend + gothic key delivery template |
| `src/app/api/webhooks/paystack/route.ts` | Paystack `charge.success` webhook with 5-layer security |
| `src/app/api/checkout/initialize/route.ts` | Server-side checkout initializer (secret key never exposed) |
| `src/app/api/member/me/route.ts` | Member profile + rank-gated tasks for Inner Sanctum |
| `src/app/api/treasury/summary/route.ts` | Aggregated treasury stats + top contributors |
| `src/app/api/admin/petitions/route.ts` | Admin: list petitions with status filter |
| `src/app/api/admin/petitions/[id]/route.ts` | Admin: review + accept/reject/waitlist |
| `src/app/(mod)/checkout/page.tsx` | Mobile-first checkout landing page |
| `src/app/(admin)/dashboard/page.tsx` | Grand Master admin dashboard |
| `src/middleware.ts` | Edge middleware: HTTPS redirect + full security headers (CSP/HSTS) |
| `supabase/schema_additions.sql` | Treasury RPC, Paystack event log, checkout sessions table |

## Paystack Integration Flow

```
User picks tier on /checkout
      ↓
POST /api/checkout/initialize  (server generates reference + calls Paystack)
      ↓
Paystack hosted checkout (user pays)
      ↓
Paystack fires POST /api/webhooks/paystack
      ↓
[1] IP allowlist check
[2] HMAC-SHA512 signature verification
[3] Re-verify reference against Paystack API
[4] Idempotency guard (won't double-provision)
[5] Provision license key in Supabase
[6] Email key to buyer via Resend
```

## Phase 3 — Complete ✅

| File | Feature |
|---|---|
| `src/app/api/member/register/route.ts` | Member registration flow (license key → member account + session) |
| `src/app/api/tasks/complete/route.ts` | Task completion endpoint with `award_prestige` promotion RPC trigger |
| `src/app/api/leaderboard/route.ts` | Lodge prestige leaderboard API |
| `public/extension-firefox/manifest.json` | Firefox MV3 extension manifest with `gecko` settings |
| `supabase/seed_tasks.sql` | Seed script for initial Lodge secret tasks across tiers |

## What Remains for Production Deployment & Operation

1. **Install Node.js runtime on your machine:**
   - Node.js & npm are not yet installed on this PC. Download and install [Node.js LTS](https://nodejs.org/).
   - Once installed, open a terminal in `lagos-mod/` and run:
     ```bash
     npm install
     ```
2. **Execute Database Migrations on Supabase:**
   - Run `supabase/schema.sql` (Tables, ENUMs, RLS, functions)
   - Run `supabase/schema_additions.sql` (Treasury RPC, webhook tracking)
   - Run `supabase/seed_tasks.sql` (Default rank quests)
3. **Configure Environment Variables (`.env.local`):**
   - Copy `.env.example` to `.env.local` and add your Paystack live keys, Supabase service role key, and Resend API key.
4. **Deploy to Netlify:**
   - Push to Git and link to Netlify (Next.js runtime is configured).
   - Set up the Paystack Webhook URL pointing to `https://your-domain.netlify.app/api/webhooks/paystack`.
5. **Load Browser Extension:**
   - **Chrome / Edge / Brave:** Go to `chrome://extensions`, enable Developer Mode, select **Load Unpacked**, and choose `public/`.
   - **Firefox:** Go to `about:debugging#/runtime/this-firefox`, select **Load Temporary Add-on**, and choose `public/extension-firefox/manifest.json`.
