function e(e){return function(t,n,r=`🏛️`){let i=e.getElementById(`lri-modal-backdrop`),a=e.getElementById(`lri-modal-title`),o=e.getElementById(`lri-modal-message`),s=e.getElementById(`lri-modal-icon`);if(!i)return;a.textContent=t,o.textContent=n,s.textContent=r,i.classList.add(`visible`);let c=e.getElementById(`lri-modal-dismiss`),l=()=>{i.classList.remove(`visible`),c.removeEventListener(`click`,l)};c.onclick=l}}function t(){return{url:`https://vpxeascdekapififamic.supabase.co`,key:[`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`,`.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweGVhc2NkZWthcGlmaWZhbWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MDQ3MTUsImV4cCI6MjEwNzM4MDcxNX0`,`.Y1-x-RjX4L321prAKzXCSoqQEIL2wH5Zi5oUX_wtFhI`].join(``)}}function n(e,n){let r=localStorage.getItem(`lri_user_handle`)||`Director Adebayo`;if(r.includes(`Director`)){let t=e.getElementById(`director-desk`);t&&(t.style.display=`block`)}async function i(){let n=e.getElementById(`directives-container`);if(n)try{let e=t(),r=await(await fetch(`${e.url}/rest/v1/lri_directives?select=*&order=created_at.desc`,{headers:{apikey:e.key,Authorization:`Bearer ${e.key}`}})).json();if(!r||r.length===0){n.innerHTML=`<div style="color: #64748b; font-style: italic;">No active directives issued yet.</div>`;return}n.innerHTML=r.map(e=>`
        <div style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
          • ${e.directive_text} <span style="font-size: 11px; color: #94a3b8; display: block; margin-top: 2px;">Issued by ${e.author_handle}</span>
        </div>
      `).join(``)}catch{n.innerHTML=`<div style="color: #ef4444;">Failed to load directives.</div>`}}async function a(){let n=e.getElementById(`fellows-roster-container`);if(n)try{let e=t(),r=await(await fetch(`${e.url}/rest/v1/lri_members?select=in_game_handle`,{headers:{apikey:e.key,Authorization:`Bearer ${e.key}`}})).json();if(!r||r.length===0){n.innerHTML=`<div style="color: #64748b; font-style: italic;">No active fellows registered.</div>`;return}n.innerHTML=r.map(e=>`
        <div style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; font-size: 13px;">
          <strong>${e.in_game_handle}</strong>
          <span style="font-size: 10px; background: #ecfdf5; color: #047857; padding: 2px 6px; border-radius: 4px; font-weight: 600;">LRI Initiate</span>
        </div>
      `).join(``)}catch{n.innerHTML=`<div style="color: #ef4444;">Failed to load roster.</div>`}}i(),a(),e.getElementById(`btn-publish-directive`)?.addEventListener(`click`,async()=>{let a=e.getElementById(`new-directive-input`),o=a?.value.trim();if(!o)return n(`Empty Field`,`Directive text cannot be empty.`,`⚠️`);try{let e=t();if(!(await fetch(`${e.url}/rest/v1/lri_directives`,{method:`POST`,headers:{apikey:e.key,Authorization:`Bearer ${e.key}`,"Content-Type":`application/json`,Prefer:`return=minimal`},body:JSON.stringify({directive_text:o,author_handle:r})})).ok)throw Error();n(`Directive Broadcasted`,`New policy directive broadcasted successfully across the LRI network!`,`👑`),a.value=``,i()}catch{n(`Error`,`Error broadcasting directive.`,`❌`)}})}function r(e,n){async function r(){let r=e.getElementById(`shortlisted-candidates-list`);if(r)try{let i=t(),a=await(await fetch(`${i.url}/rest/v1/lri_elections?is_shortlisted=eq.true&select=*`,{headers:{apikey:i.key,Authorization:`Bearer ${i.key}`}})).json();if(!a||a.length===0){r.innerHTML=`<div style="color: #64748b; font-style: italic;">No candidates shortlisted yet. Race opens weekly.</div>`;return}r.innerHTML=a.map(e=>`
        <div style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${e.candidate_handle}</strong>
            <div style="font-size: 11px; color: #64748b;">Votes: ${e.votes||0}</div>
          </div>
          <button class="btn-vote-candidate" data-id="${e.id}" style="padding: 6px 12px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">Vote</button>
        </div>
      `).join(``),e.querySelectorAll(`.btn-vote-candidate`).forEach(e=>{e.addEventListener(`click`,()=>{n(`Ballot Cast`,`Your vote has been securely recorded on the LRI network ledger!`,`🗳️`)})})}catch{r.innerHTML=`<div style="color: #ef4444;">Error loading election ballot.</div>`}}r(),e.getElementById(`btn-apply-candidate`)?.addEventListener(`click`,async()=>{let i=e.getElementById(`candidate-apply-handle`),a=i?.value.trim();if(!a)return n(`Missing Handle`,`Please provide your in-game handle.`,`⚠️`);try{let e=t();if((await(await fetch(`${e.url}/rest/v1/lri_elections?is_shortlisted=eq.true&select=id`,{headers:{apikey:e.key,Authorization:`Bearer ${e.key}`}})).json()).length>=5)return n(`Slots Full`,`All 5 candidate slots for this week have been filled!`,`⏳`);if(!(await fetch(`${e.url}/rest/v1/lri_elections`,{method:`POST`,headers:{apikey:e.key,Authorization:`Bearer ${e.key}`,"Content-Type":`application/json`,Prefer:`return=minimal`},body:JSON.stringify({candidate_handle:a,is_shortlisted:!0,votes:0})})).ok)throw Error();n(`Slot Secured`,`Success! You secured one of the 5 candidate slots for the election.`,`🏃‍♂️`),i.value=``,r()}catch{n(`Error`,`Could not lock in candidacy slot.`,`❌`)}})}function i(e,n){async function r(){let n=e.getElementById(`manifesto-board-container`);if(n)try{let e=t(),r=await(await fetch(`${e.url}/rest/v1/lri_ballots_and_lobbies?type=eq.lobby_petition&select=*&order=created_at.desc`,{headers:{apikey:e.key,Authorization:`Bearer ${e.key}`}})).json();if(!r||r.length===0){n.innerHTML=`<div style="color: #64748b; font-style: italic; text-align: center; padding: 10px;">No candidate platforms submitted yet.</div>`;return}n.innerHTML=r.map(e=>`
        <div style="padding: 10px; border-bottom: 1px solid #f1f5f9; margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #0f172a; font-size: 13px;">🏛️ ${e.candidate_handle}</strong>
            <span style="font-size: 10px; background: #fffbeb; color: #b45309; border: 1px solid #fde68a; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Pending Review</span>
          </div>
          <p style="color: #475569; font-size: 12px; line-height: 1.4; white-space: pre-wrap;">${e.platform_text}</p>
        </div>
      `).join(``)}catch{n.innerHTML=`<div style="color: #ef4444; text-align: center;">Failed to load candidate board.</div>`}}r(),e.getElementById(`btn-submit-lobby`)?.addEventListener(`click`,async()=>{let i=e.getElementById(`lobby-handle`),a=e.getElementById(`lobby-platform`),o=i?.value.trim(),s=a?.value.trim();if(!o||!s)return n(`Missing Fields`,`Please provide both your handle and political platform.`,`⚠️`);let c=e.getElementById(`btn-submit-lobby`);c.textContent=`Submitting...`,c.disabled=!0;try{let e=t();if(!(await fetch(`${e.url}/rest/v1/lri_ballots_and_lobbies`,{method:`POST`,headers:{apikey:e.key,Authorization:`Bearer ${e.key}`,"Content-Type":`application/json`,Prefer:`return=minimal`},body:JSON.stringify({type:`lobby_petition`,candidate_handle:o,platform_text:s,votes_count:0})})).ok)throw Error();n(`Platform Submitted`,`Your platform has been successfully published to the Public Manifesto Board!`,`📜`),i.value=``,a.value=``,r()}catch{n(`Error`,`Failed to submit platform.`,`❌`)}finally{c.textContent=`Submit Platform for Review`,c.disabled=!1}})}(async function(){if(document.getElementById(`lri-mod-root`))return;let t=`lri_license_key`,a=localStorage.getItem(t);a||(a=`TEST-DEV-KEY-1234`,localStorage.setItem(t,a));let o=document.createElement(`div`);o.id=`lri-mod-root`,Object.assign(o.style,{position:`fixed`,bottom:`0`,right:`0`,width:`0`,height:`0`,zIndex:`2147483647`,pointerEvents:`none`}),document.body.appendChild(o);let s=o.attachShadow({mode:`open`}),c=document.createElement(`style`);c.textContent=`
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
  `;let l=typeof chrome<`u`&&chrome.runtime?.getURL?chrome.runtime.getURL(`lri-logo.jpg`):`/lri-logo.jpg`;s.innerHTML=`
    <style>${c.textContent}</style>
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
      <img src="${l}" alt="LRI Logo" />
    </button>

    <div id="lri-drawer" role="dialog" aria-modal="true">
      <div class="drawer-handle" id="lri-drag-handle"></div>

      <div class="lri-header">
        <div class="lri-title">
          <img src="${l}" class="lri-logo-thumb" alt="Logo" />
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
  `;let u=e(s);n(s,u),r(s,u),i(s,u);let d=s.getElementById(`lri-fab`),f=s.getElementById(`lri-drawer`),p=s.getElementById(`lri-overlay`),m=s.getElementById(`lri-drag-handle`),h=s.getElementById(`lri-enable-toggle`),g=s.getElementById(`toggle-label`),_=localStorage.getItem(`lri_mod_active`)!==`false`;h.checked=_,_?(f?.classList.add(`open`),p?.classList.add(`visible`),g.textContent=`Active`,f?.classList.remove(`disabled-mode`)):(f?.classList.remove(`open`),p?.classList.remove(`visible`),g.textContent=`Off`,f?.classList.add(`disabled-mode`)),h?.addEventListener(`change`,e=>{let t=e.target.checked;localStorage.setItem(`lri_mod_active`,t),t?(f?.classList.remove(`disabled-mode`),g.textContent=`Active`,f?.classList.add(`open`),p?.classList.add(`visible`)):(f?.classList.add(`disabled-mode`),g.textContent=`Off`,f?.classList.remove(`open`),p?.classList.remove(`visible`))});function v(){h?.checked&&(f?.classList.add(`open`),p?.classList.add(`visible`))}function y(){f?.classList.remove(`open`),p?.classList.remove(`visible`)}d?.addEventListener(`click`,v),p?.addEventListener(`click`,y),m?.addEventListener(`click`,y);let b=s.querySelectorAll(`.drawer-tab`),x=s.querySelectorAll(`.drawer-panel`);b.forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-panel`);b.forEach(e=>e.classList.remove(`active`)),x.forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),s.getElementById(`panel-`+t)?.classList.add(`active`)})});let S=s.querySelectorAll(`.sanctum-sub-tab`),C=s.querySelectorAll(`.sanctum-sub-panel`);S.forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-sub`);S.forEach(e=>{e.style.background=`#f8fafc`,e.style.border=`1px solid #e2e8f0`}),e.style.background=`#e2e8f0`,e.style.border=`none`,C.forEach(e=>e.style.display=`none`),s.getElementById(`sub-`+t).style.display=`block`})});function w(){let e=document.querySelector(`button[aria-label="Open Sim panel"]`);e&&!e.dataset.lriFramed&&(e.dataset.lriFramed=`true`,e.style.border=`3px solid #d97706`,e.style.boxShadow=`none`,e.style.overflow=`hidden`),document.querySelectorAll(`p`).forEach(e=>{e.textContent.includes(`Traits:`)&&!e.textContent.includes(`LRI Initiate`)&&(e.textContent=e.textContent.trim()+` · LRI Initiate`)})}w(),new MutationObserver(()=>{w()}).observe(document.body,{childList:!0,subtree:!0}),console.info(`[LRI Mod] Modular Political Syndicate Engine Active.`)})();