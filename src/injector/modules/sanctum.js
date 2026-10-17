import { getSupabaseConfig } from './config.js';

export function initSanctum(shadow, showLriModal) {
    const userHandle = localStorage.getItem('lri_user_handle') || 'Director Adebayo';
    if (userHandle.includes('Director')) {
        const desk = shadow.getElementById('director-desk');
        if (desk) desk.style.display = 'block';
    }

    async function fetchDirectives() {
        const container = shadow.getElementById('directives-container');
        if (!container) return;
        try {
            const config = getSupabaseConfig();
            const res = await fetch(`${config.url}/rest/v1/lri_directives?select=*&order=created_at.desc`, {
                headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
            });
            const directives = await res.json();
            if (!directives || directives.length === 0) {
                container.innerHTML = `<div style="color: #64748b; font-style: italic;">No active directives issued yet.</div>`;
                return;
            }
            container.innerHTML = directives.map(d => `
        <div style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
          • ${d.directive_text} <span style="font-size: 11px; color: #94a3b8; display: block; margin-top: 2px;">Issued by ${d.author_handle}</span>
        </div>
      `).join('');
        } catch (err) {
            container.innerHTML = `<div style="color: #ef4444;">Failed to load directives.</div>`;
        }
    }

    async function fetchAndRenderFellowsRoster() {
        const container = shadow.getElementById('fellows-roster-container');
        if (!container) return;
        try {
            const config = getSupabaseConfig();
            const res = await fetch(`${config.url}/rest/v1/lri_members?select=in_game_handle`, {
                headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
            });
            const members = await res.json();
            if (!members || members.length === 0) {
                container.innerHTML = `<div style="color: #64748b; font-style: italic;">No active fellows registered.</div>`;
                return;
            }
            container.innerHTML = members.map(m => `
        <div style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; font-size: 13px;">
          <strong>${m.in_game_handle}</strong>
          <span style="font-size: 10px; background: #ecfdf5; color: #047857; padding: 2px 6px; border-radius: 4px; font-weight: 600;">LRI Initiate</span>
        </div>
      `).join('');
        } catch (err) {
            container.innerHTML = `<div style="color: #ef4444;">Failed to load roster.</div>`;
        }
    }

    fetchDirectives();
    fetchAndRenderFellowsRoster();

    shadow.getElementById('btn-publish-directive')?.addEventListener('click', async () => {
        const input = shadow.getElementById('new-directive-input');
        const text = input?.value.trim();
        if (!text) return showLriModal('Empty Field', 'Directive text cannot be empty.', '⚠️');

        try {
            const config = getSupabaseConfig();
            const res = await fetch(`${config.url}/rest/v1/lri_directives`, {
                method: 'POST',
                headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                body: JSON.stringify({ directive_text: text, author_handle: userHandle })
            });
            if (!res.ok) throw new Error();
            showLriModal('Directive Broadcasted', 'New policy directive broadcasted successfully across the LRI network!', '👑');
            input.value = '';
            fetchDirectives();
        } catch (err) {
            showLriModal('Error', 'Error broadcasting directive.', '❌');
        }
    });
}