import { initModalSystem } from './modules/modals.js';
import { initSanctum } from './modules/sanctum.js';
import { initElections } from './modules/elections.js';
import { initLobby } from './modules/lobby.js';

(async function LagosLRIMod() {
  'use strict';

  if (document.getElementById('lri-mod-root')) return;

  const hostEl = document.createElement('div');
  hostEl.id = 'lri-mod-root';
  Object.assign(hostEl.style, {
    position: 'fixed', bottom: '0', right: '0', width: '0', height: '0', zIndex: '2147483647', pointerEvents: 'none',
  });
  document.body.appendChild(hostEl);

  const shadow = hostEl.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

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

    .lri-header { padding: 0 20px 12px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; }
    .lri-title { font-size: 16px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px; }
    .lri-logo-thumb { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 1px solid #cbd5e1; }
    
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

    .drawer-tabs { display: flex; background: #f8fafc; padding: 4px; border-bottom: 1px solid #e2e8f0; }
    .drawer-tab {
      flex: 1; padding: 10px; font-size: 12px; font-weight: 600; color: #64748b;
      text-align: center; cursor: pointer; border-radius: 8px; background: none; border: none; transition: all 0.2s;
    }
    .drawer-tab.active { background: #ffffff; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }

    .drawer-panel { display: none; flex: 1; overflow-y: auto; padding: 20px; color: #334155; }
    .drawer-panel.active { display: block; }

    .lri-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .btn-primary {
      width: 100%; padding: 12px; background: #10b981; color: #ffffff; border: none;
      border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;
    }
    .btn-primary:hover { background: #059669; }

    #lri-modal-backdrop {
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center;
      z-index: 2147483648; opacity: 0; transition: opacity 0.2s ease;
    }
    #lri-modal-backdrop.visible { display: flex; opacity: 1; }
    
    .lri-modal-card {
      background: #ffffff; width: 90%; max-width: 320px; border-radius: 16px;
      padding: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      transform: scale(0.95); transition: transform 0.2s ease; text-align: center;
    }
    #lri-modal-backdrop.visible .lri-modal-card { transform: scale(1); }

    #lri-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px); display: none; z-index: 2147483646; }
    #lri-overlay.visible { display: block; }
  `;

  const logoUrl = typeof chrome !== 'undefined' && chrome.runtime?.getURL
    ? chrome.runtime.getURL('lri-logo.jpg')
    : '/lri-logo.jpg';

  shadow.innerHTML = `
    <style>${style.textContent}</style>
    <div id="lri-overlay"></div>

    <div id="lri-modal-backdrop">
      <div class="lri-modal-card">
        <div id="lri-modal-icon" style="font-size: 28px; margin-bottom: 8px;">🏛️</div>
        <div id="lri-modal-title" style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">Notice</div>
        <div id="lri-modal-message" style="font-size: 13px; color: #475569; margin-bottom: 16px; line-height: 1.4;">Message...</div>
        <button class="btn-primary" id="lri-modal-dismiss" style="padding: 10px; font-size: 13px;">Understood</button>
      </div>
    </div>

    <button id="lri-fab" aria-label="Open LRI Dashboard" title="Lagos Research Initiative">
      <img src="${logoUrl}" alt="LRI Logo" />
    </button>

    <div id="lri-drawer" role="dialog" aria-modal="true">
      <div class="drawer-handle" id="lri-drag-handle"></div>

      <div class="lri-header">
        <div class="lri-title">
          <img src="${logoUrl}" class="lri-logo-thumb" alt="Logo" />
          Lagos Research Initiative
        </div>
        <div class="switch-container">
          <span style="font-size: 11px; color: #64748b; font-weight: 600;" id="toggle-label">Active</span>
          <label class="switch">
            <input type="checkbox" id="lri-enable-toggle" />
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
        <div style="display: flex; gap: 8px; margin-bottom: 14px;">
          <button class="sanctum-sub-tab active" data-sub="board" style="flex: 1; padding: 8px; font-size: 12px; font-weight: 600; background: #e2e8f0; border: none; border-radius: 8px; cursor: pointer;">Policy Board</button>
          <button class="sanctum-sub-tab" data-sub="fellows" style="flex: 1; padding: 8px; font-size: 12px; font-weight: 600; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer;">Fellows Roster</button>
        </div>

        <div class="sanctum-sub-panel" id="sub-board" style="display: block;">
          <div class="lri-card" style="border-left: 4px solid #d97706; background: #fffbeb;">
            <div style="font-size: 11px; color: #b45309; font-weight: 700; text-transform: uppercase;">Syndicate Executive Authority</div>
            <div style="font-size: 16px; font-weight: 700; color: #78350f; margin: 4px 0;">👑 Reigned by Grand Director</div>
            <div style="font-size: 12px; color: #92400e; font-weight: 500;">Kingmaker Election Syndicate</div>
          </div>

          <div class="lri-card">
            <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 6px;">📋 Active Policy Directives (APDs)</div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 10px;">Official marching orders issued by the reigning Grand Director.</div>
            
            <div id="directives-container" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 13px; color: #334155; min-height: 60px;">
              Synchronizing directives...
            </div>

            <div id="director-desk" style="display: none; border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 8px;">
              <div style="font-size: 12px; font-weight: 700; color: #d97706; margin-bottom: 6px;">👑 Grand Director Control Panel</div>
              <input type="text" id="new-directive-input" placeholder="Broadcast a new policy directive..." style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; width: 100%; font-size: 13px; margin-bottom: 8px;" />
              <button class="btn-primary" id="btn-publish-directive" style="padding: 10px; font-size: 13px;">Issue Directive to Syndicate</button>
            </div>
          </div>
        </div>

        <div class="sanctum-sub-panel" id="sub-fellows" style="display: none;">
          <div class="lri-card">
            <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 6px;">👥 Syndicate Fellows Roster</div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 10px;">Active members operating within the LRI network.</div>
            <div id="fellows-roster-container" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; max-height: 250px; overflow-y: auto;">
              Loading fellows list...
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: Weekly Elections -->
      <div class="drawer-panel" id="panel-elections">
        <div class="lri-card" style="border-color: #d97706; background: #fffbeb;">
          <div style="font-size: 13px; font-weight: 700; color: #b45309; margin-bottom: 4px;">⏱️ Grand Director Election Timer</div>
          <div style="font-size: 12px; color: #92400e; margin-bottom: 8px;">Next application window opens in:</div>
          <div style="font-size: 20px; font-weight: 800; color: #78350f; font-family: monospace;">06D : 14H : 32M</div>
        </div>

        <div class="lri-card">
          <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 6px;">🏃‍♂️ Candidate Application Race (First 5 Slots)</div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 10px;">When countdown hits zero, the first 5 members to register lock in their ballot placement.</div>
          <input type="text" id="candidate-apply-handle" placeholder="Your In-Game Handle" style="padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; width: 100%; font-size: 12px; margin-bottom: 6px;" />
          <button class="btn-primary" id="btn-apply-candidate" style="padding: 8px; font-size: 12px; background: #d97706;">Lock In Candidacy Slot</button>
        </div>

        <div class="lri-card">
          <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 6px;">🗳️ Active 10-Hour Voting Sprint</div>
          <div id="shortlisted-candidates-list" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; font-size: 13px;">
            Waiting for election sprint to open...
          </div>
        </div>
      </div>

      <!-- Tab 3: Candidate Lobby -->
      <div class="drawer-panel" id="panel-petition">
        <div class="lri-card">
          <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 6px;">📜 Public Manifesto Board</div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 10px;">Review platforms submitted by candidates seeking official LRI endorsement.</div>
          <div id="manifesto-board-container" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; max-height: 180px; overflow-y: auto; font-size: 13px; margin-bottom: 14px;">
            Loading candidate manifestos...
          </div>
        </div>

        <div class="lri-card" style="background: #f8fafc;">
          <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">🤝 Submit Your Political Platform</div>
          <input type="text" placeholder="Candidate In-Game Handle" style="padding:10px; border:1px solid #cbd5e1; border-radius:8px; margin-bottom:8px; width:100%; font-size:13px;" id="lobby-handle" />
          <textarea placeholder="Outline your political platform..." style="padding:10px; border:1px solid #cbd5e1; border-radius:8px; margin-bottom:12px; width:100%; height:70px; font-size:13px;" id="lobby-platform"></textarea>
          <button class="btn-primary" id="btn-submit-lobby">Submit Platform for Review</button>
        </div>
      </div>
    </div>
  `;

  // Initialize Modules
  const showLriModal = initModalSystem(shadow);
  initSanctum(shadow, showLriModal);
  initElections(shadow, showLriModal);
  initLobby(shadow, showLriModal);

  // ── Persistent Toggle Switch & Smart FAB Handler ──────────
  const fab = shadow.getElementById('lri-fab');
  const drawer = shadow.getElementById('lri-drawer');
  const overlay = shadow.getElementById('lri-overlay');
  const handle = shadow.getElementById('lri-drag-handle');
  const toggleInput = shadow.getElementById('lri-enable-toggle');
  const toggleLabel = shadow.getElementById('toggle-label');

  // Retrieve saved state (defaults to true)
  const isInitiallyActive = localStorage.getItem('lri_mod_active') !== 'false';
  toggleInput.checked = isInitiallyActive;

  if (isInitiallyActive) {
    drawer?.classList.remove('disabled-mode');
    toggleLabel.textContent = "Active";
  } else {
    drawer?.classList.add('disabled-mode');
    toggleLabel.textContent = "Off";
    drawer?.classList.remove('open');
    overlay?.classList.remove('visible');
  }

  // Toggle switch change listener
  toggleInput?.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    localStorage.setItem('lri_mod_active', isEnabled);

    if (isEnabled) {
      drawer?.classList.remove('disabled-mode');
      toggleLabel.textContent = "Active";
      drawer?.classList.add('open');
      overlay?.classList.add('visible');
    } else {
      drawer?.classList.add('disabled-mode');
      toggleLabel.textContent = "Off";
      drawer?.classList.remove('open');
      overlay?.classList.remove('visible');
    }
  });

  // Smart FAB handler: If clicked while off, it turns it back on and opens!
  function handleFabClick() {
    if (!toggleInput.checked) {
      toggleInput.checked = true;
      localStorage.setItem('lri_mod_active', 'true');
      drawer?.classList.remove('disabled-mode');
      toggleLabel.textContent = "Active";
    }
    drawer?.classList.add('open');
    overlay?.classList.add('visible');
  }

  function closeDrawer() {
    drawer?.classList.remove('open');
    overlay?.classList.remove('visible');
  }

  fab?.addEventListener('click', handleFabClick);
  overlay?.addEventListener('click', closeDrawer);
  handle?.addEventListener('click', closeDrawer);

  const tabs = shadow.querySelectorAll('.drawer-tab');
  const panels = shadow.querySelectorAll('.drawer-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-panel');
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      shadow.getElementById('panel-' + target)?.classList.add('active');
    });
  });

  const subTabs = shadow.querySelectorAll('.sanctum-sub-tab');
  const subPanels = shadow.querySelectorAll('.sanctum-sub-panel');
  subTabs.forEach(st => {
    st.addEventListener('click', () => {
      const target = st.getAttribute('data-sub');
      subTabs.forEach(t => { t.style.background = '#f8fafc'; t.style.border = '1px solid #e2e8f0'; });
      st.style.background = '#e2e8f0'; st.style.border = 'none';
      subPanels.forEach(p => p.style.display = 'none');
      shadow.getElementById('sub-' + target).style.display = 'block';
    });
  });

  // Profile Frame & Traits Injector
  function applyLRIModifications() {
    const profileButton = document.querySelector('button[aria-label="Open Sim panel"]');
    if (profileButton && !profileButton.dataset.lriFramed) {
      profileButton.dataset.lriFramed = "true";
      profileButton.style.border = "3px solid #d97706";
      profileButton.style.boxShadow = "none";
      profileButton.style.overflow = "hidden";
    }

    const traitParagraphs = document.querySelectorAll('p');
    traitParagraphs.forEach(p => {
      if (p.textContent.includes('Traits:') && !p.textContent.includes('LRI Initiate')) {
        p.textContent = p.textContent.trim() + ' · LRI Initiate';
      }
    });
  }

  applyLRIModifications();
  const lriObserver = new MutationObserver(() => { applyLRIModifications(); });
  lriObserver.observe(document.body, { childList: true, subtree: true });

  console.info('[LRI Mod] Modular Political Syndicate Engine Active.');
})();