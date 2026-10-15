// public/injector/loader.js
// Lagos Research Initiative (LRI) — Browser Extension Content Script

(async function LagosLRIMod() {
  'use strict';

  if (document.getElementById('lri-mod-root')) return;

  const STORAGE_KEY_LICENSE = 'lri_license_key';
  const STORAGE_KEY_SESSION = 'lri_session_token';

  let licenseKey = localStorage.getItem(STORAGE_KEY_LICENSE);

  // FORCE DEV TEST MODE SO IT LOADS INSTANTLY WITHOUT A KEY
  if (!licenseKey) {
    licenseKey = 'TEST-DEV-KEY-1234';
    localStorage.setItem(STORAGE_KEY_LICENSE, licenseKey);
  }

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

    /* LRI Floating Action Button - Positioned safely above the bottom navigation bar */
    #lri-fab {
      position: fixed; bottom: 85px; right: 20px; width: 52px; height: 52px;
      border-radius: 50%; background: #ffffff;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.1);
      cursor: pointer; pointer-events: auto !important; display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease; border: 2px solid #e2e8f0; z-index: 2147483646;
      overflow: hidden;
    }
    #lri-fab:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
    #lri-fab img { width: 100%; height: 100%; object-fit: cover; }

    /* Slide-up Drawer matching game card style */
    #lri-drawer {
      position: fixed; bottom: 0; left: 0; right: 0; max-height: 85vh;
      background: #ffffff; border-top-left-radius: 24px; border-top-right-radius: 24px;
      transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: auto !important; overflow: hidden; z-index: 2147483647;
      display: flex; flex-direction: column; box-shadow: 0 -10px 40px rgba(0,0,0,0.15);
    }
    #lri-drawer.open { transform: translateY(0); }
    #lri-drawer.disabled-mode { opacity: 0.45; pointer-events: none !important; }

    .drawer-handle { width: 36px; height: 4px; background: #cbd5e1; border-radius: 2px; margin: 12px auto 8px; cursor: pointer; }

    /* Header & Ledger Row */
    .lri-header { padding: 0 20px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; }
    .lri-title { font-size: 16px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px; }
    .lri-logo-thumb { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 1px solid #cbd5e1; }
    
    /* Toggle Switch Styles */
    .switch-container { display: flex; align-items: center; gap: 8px; }
    .switch { position: relative; display: inline-block; width: 40px; height: 22px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
      background-color: #cbd5e1; transition: .3s; border-radius: 22px;
    }
    .slider:before {
      position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px;
      background-color: white; transition: .3s; border-radius: 50%;
    }
    input:checked + .slider { background-color: #10b981; }
    input:checked + .slider:before { transform: translateX(18px); }

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

    /* Member Ledger List Styles */
    .ledger-list { max-height: 160px; overflow-y: auto; margin-top: 8px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; }
    .ledger-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .ledger-item:last-child { border-bottom: none; }

    #lri-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px); display: none; z-index: 2147483646; }
    #lri-overlay.visible { display: block; }
  `;

  const logoUrl = typeof chrome !== 'undefined' && chrome.runtime?.getURL
    ? chrome.runtime.getURL('lri-logo.jpg')
    : '/lri-logo.jpg';

  shadow.innerHTML = `
    <style>${style.textContent}</style>
    <div id="lri-overlay"></div>

    <button id="lri-fab" aria-label="Open LRI Dashboard" title="Lagos Research Initiative">
      <img src="${logoUrl}" alt="LRI Logo" />
    </button>

    <div id="lri-drawer" role="dialog" aria-modal="true" class="open">
      <div class="drawer-handle" id="lri-drag-handle"></div>

      <div class="lri-header">
        <div class="lri-title">
          <img src="${logoUrl}" class="lri-logo-thumb" alt="Logo" />
          Lagos Research Initiative
        </div>
        <div class="switch-container">
          <span style="font-size: 11px; color: #64748b; font-weight: 600;" id="toggle-label">Active</span>
          <label class="switch">
            <input type="checkbox" id="lri-enable-toggle" checked />
            <span class="slider"></span>
          </label>
        </div>
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
          <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 6px;">👥 Active Fellows Ledger</div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">Live syndicate member clearance tracking.</div>
          <div class="ledger-list" id="lri-ledger-container">
            <!-- Dynamically populated rows -->
          </div>
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

      <!-- Tab 3: Candidate Lobby -->
      <div class="drawer-panel" id="panel-petition">
        <div class="lri-card">
          <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">🤝 Political Lobbying Portal</div>
          <div style="font-size: 13px; color: #64748b; margin-bottom: 12px;">Candidates running for public office may submit their platform for official LRI research endorsement.</div>
          <input type="text" placeholder="Candidate In-Game Handle" style="padding:10px; border:1px solid #cbd5e1; border-radius:8px; margin-bottom:8px; width:100%; font-size:13px;" id="lobby-handle" />
          <textarea placeholder="Outline your political platform..." style="padding:10px; border:1px solid #cbd5e1; border-radius:8px; margin-bottom:12px; width:100%; height:80px; font-size:13px;" id="lobby-platform"></textarea>
          <button class="btn-primary" id="btn-submit-lobby">Submit Platform for Review</button>
        </div>
      </div>
    </div>
  `;

  // ── Populate Member Ledger Data ───────────────────────────
  const members = [
    { name: "Director Adebayo", rank: "Grand Director", pts: "4,820 pts" },
    { name: "Dr. Chioma Okoro", rank: "Senior Fellow", pts: "3,150 pts" },
    { name: "Operative_99", rank: "Research Fellow", pts: "1,890 pts" },
    { name: "Tunde_Lagos", rank: "Junior Analyst", pts: "940 pts" },
    { name: "Eko_Mind", rank: "Junior Analyst", pts: "720 pts" }
  ];

  const ledgerEl = shadow.getElementById('lri-ledger-container');
  if (ledgerEl) {
    ledgerEl.innerHTML = members.map(m => `
      <div class="ledger-item">
        <div><strong>${m.name}</strong> <span style="color: #64748b; font-size: 11px; margin-left: 4px;">(${m.rank})</span></div>
        <div style="color: #10b981; font-weight: 600; font-size: 12px;">${m.pts}</div>
      </div>
    `).join('');
  }

  // ── UI Interactivity Handlers ─────────────────────────────
  const fab = shadow.getElementById('lri-fab');
  const drawer = shadow.getElementById('lri-drawer');
  const overlay = shadow.getElementById('lri-overlay');
  const handle = shadow.getElementById('lri-drag-handle');
  const tabs = shadow.querySelectorAll('.drawer-tab');
  const panels = shadow.querySelectorAll('.drawer-panel');
  const toggleInput = shadow.getElementById('lri-enable-toggle');
  const toggleLabel = shadow.getElementById('toggle-label');

  function openDrawer() {
    if (toggleInput?.checked) {
      drawer?.classList.add('open');
      overlay?.classList.add('visible');
    }
  }
  function closeDrawer() { drawer?.classList.remove('open'); overlay?.classList.remove('visible'); }

  fab?.addEventListener('click', openDrawer);
  overlay?.addEventListener('click', closeDrawer);
  handle?.addEventListener('click', closeDrawer);

  // Toggle Extension On/Off
  toggleInput?.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    if (isEnabled) {
      drawer?.classList.remove('disabled-mode');
      toggleLabel.textContent = "Active";
      openDrawer();
    } else {
      drawer?.classList.add('disabled-mode');
      toggleLabel.textContent = "Off";
      closeDrawer();
    }
  });

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

  console.info('[LRI Mod] Initialized with Toggle Switch and Member Ledger.');
})();