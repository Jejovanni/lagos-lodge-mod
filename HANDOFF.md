# Project Handoff Document: Lagos Life — Secret Lodge Mod

**Date:** October 14, 2026  
**Repository:** `Jejovanni/lagos-lodge-mod`  
**Current Branch:** `main` (clean / working changes ready in extension files)  
**Target Game:** [Lagos Life](https://lagoslife.app) (Isometric browser web game using Three.js r186)

---

## 1. Executive Summary & Purpose

The **Lagos Life Secret Lodge Mod** is a Freemason-inspired secret society modification and platform for the browser-based game *Lagos Life* (`https://lagoslife.app`).

The project has two major integrated components:
1. **The Web & Backend Platform (Next.js 14 App Router + Supabase + Paystack):**
   - Handles membership license purchases, tiered pricing (Initiate, Craftsman, Master Mason), instant key provisioning, transactional email via Resend, member authentication, ranking/prestige mechanics, and an Admin Grand Master dashboard.
2. **The Browser Extension (MV3 Chrome/Edge/Brave & Firefox):**
   - Injected into `https://lagoslife.app/*`.
   - Renders a gothic gold Floating Action Button (FAB) and isolated Shadow DOM drawer containing the **Inner Sanctum**, **Petition Portal**, **Treasury**, and in-game mod options.
   - Includes custom in-game character model/mesh hooks (e.g. **Cloak of Shadows** robe feature).

---

## 2. Tech Stack & Architecture

### Backend & Web Application
* **Framework:** Next.js 14 (App Router), React, TypeScript.
* **Styling:** Tailwind CSS, PostCSS, dark gothic/masonic color palette (obsidian `#0a0907`, gold `#d4af37`, slate).
* **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS) policies, RPC functions, and SHA-256 hashed license lookups.
* **Payments:** Paystack API & Webhook (`charge.success`) with HMAC-SHA512 verification, IP allowlist checking, and idempotency tracking.
* **Email:** Resend API for delivering license keys upon purchase.
* **Deployment Target:** Netlify (`@netlify/plugin-nextjs`).

### Browser Extension Mod
* **Target Spec:** Manifest V3 (Chrome, Edge, Brave, Opera) and Firefox MV3 manifest.
* **Isolation:** Content script creates a custom `#lodge-mod-root` with an isolated Shadow DOM (`attachShadow({ mode: 'open' })`) preventing stylesheet collisions with the game's CSS.
* **In-Game Engine Target:** Three.js r186 bundled in a compiled React PWA. Assets are cached locally via CacheStorage under `'ll-assets-v1'`.

---

## 3. Directory Structure & Key Files

```
lagos-mod/
├── public/
│   ├── manifest.json              # Chrome/Edge MV3 extension manifest
│   ├── extension-firefox/
│   │   └── manifest.json          # Firefox-specific MV3 manifest
│   ├── injector/
│   │   ├── loader.js              # Content script injecting the Shadow DOM FAB & Lodge Drawer
│   │   └── cloak-hook.js          # Main-world script intercepting GLB & model rendering
│   └── popup/
│       ├── index.html             # Extension browser toolbar popup
│       └── popup.js               # Popup logic & license status display
├── src/
│   ├── app/
│   │   ├── (admin)/
│   │   │   ├── layout.tsx         # Admin dashboard layout
│   │   │   └── dashboard/page.tsx # Grand Master admin dashboard (petitions, member stats)
│   │   ├── (mod)/
│   │   │   ├── checkout/
│   │   │   │   ├── page.tsx       # Tier selection and payment checkout page
│   │   │   │   └── success/page.tsx # Post-payment confirmation page
│   │   │   └── sanctum/page.tsx   # Inner Sanctum member portal
│   │   ├── api/
│   │   │   ├── checkout/initialize/route.ts # Server-side Paystack transaction init
│   │   │   ├── webhooks/paystack/route.ts  # Webhook handler (HMAC verified, provisions keys)
│   │   │   ├── license/verify/route.ts      # Extension heartbeat license validator
│   │   │   ├── member/
│   │   │   │   ├── me/route.ts              # Member profile & task status
│   │   │   │   └── register/route.ts        # Turn license key into active member
│   │   │   ├── tasks/complete/route.ts      # Award prestige & handle rank promotions
│   │   │   ├── treasury/summary/route.ts    # Treasury aggregates & top contributors
│   │   │   ├── leaderboard/route.ts         # Lodge ranking leaderboard
│   │   │   └── admin/petitions/             # Admin petition review endpoints
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   ├── crypto.ts              # SHA-256 key hashing & IP anonymizer
│   │   ├── email.ts               # Resend mailer with gothic key delivery template
│   │   ├── license.ts             # Idempotent license key generator & provisioner
│   │   ├── paystack.ts            # Paystack API client & signature verification
│   │   └── supabase.ts            # Server-side Supabase admin client
│   ├── types/
│   │   └── mod.ts                 # TypeScript types (Member, License, Task, etc.)
│   └── middleware.ts              # Security headers (CSP, HSTS) & HTTPS enforcement
├── supabase/
│   ├── schema.sql                 # Core tables, ENUMs, RLS policies, trigger functions
│   ├── schema_additions.sql       # Treasury RPC, Paystack event log, checkout sessions
│   └── seed_tasks.sql             # Default rank quests and rituals
├── CLOAK_HANDOFF.md               # Detailed technical findings regarding in-game avatar rendering
├── README.md                      # Operational & setup guide
└── .env.example                   # Environment variable template
```

---

## 4. Current Work State & Recent Developments

### A. Core Platform (Phases 1, 2, 3) — Completed & Operational
* Full member licensing and payment flow through Paystack is coded and tested.
* Email delivery via Resend configured.
* Complete database schema with automated promotion triggers (`award_prestige` function).
* Admin Grand Master dashboard built for reviewing petitions and monitoring the treasury.

### B. Recent Feature In Progress: "Cloak of Shadows" (In-Game Sim Robes)
The user requested adding a **mystical gray cloak/robes** over the player's in-game sim character when the mod is enabled.

#### Findings on Lagos Life Character Rendering (`https://lagoslife.app`):
1. **Model Detected:**
   - Active player model URL: `https://lagoslife.app/models/chars/m_casual2.glb` (or `f_casual*.glb`).
   - Meshes inside GLB: `Casual_Body` (Prims: `Purple`, `Skin`), `Casual_Legs` (Prims: `Skin`, `LightBlue`), `Casual_Feet` (`White`, `Purple`), `Casual_Head` (`Skin`, `Eyebrows`, `Eye`, `Hair`).
   - Engine: Three.js r186.
2. **The Gotcha (Why pure GLB file interception is insufficient):**
   - We implemented binary GLB parsing in `public/injector/cloak-hook.js` and successfully modified colors inside the GLB chunk and cache.
   - **However**, the game's compiled React/Three.js runtime dynamically assigns clothing colors in JavaScript after loading the model (e.g. setting material colors / uniforms for equipped clothes like red hoodie, blue shorts, etc.).
3. **Files Modified for this Feature:**
   - `public/manifest.json`: Added `injector/cloak-hook.js` under `content_scripts` (`run_at: "document_start"`, `world: "MAIN"`) and registered under `web_accessible_resources`.
   - `public/injector/cloak-hook.js`: Created to run in main world context, hooking `fetch` and `XMLHttpRequest`.
   - `public/injector/loader.js`: Added the "Cloak of Shadows" toggle banner in the Sanctum drawer (`localStorage.getItem('lodge_cloak_active')`).

---

## 5. Immediate Next Steps / Roadmap for Incoming AI

### Task 1: Complete the Gray Cloak Override
Since runtime JavaScript overrides the GLB materials, use one of the following approaches in `public/injector/cloak-hook.js`:

1. **Option A (Recommended — WebGL Uniform Hook):**
   Hook `WebGLRenderingContext.prototype.uniform3fv` / `uniform4fv` (and WebGL2 equivalent) in `cloak-hook.js` (which already runs in `world: "MAIN"` before Three.js starts).
   Detect when color uniforms matching the character's clothing (e.g. red hoodie RGB `[>0.6, <0.3, <0.3]` or blue shorts `[<0.3, <0.3, >0.5]`) are passed to the shader, and substitute them with slate/charcoal gray `[0.18, 0.20, 0.22]`.
2. **Option B (Three.js Prototype / Material Hook):**
   Intercept `THREE.Mesh.prototype` or `THREE.Material.prototype.onBeforeCompile` to inject custom fragment shader code that recolors `Casual_Body` and `Casual_Legs`.
3. **Option C (Scene Graph Traversal):**
   Hook `THREE.Scene.prototype.add` or `THREE.Object3D.prototype.add` to catch the character root object when added to the scene, then recursively traverse and set `mesh.material.color.setHex(0x2d3134)` on `Casual_Body` and `Casual_Legs`.

### Task 2: Supabase Deployment & Environment Configuration
When ready to test live:
1. Run `supabase/schema.sql`, `supabase/schema_additions.sql`, and `supabase/seed_tasks.sql` in the Supabase project SQL Editor.
2. Fill out `.env.local` using `.env.example`:
   - `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`
   - `PAYSTACK_SECRET_KEY` & `PAYSTACK_PUBLIC_KEY`
   - `RESEND_API_KEY`
   - `ADMIN_SECRET_KEY`

### Task 3: Extension Packaging & Testing
- Unpacked testing:
  - Chrome: `chrome://extensions` → **Developer mode** → **Load unpacked** → select `public/`.
  - Navigate to `https://lagoslife.app`.
  - Verify that the gold compass/square FAB appears on the right edge and opens the Lodge drawer.
  - Test toggling the "Cloak of Shadows" switch.

---

## 6. Helpful Environment & Debugging Context
- The repository is on Windows at: `c:\Users\HP\.gemini\antigravity\scratch\lagos-mod`
- Git remote: `origin/main`
- Detailed GLB mesh breakdown is available in `CLOAK_HANDOFF.md`.
