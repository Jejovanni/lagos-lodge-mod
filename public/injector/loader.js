// public/injector/loader.js
// Lagos Life Secret Society Mod — Browser Extension Content Script
//
// Injected into lagoslife.app pages by the extension's manifest.json.
// Uses Shadow DOM for full CSS isolation from the host app.
//
// Flow:
//   1. Validate stored license key against mod API
//   2. Inject the compass-and-square emblem FAB into the page
//   3. Tapping the emblem opens the slide-up Inner Sanctum drawer

(async function LagosLodgeMod() {
  'use strict';

  // If hosted on Netlify, uses window.location.origin, otherwise falls back to configured host
  const MOD_API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('netlify.app')
    ? `${window.location.origin}/api`
    : 'https://your-netlify-app.netlify.app/api';
  const STORAGE_KEY_LICENSE = 'lodge_license_key';
  const STORAGE_KEY_SESSION = 'lodge_session_token';
  const STORAGE_KEY_TIER    = 'lodge_tier';

  // ── 1. Check if already initialised ──────────────────────
  if (document.getElementById('lodge-mod-root')) return;

  // ── 2. Retrieve stored license key ───────────────────────
  const licenseKey = localStorage.getItem(STORAGE_KEY_LICENSE);
  if (!licenseKey) {
    console.info('[Lodge Mod] No license key found. Mod inactive.');
    return;
  }

  // ── 3. Verify license with backend ───────────────────────
  let sessionToken = localStorage.getItem(STORAGE_KEY_SESSION);

  try {
    const res = await fetch(`${MOD_API_BASE}/license/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey, userAgent: navigator.userAgent }),
    });

    if (!res.ok) {
      console.warn('[Lodge Mod] License verification failed (HTTP error).');
      return;
    }

    const data = await res.json();

    if (!data.valid) {
      console.warn('[Lodge Mod] Invalid license:', data.message);
      return;
    }

    sessionToken = data.sessionToken;
    localStorage.setItem(STORAGE_KEY_SESSION, sessionToken);
    localStorage.setItem(STORAGE_KEY_TIER, data.tier ?? 'standard');
  } catch (err) {
    console.error('[Lodge Mod] Network error during verification:', err);
    return;
  }

  // ── 4. Build isolated Shadow DOM root ─────────────────────
  const hostEl = document.createElement('div');
  hostEl.id = 'lodge-mod-root';
  // Position outside normal flow — won't shift game content
  Object.assign(hostEl.style, {
    position: 'fixed',
    bottom: '0',
    left: '0',
    width: '0',
    height: '0',
    zIndex: '2147483647', // max z-index
    pointerEvents: 'none',
  });
  document.body.appendChild(hostEl);

  const shadow = hostEl.attachShadow({ mode: 'closed' });

  // ── 5. Styles (scoped inside Shadow DOM) ──────────────────
  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; font-family: 'Georgia', serif; }

    /* ── Emblem FAB ── */
    #lodge-fab {
      position: fixed;
      bottom: 24px;
      right: 20px;
      width: 56px;
      height: 56px;
      min-width: 44px;  /* WCAG touch target */
      min-height: 44px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #d4af37, #8b7320);
      box-shadow: 0 4px 16px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,220,100,0.4);
      cursor: pointer;
      pointer-events: all;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border: 2px solid #f0c040;
      z-index: 1;
    }
    #lodge-fab:active { transform: scale(0.93); }
    #lodge-fab svg { width: 28px; height: 28px; }

    /* ── Slide-up Drawer ── */
    #lodge-drawer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      max-height: 85vh;
      background: #0f0e0c;
      border-top: 2px solid #d4af37;
      border-radius: 20px 20px 0 0;
      transform: translateY(100%);
      transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
      pointer-events: all;
      overflow: hidden;
      z-index: 2;
      display: flex;
      flex-direction: column;
    }
    #lodge-drawer.open { transform: translateY(0); }

    /* drag handle */
    .drawer-handle {
      width: 40px; height: 4px;
      background: #d4af37;
      border-radius: 2px;
      margin: 12px auto 8px;
      flex-shrink: 0;
    }

    /* Tab bar */
    .drawer-tabs {
      display: flex;
      border-bottom: 1px solid #2a2518;
      flex-shrink: 0;
    }
    .drawer-tab {
      flex: 1;
      padding: 10px 4px;
      font-size: 11px;
      color: #8b7320;
      text-align: center;
      cursor: pointer;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      transition: color 0.2s;
      user-select: none;
      background: none;
      border: none;
    }
    .drawer-tab.active {
      color: #d4af37;
      border-bottom: 2px solid #d4af37;
    }

    /* Panel */
    .drawer-panel {
      display: none;
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      color: #e8d98c;
    }
    .drawer-panel.active { display: block; }

    /* Inner Sanctum */
    .sanctum-rank {
      font-size: 20px;
      color: #d4af37;
      text-align: center;
      margin-bottom: 4px;
      letter-spacing: 0.1em;
    }
    .sanctum-prestige {
      font-size: 13px;
      color: #a08030;
      text-align: center;
      margin-bottom: 24px;
    }

    /* Petition form */
    .petition-label {
      display: block;
      font-size: 12px;
      color: #a08030;
      margin-bottom: 4px;
      letter-spacing: 0.06em;
    }
    .petition-input, .petition-textarea {
      width: 100%;
      background: #1a1810;
      border: 1px solid #3a3020;
      border-radius: 6px;
      color: #e8d98c;
      padding: 10px 12px;
      font-size: 14px;
      margin-bottom: 14px;
      box-sizing: border-box;
      font-family: inherit;
      outline: none;
    }
    .petition-input:focus, .petition-textarea:focus {
      border-color: #d4af37;
    }
    .petition-textarea { resize: vertical; min-height: 72px; }

    .btn-gold {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #d4af37, #8b7320);
      color: #0f0e0c;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: bold;
      letter-spacing: 0.08em;
      cursor: pointer;
      margin-top: 8px;
      font-family: inherit;
    }
    .btn-gold:active { opacity: 0.85; }

    /* Treasury */
    .treasury-total {
      font-size: 28px;
      color: #d4af37;
      text-align: center;
      margin-bottom: 4px;
    }
    .treasury-label {
      font-size: 12px;
      color: #a08030;
      text-align: center;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .treasury-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #1a1810;
      font-size: 13px;
    }
    .treasury-row:last-child { border-bottom: none; }
    .treasury-amount { color: #d4af37; }

    /* Overlay */
    #lodge-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      pointer-events: all;
      display: none;
      z-index: 1;
    }
    #lodge-overlay.visible { display: block; }

    /* Scrollbar */
    .drawer-panel::-webkit-scrollbar { width: 4px; }
    .drawer-panel::-webkit-scrollbar-track { background: transparent; }
    .drawer-panel::-webkit-scrollbar-thumb { background: #3a3020; border-radius: 2px; }
  `;

  // ── 6. Compass & Square SVG ───────────────────────────────
  const compassSVG = `
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Square (builder's square) -->
      <path d="M10 36 L10 12 L34 12" stroke="#f0c040" stroke-width="3"
            stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <!-- Compass arms -->
      <line x1="24" y1="8"  x2="16" y2="38" stroke="#f0c040" stroke-width="2.5"
            stroke-linecap="round"/>
      <line x1="24" y1="8"  x2="32" y2="38" stroke="#f0c040" stroke-width="2.5"
            stroke-linecap="round"/>
      <!-- Compass hinge -->
      <circle cx="24" cy="8" r="2.5" fill="#f0c040"/>
      <!-- G -->
      <text x="24" y="28" text-anchor="middle" dominant-baseline="middle"
            font-family="Georgia,serif" font-size="11" fill="#f0c040" font-weight="bold">G</text>
    </svg>
  `;

  // ── 7. Render HTML into Shadow DOM ────────────────────────
  const tier = localStorage.getItem(STORAGE_KEY_TIER) ?? 'standard';

  shadow.innerHTML = `
    <style>${style.textContent}</style>

    <div id="lodge-overlay"></div>

    <button id="lodge-fab" aria-label="Open Secret Lodge" title="Secret Lodge">
      ${compassSVG}
    </button>

    <div id="lodge-drawer" role="dialog" aria-modal="true" aria-label="The Inner Sanctum">
      <div class="drawer-handle"></div>

      <div class="drawer-tabs">
        <button class="drawer-tab active" data-panel="sanctum">Inner Sanctum</button>
        <button class="drawer-tab" data-panel="petition">Petition</button>
        <button class="drawer-tab" data-panel="treasury">Treasury</button>
      </div>

      <!-- PANEL: Inner Sanctum -->
      <div class="drawer-panel active" id="panel-sanctum">
        <div class="sanctum-rank" id="sanctum-rank">Novice</div>
        <div class="sanctum-prestige" id="sanctum-prestige">0 Prestige Points</div>
        <div id="sanctum-tasks">
          <p style="color:#4a4030;font-size:13px;text-align:center;">Loading your tasks…</p>
        </div>
      </div>

      <!-- PANEL: Petition Portal -->
      <div class="drawer-panel" id="panel-petition">
        <form id="petition-form">
          <label class="petition-label">Your Name</label>
          <input class="petition-input" name="applicant_name" placeholder="Full name" required />

          <label class="petition-label">Email Address</label>
          <input class="petition-input" type="email" name="email" placeholder="you@example.com" required />

          <label class="petition-label">In-Game Name</label>
          <input class="petition-input" name="in_game_name" placeholder="Your Lagos Life username" required />

          <label class="petition-label">Why do you seek entry into the Lodge?</label>
          <textarea class="petition-textarea" name="q_why_join" placeholder="Speak freely…" required></textarea>

          <label class="petition-label">What will you bring to the Brotherhood?</label>
          <textarea class="petition-textarea" name="q_contribution" required></textarea>

          <label class="petition-label">Describe a secret you have kept — and why.</label>
          <textarea class="petition-textarea" name="q_secret_kept" required></textarea>

          <label class="petition-label">Sponsor within the Lodge (if any)</label>
          <input class="petition-input" name="q_sponsor" placeholder="Leave blank if none" />

          <button type="submit" class="btn-gold">⬡ Submit Petition</button>
          <p id="petition-msg" style="text-align:center;font-size:13px;margin-top:12px;min-height:20px;"></p>
        </form>
      </div>

      <!-- PANEL: Lodge Treasury -->
      <div class="drawer-panel" id="panel-treasury">
        <div class="treasury-total" id="treasury-total">—</div>
        <div class="treasury-label">Lodge Total Contributions</div>
        <div id="treasury-rows">
          <p style="color:#4a4030;font-size:13px;text-align:center;">Loading treasury…</p>
        </div>
      </div>
    </div>
  `;

  // Remove the inline style element (already embedded above)
  // Re-grab refs from shadow
  const fab      = shadow.getElementById('lodge-fab');
  const drawer   = shadow.getElementById('lodge-drawer');
  const overlay  = shadow.getElementById('lodge-overlay');
  const tabs     = shadow.querySelectorAll('.drawer-tab');
  const panels   = shadow.querySelectorAll('.drawer-panel');

  // ── 8. Open / close logic ─────────────────────────────────
  function openDrawer() {
    drawer?.classList.add('open');
    overlay?.classList.add('visible');
    loadSanctumData();
  }
  function closeDrawer() {
    drawer?.classList.remove('open');
    overlay?.classList.remove('visible');
  }

  fab?.addEventListener('click', openDrawer);
  overlay?.addEventListener('click', closeDrawer);

  // Tab switching
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = (tab as HTMLElement).dataset['panel'];
      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      shadow.getElementById(`panel-${target}`)?.classList.add('active');
      if (target === 'treasury') loadTreasuryData();
    });
  });

  // ── 9. Load member data from API ──────────────────────────
  async function apiFetch(path) {
    return fetch(`${MOD_API_BASE}${path}`, {
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async function loadSanctumData() {
    try {
      const res = await apiFetch('/member/me');
      if (!res.ok) return;
      const member = await res.json();
      const rankEl = shadow.getElementById('sanctum-rank');
      const prestigeEl = shadow.getElementById('sanctum-prestige');
      if (rankEl) rankEl.textContent = member.rank?.replace(/_/g, ' ')?.toUpperCase() ?? 'Novice';
      if (prestigeEl) prestigeEl.textContent = `${(member.prestige_points ?? 0).toLocaleString()} Prestige Points`;
    } catch (_) { /* silent fail */ }
  }

  async function loadTreasuryData() {
    try {
      const res = await apiFetch('/treasury/summary');
      if (!res.ok) return;
      const data = await res.json();
      const totalEl = shadow.getElementById('treasury-total');
      const rowsEl  = shadow.getElementById('treasury-rows');
      if (totalEl) totalEl.textContent = data.grand_total ?? '—';
      if (rowsEl && Array.isArray(data.by_type)) {
        rowsEl.innerHTML = data.by_type.map((row) =>
          `<div class="treasury-row">
             <span>${row.label}</span>
             <span class="treasury-amount">${row.total}</span>
           </div>`
        ).join('');
      }
    } catch (_) { /* silent fail */ }
  }

  // ── 10. Petition form submit ──────────────────────────────
  shadow.getElementById('petition-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const msgEl = shadow.getElementById('petition-msg');
    if (!(form instanceof HTMLFormElement) || !msgEl) return;

    const fd = new FormData(form);
    const payload = {
      applicant_name: fd.get('applicant_name'),
      email:          fd.get('email'),
      in_game_name:   fd.get('in_game_name'),
      answers: {
        q_why_join:    fd.get('q_why_join'),
        q_contribution: fd.get('q_contribution'),
        q_secret_kept: fd.get('q_secret_kept'),
        q_sponsor:     fd.get('q_sponsor') || 'None',
      },
    };

    msgEl.style.color = '#a08030';
    msgEl.textContent = 'Submitting your petition…';

    try {
      const res = await fetch(`${MOD_API_BASE}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        msgEl.style.color = '#d4af37';
        msgEl.textContent = data.message;
        form.reset();
      } else {
        msgEl.style.color = '#c0392b';
        msgEl.textContent = data.message || data.error;
      }
    } catch (_) {
      msgEl.style.color = '#c0392b';
      msgEl.textContent = 'Network error. Please try again.';
    }
  });

  // ── Done ──────────────────────────────────────────────────
  console.info(`[Lodge Mod] Activated. Tier: ${tier}. The Brotherhood watches.`);
})();
