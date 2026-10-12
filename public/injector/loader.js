// public/injector/loader.js
// Lagos Life Secret Society Mod — Browser Extension Content Script
//
// Injected into lagoslife.app pages by the extension's manifest.json.
// Uses Shadow DOM for full CSS isolation from the host app.

(async function LagosLodgeMod() {
  'use strict';

  // ── 1. Check if already initialised ──────────────────────
  if (document.getElementById('lodge-mod-root')) return;

  const MOD_API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('netlify.app')
    ? `${window.location.origin}/api`
    : 'https://your-netlify-app.netlify.app/api';

  const STORAGE_KEY_LICENSE = 'lodge_license_key';
  const STORAGE_KEY_SESSION = 'lodge_session_token';
  const STORAGE_KEY_TIER    = 'lodge_tier';

  // ── 2. Retrieve stored license key ───────────────────────
  let licenseKey = localStorage.getItem(STORAGE_KEY_LICENSE);

  // If running as extension, also check chrome.storage
  if (!licenseKey && typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    try {
      const sync = await chrome.storage.local.get([STORAGE_KEY_LICENSE]);
      if (sync && sync[STORAGE_KEY_LICENSE]) {
        licenseKey = sync[STORAGE_KEY_LICENSE];
        localStorage.setItem(STORAGE_KEY_LICENSE, licenseKey);
      }
    } catch (_) {}
  }

  // If running in development / test simulator or test key provided, allow instant unlock
  const isDevTest = licenseKey === 'TEST-DEV-KEY-1234' || window.location.pathname.includes('test-game');

  if (!licenseKey && !isDevTest) {
    console.info('[Lodge Mod] No license key found. Click the extension icon in your toolbar to activate your key.');
    return;
  }

  // ── 3. Verify license with backend (with dev simulator fallback) ────
  let sessionToken = localStorage.getItem(STORAGE_KEY_SESSION);

  if (isDevTest) {
    console.info('[Lodge Mod] Dev Simulator Mode: Active.');
    if (!localStorage.getItem(STORAGE_KEY_TIER)) {
      localStorage.setItem(STORAGE_KEY_TIER, 'lifetime');
    }
  } else if (licenseKey) {
    try {
      const res = await fetch(`${MOD_API_BASE}/license/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, userAgent: navigator.userAgent }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          sessionToken = data.sessionToken;
          localStorage.setItem(STORAGE_KEY_SESSION, sessionToken);
          localStorage.setItem(STORAGE_KEY_TIER, data.tier || 'standard');
        } else {
          console.warn('[Lodge Mod] Invalid license:', data.message);
          return;
        }
      } else {
        console.warn('[Lodge Mod] License endpoint error:', res.status);
      }
    } catch (err) {
      console.warn('[Lodge Mod] License check network error, proceeding in offline mode:', err);
    }
  }

  // ── 4. Build isolated Shadow DOM root ─────────────────────
  const hostEl = document.createElement('div');
  hostEl.id = 'lodge-mod-root';
  Object.assign(hostEl.style, {
    position: 'fixed',
    bottom: '0',
    right: '0',
    width: '0',
    height: '0',
    zIndex: '2147483647',
    pointerEvents: 'none',
  });
  document.body.appendChild(hostEl);

  const shadow = hostEl.attachShadow({ mode: 'open' });

  // ── 5. Scoped Styles ──────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :host { all: initial; font-family: 'Georgia', serif; }

    /* ── Emblem FAB ── */
    #lodge-fab {
      position: fixed;
      bottom: 24px;
      right: 20px;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #f0c040, #96751c);
      box-shadow: 0 6px 20px rgba(0,0,0,0.6), inset 0 2px 3px rgba(255,255,255,0.4);
      cursor: pointer;
      pointer-events: auto !important;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
      border: 2px solid #ffe57f;
      z-index: 2147483646;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }
    #lodge-fab:hover {
      transform: scale(1.08);
      box-shadow: 0 8px 24px rgba(212, 175, 55, 0.4);
    }
    #lodge-fab:active { transform: scale(0.92); }
    #lodge-fab svg { width: 32px; height: 32px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4)); }

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
      pointer-events: auto !important;
      overflow: hidden;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      box-shadow: 0 -10px 40px rgba(0,0,0,0.8);
    }
    #lodge-drawer.open { transform: translateY(0); }

    .drawer-handle {
      width: 44px; height: 5px;
      background: #d4af37;
      border-radius: 3px;
      margin: 12px auto 8px;
      flex-shrink: 0;
      cursor: pointer;
    }

    .drawer-tabs {
      display: flex;
      border-bottom: 1px solid #2a2518;
      flex-shrink: 0;
    }
    .drawer-tab {
      flex: 1;
      padding: 12px 6px;
      font-size: 11px;
      color: #8b7320;
      text-align: center;
      cursor: pointer;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      transition: color 0.2s;
      user-select: none;
      background: none;
      border: none;
      font-family: inherit;
    }
    .drawer-tab.active {
      color: #d4af37;
      font-weight: bold;
      border-bottom: 2px solid #d4af37;
    }

    .drawer-panel {
      display: none;
      flex: 1;
      overflow-y: auto;
      padding: 20px 16px 32px;
      color: #e8d98c;
    }
    .drawer-panel.active { display: block; }

    .sanctum-rank {
      font-size: 22px;
      color: #d4af37;
      text-align: center;
      margin-bottom: 4px;
      letter-spacing: 0.1em;
      font-weight: bold;
      text-transform: uppercase;
    }
    .sanctum-prestige {
      font-size: 13px;
      color: #a08030;
      text-align: center;
      margin-bottom: 24px;
      letter-spacing: 0.05em;
    }

    .petition-label {
      display: block;
      font-size: 11px;
      color: #a08030;
      margin-bottom: 5px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .petition-input, .petition-textarea {
      width: 100%;
      background: #1a1810;
      border: 1px solid #3a3020;
      border-radius: 8px;
      color: #e8d98c;
      padding: 10px 12px;
      font-size: 13px;
      margin-bottom: 14px;
      font-family: inherit;
      outline: none;
    }
    .petition-input:focus, .petition-textarea:focus { border-color: #d4af37; }
    .petition-textarea { resize: vertical; min-height: 64px; }

    .btn-gold {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #d4af37, #8b7320);
      color: #0f0e0c;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      letter-spacing: 0.08em;
      cursor: pointer;
      margin-top: 8px;
      font-family: inherit;
      text-transform: uppercase;
    }
    .btn-gold:active { transform: scale(0.98); opacity: 0.9; }

    .treasury-total {
      font-size: 32px;
      color: #d4af37;
      text-align: center;
      margin-bottom: 4px;
      font-weight: bold;
    }
    .treasury-label {
      font-size: 11px;
      color: #a08030;
      text-align: center;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .treasury-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #1a1810;
      font-size: 13px;
    }
    .treasury-amount { color: #d4af37; font-weight: bold; }

    #lodge-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      pointer-events: auto !important;
      display: none;
      z-index: 2147483646;
      backdrop-filter: blur(2px);
    }
    #lodge-overlay.visible { display: block; }
  `;

  // ── 6. Compass & Square SVG ───────────────────────────────
  const compassSVG = `
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 36 L10 12 L34 12" stroke="#0f0e0c" stroke-width="3.5"
            stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <line x1="24" y1="8" x2="15" y2="38" stroke="#0f0e0c" stroke-width="3"
            stroke-linecap="round"/>
      <line x1="24" y1="8" x2="33" y2="38" stroke="#0f0e0c" stroke-width="3"
            stroke-linecap="round"/>
      <circle cx="24" cy="8" r="3" fill="#0f0e0c"/>
      <text x="24" y="27" text-anchor="middle" dominant-baseline="middle"
            font-family="Georgia,serif" font-size="12" fill="#0f0e0c" font-weight="900">G</text>
    </svg>
  `;

  // ── 7. Render HTML ────────────────────────────────────────
  shadow.innerHTML = `
    <style>${style.textContent}</style>
    <div id="lodge-overlay"></div>

    <button id="lodge-fab" aria-label="Open Secret Lodge" title="Secret Lodge">
      ${compassSVG}
    </button>

    <div id="lodge-drawer" role="dialog" aria-modal="true" aria-label="The Inner Sanctum">
      <div class="drawer-handle" id="lodge-drag-handle"></div>

      <div class="drawer-tabs">
        <button class="drawer-tab active" data-panel="sanctum">Inner Sanctum</button>
        <button class="drawer-tab" data-panel="petition">Petition</button>
        <button class="drawer-tab" data-panel="treasury">Treasury</button>
      </div>

      <div class="drawer-panel active" id="panel-sanctum">
        <div class="sanctum-rank" id="sanctum-rank">Novice Brother</div>
        <div class="sanctum-prestige" id="sanctum-prestige">150 Prestige Points</div>
        <div id="sanctum-tasks" style="space-y: 8px;">
          <div style="background:#1a1810;border:1px solid #2a2518;padding:12px;border-radius:8px;margin-bottom:8px;">
            <div style="color:#d4af37;font-size:13px;font-weight:bold;">⬡ The Silent Observer</div>
            <div style="color:#8b7320;font-size:12px;margin-top:2px;">Visit three districts in Lagos Life without speaking.</div>
            <div style="color:#a08030;font-size:11px;margin-top:6px;">Reward: +50 Prestige</div>
          </div>
          <div style="background:#1a1810;border:1px solid #2a2518;padding:12px;border-radius:8px;">
            <div style="color:#d4af37;font-size:13px;font-weight:bold;">⬡ The Foundation Stone</div>
            <div style="color:#8b7320;font-size:12px;margin-top:2px;">Contribute your first offering to the Lodge Treasury.</div>
            <div style="color:#a08030;font-size:11px;margin-top:6px;">Reward: +100 Prestige</div>
          </div>
        </div>
      </div>

      <div class="drawer-panel" id="panel-petition">
        <form id="petition-form">
          <label class="petition-label">Your In-Game Character Name</label>
          <input class="petition-input" name="applicant_name" placeholder="Name" required value="Initiate Player" />

          <label class="petition-label">Email Address</label>
          <input class="petition-input" type="email" name="email" placeholder="you@example.com" required value="brother@lagoslife.local" />

          <label class="petition-label">Lagos Life Username</label>
          <input class="petition-input" name="in_game_name" placeholder="Username" required value="LagosPlayer1" />

          <label class="petition-label">Why do you seek entry into the Lodge?</label>
          <textarea class="petition-textarea" name="q_why_join" required>I seek fellowship, power, and brotherhood among the elite.</textarea>

          <label class="petition-label">What will you bring to the Brotherhood?</label>
          <textarea class="petition-textarea" name="q_contribution" required>Dedication, loyalty, and silence in all affairs.</textarea>

          <label class="petition-label">Describe a secret you have kept.</label>
          <textarea class="petition-textarea" name="q_secret_kept" required>The hidden passage beneath the old district port.</textarea>

          <button type="submit" class="btn-gold">⬡ Submit Petition</button>
          <p id="petition-msg" style="text-align:center;font-size:12px;margin-top:10px;min-height:18px;"></p>
        </form>
      </div>

      <div class="drawer-panel" id="panel-treasury">
        <div class="treasury-total" id="treasury-total">₦145,000</div>
        <div class="treasury-label">Lodge Total Contributions</div>
        <div id="treasury-rows">
          <div class="treasury-row"><span>🪙 Gold Coins</span><span class="treasury-amount">45,200</span></div>
          <div class="treasury-row"><span>⭐ Prestige Points</span><span class="treasury-amount">12,850</span></div>
          <div class="treasury-row"><span>₦ Real Currency</span><span class="treasury-amount">₦145,000</span></div>
          <div class="treasury-row"><span>🕯️ Ritual Items</span><span class="treasury-amount">24</span></div>
        </div>
      </div>
    </div>
  `;

  // ── 8. Elements & Listeners ─────────────────────────────────
  const fab      = shadow.getElementById('lodge-fab');
  const drawer   = shadow.getElementById('lodge-drawer');
  const overlay  = shadow.getElementById('lodge-overlay');
  const handle   = shadow.getElementById('lodge-drag-handle');
  const tabs     = shadow.querySelectorAll('.drawer-tab');
  const panels   = shadow.querySelectorAll('.drawer-panel');

  function openDrawer() {
    drawer?.classList.add('open');
    overlay?.classList.add('visible');
    loadRealSanctumData();
  }

  function closeDrawer() {
    drawer?.classList.remove('open');
    overlay?.classList.remove('visible');
  }

  fab?.addEventListener('click', openDrawer);
  overlay?.addEventListener('click', closeDrawer);
  handle?.addEventListener('click', closeDrawer);

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      const target = tab.getAttribute('data-panel');
      tabs.forEach(function(t) { t.classList.remove('active'); });
      panels.forEach(function(p) { p.classList.remove('active'); });
      tab.classList.add('active');
      shadow.getElementById('panel-' + target)?.classList.add('active');
    });
  });

  // ── 9. Fetch Live API Data if available ────────────────────
  async function loadRealSanctumData() {
    if (!sessionToken) return;
    try {
      const res = await fetch(`${MOD_API_BASE}/member/me`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      if (res.ok) {
        const member = await res.json();
        const rankEl = shadow.getElementById('sanctum-rank');
        const prestigeEl = shadow.getElementById('sanctum-prestige');
        if (rankEl && member.rank) rankEl.textContent = member.rank.replace(/_/g, ' ').toUpperCase();
        if (prestigeEl && member.prestige_points !== undefined) {
          prestigeEl.textContent = member.prestige_points.toLocaleString() + ' Prestige Points';
        }
      }
    } catch (_) { /* Keep defaults */ }
  }

  // ── 10. Form submission ─────────────────────────────────────
  shadow.getElementById('petition-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = e.target;
    const msgEl = shadow.getElementById('petition-msg');
    if (!msgEl) return;

    msgEl.style.color = '#d4af37';
    msgEl.textContent = 'Submitting petition to the Grand Lodge…';

    const fd = new FormData(form);
    const payload = {
      applicant_name: fd.get('applicant_name'),
      email: fd.get('email'),
      in_game_name: fd.get('in_game_name'),
      answers: {
        q_why_join: fd.get('q_why_join'),
        q_contribution: fd.get('q_contribution'),
        q_secret_kept: fd.get('q_secret_kept'),
        q_sponsor: 'None'
      }
    };

    try {
      const res = await fetch(`${MOD_API_BASE}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        msgEl.style.color = '#d4af37';
        msgEl.textContent = '✓ Petition received. The Brotherhood watches.';
      } else {
        msgEl.style.color = '#ff6b6b';
        msgEl.textContent = data.message || data.error;
      }
    } catch (_) {
      msgEl.style.color = '#d4af37';
      msgEl.textContent = '✓ Petition simulated. The Lodge has acknowledged you.';
    }
  });

  console.info('[Lodge Mod] Injector mounted. The Brotherhood is watching.');
})();
