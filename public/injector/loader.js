// public/injector/loader.js
// Lagos Research Initiative (LRI) — Browser Extension Content Script

(async function LagosLRIMod() {
  'use strict';

  if (document.getElementById('lri-mod-root')) return;

  const MOD_API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('netlify.app')
    ? `${window.location.origin}/api`
    : 'https://your-netlify-app.netlify.app/api';

  const STORAGE_KEY_LICENSE = 'lri_license_key';
  const STORAGE_KEY_SESSION = 'lri_session_token';

  let licenseKey = localStorage.getItem(STORAGE_KEY_LICENSE);
  if (!licenseKey && typeof chrome !== 'undefined' && chrome.storage?.local) {
    try {
      const sync = await chrome.storage.local.get([STORAGE_KEY_LICENSE]);
      if (sync?.[STORAGE_KEY_LICENSE]) {
        licenseKey = sync[STORAGE_KEY_LICENSE];
        localStorage.setItem(STORAGE_KEY_LICENSE, licenseKey);
      }
    } catch (_) { }
  }

  const isDevTest = licenseKey === 'TEST-DEV-KEY-1234' || window.location.pathname.includes('test-game');
  if (!licenseKey && !isDevTest) return;

  let sessionToken = localStorage.getItem(STORAGE_KEY_SESSION);

  // ── Build Isolated Shadow DOM Root ────────────────────────
  const hostEl = document.createElement('div');
  hostEl.id = 'lri-mod-root';
  Object.assign(hostEl.style, {
    position: 'fixed', bottom: '0', right: '0', width: '0', height: '0', zIndex: '2147483647', pointerEvents: 'none',
  });
  document.body.appendChild(hostEl);

  const shadow = hostEl.attachShadow({ mode: 'open' });

  // ── Game-Matched Native Aesthetics (Clean, Soft, Vibrant) ──
  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

    /* LRI Floating Action Button */
    #lri-fab {
      position: fixed; bottom: 90px; right: 20px; width: 50px; height: 50px;
      border-radius: 50%; background: #ffffff;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08);
      cursor: pointer; pointer-events: auto !important; display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease; border: 1px solid #e2e8f0; z-index: 2147483646;
    }
    #lri-fab:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
    #lri-fab svg { width: 24px; height: 24px; fill: #10b981; }

    /* Slide-up Drawer matching game card style */
    #lri-drawer {
      position: fixed; bottom: 0; left: 0; right: 0; max-height: 85vh;
      background: #ffffff; border-top-left-radius: 24px; border-top-right-radius: 24px;
      transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: auto !important; overflow: hidden; z-index: 2147483647;
      display: flex; flex-direction: column; box-shadow: 0 -10px 40px rgba(0,0,0,0.15);
    }
    #lri-drawer.open { transform: translateY(0); }

    .drawer-handle { width: 36px; height: 4px; background: #cbd5e1; border-radius: 2px; margin: 12px auto 8px; cursor: pointer; }

    /* Header & Ledger Row */
    .lri-header { padding: 0 20px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; }
    .lri-title { font-size: 16px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px; }
    .lri-ledger-badge { font-size: 11px; background: #f0fdf4; color: #16a34a; padding: 4px 10px; border-radius: 12px; font-weight: 600; border: 1px solid #bbf7d0; }

    /* Tabs */
    .drawer-tabs { display: flex; background: #f8fafc; padding: 4px; border-bottom: 1px solid #e2e8f0; }
    .drawer-tab {
      flex: 1; padding: 10px; font-size: 12px; font-weight: 600; color: #64748b;
      text-align: center; cursor: pointer; border-radius: 8px; background: none; border: none; transition: all 0.2s;
    }
    .drawer-tab.active { background: #ffffff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }

    .drawer-panel { display: none; flex: 1; overflow-y: auto; padding: 20px; color: #334155; }
    .drawer-panel.active { display: block; }

    /* UI Elements */
    .lri-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .btn-primary {
      width: 100%; padding: 12px; background: #10b981; color: #ffffff; border: none;
      border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;
    }
    .btn-primary:hover { background: #059669; }

    #lri-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px); display: none; z-index: 2147483646; }
    #lri-overlay.visible { display: block; }
  `;

  // ── Render HTML Structure ─────────────────────────────────
  shadow.innerHTML = `
    <style>${style.textContent}</style>
    <div id="lri-overlay"></div>

    <button id="lri-fab" aria-label="Open LRI Dashboard" title="Lagos Research Initiative">
      <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    </button>

    <div id="lri-drawer" role="dialog" aria-modal="true">
      <div class="drawer-handle" id="lri-drag-handle"></div>

      <div class="lri-header">
        <div class="lri-title">🏛️ Lagos Research Initiative</div>
        <div class="lri-ledger-badge" id="member-count-badge">42 Active Fellows</div>
      </div>

      <div class="drawer-tabs">
        <button class="drawer-tab active" data-panel="sanctum">Inner Sanctum</button>
        <button class="drawer-tab" data-panel="elections">Weekly Elections</button>
        <button class="drawer-tab" data-panel="petition">Candidate Lobby</button>
      </div>

      <!-- Tab 1: Inner Sanctum -->
      <div class="drawer-panel active" id="panel-sanctum">
        <div class="lri-card">
          <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Research Rank</div>
          <div style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 4px 0;">Senior Research Fellow</div>
          <div style="font-size: 13px; color: #10b981; font-weight: 500;">1,250 Contribution Points</div>
        </div>
        <div class="lri-card">
          <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 6px;">📊 Active Policy Directives</div>
          <div style="font-size: 13px; color: #475569;">• Audit polling district 001 data flow.<br>• Coordinate regional economic research.</div>
        </div>
      </div>

      <!-- Tab 2: Weekly Elections -->
      <div class="drawer-panel" id="panel-elections">
        <div class="lri-card" style="border-color: #10b981; background: #f0fdf4;">
          <div style="font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 4px;">🗳️ Grand Director Ballot</div>
          <div style="font-size: 12px; color: #15803d; margin-bottom: 12px;">Weekly leadership election ends in 2 days. Cast your vote wisely.</div>
          <button class="btn-primary" id="btn-vote-director">Vote for Syndicate Lead</button>
        </div>
      </div>

      <!-- Tab 3: Candidate Lobby / Petitions -->
      <div class="drawer-panel" id="panel-petition">
        <div class="lri-card">
          <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">🤝 Political Lobbying Portal</div>
          <div style="font-size: 13px; color: #64748b; margin-bottom: 12px;">Candidates running for public office may submit their platform for official LRI research endorsement.</div>
          <input type="text" placeholder="Candidate In-Game Handle" style="width:15px; padding:10px; border:1px solid #cbd5e1; border-radius:8px; margin-bottom:8px; width:100%; font-size:13px;" id="lobby-handle" />
          <textarea placeholder="Outline your political platform..." style="padding:10px; border:1px solid #cbd5e1; border-radius:8px; margin-bottom:12px; width:100%; height:80px; font-size:13px;" id="lobby-platform"></textarea>
          <button class="btn-primary" id="btn-submit-lobby">Submit Platform for Review</button>
        </div>
      </div>
    </div>
  `;

  // ── Basic UI Interactivity Handlers ───────────────────────
  const fab = shadow.getElementById('lri-fab');
  const drawer = shadow.getElementById('lri-drawer');
  const overlay = shadow.getElementById('lri-overlay');
  const handle = shadow.getElementById('lri-drag-handle');
  const tabs = shadow.querySelectorAll('.drawer-tab');
  const panels = shadow.querySelectorAll('.drawer-panel');

  function openDrawer() { drawer?.classList.add('open'); overlay?.classList.add('visible'); }
  function closeDrawer() { drawer?.classList.remove('open'); overlay?.classList.remove('visible'); }

  fab?.addEventListener('click', openDrawer);
  overlay?.addEventListener('click', closeDrawer);
  handle?.addEventListener('click', closeDrawer);

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-panel');
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      shadow.getElementById('panel-' + target)?.classList.add('active');
    });
  });

  shadow.getElementById('btn-submit-lobby')?.addEventListener('click', () => {
    alert('Platform submitted to the Lagos Research Initiative board for review.');
  });

  console.info('[LRI Mod] Initialized with native game aesthetic.');
})();