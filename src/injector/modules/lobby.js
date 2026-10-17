import { getSupabaseConfig } from './config.js';

export function initLobby(shadow, showLriModal) {
    async function fetchManifestoBoard() {
        const boardContainer = shadow.getElementById('manifesto-board-container');
        if (!boardContainer) return;
        try {
            const config = getSupabaseConfig();
            const res = await fetch(`${config.url}/rest/v1/lri_ballots_and_lobbies?type=eq.lobby_petition&select=*&order=created_at.desc`, {
                headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
            });
            const petitions = await res.json();
            if (!petitions || petitions.length === 0) {
                boardContainer.innerHTML = `<div style="color: #64748b; font-style: italic; text-align: center; padding: 10px;">No candidate platforms submitted yet.</div>`;
                return;
            }
            boardContainer.innerHTML = petitions.map(p => `
        <div style="padding: 10px; border-bottom: 1px solid #f1f5f9; margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #0f172a; font-size: 13px;">🏛️ ${p.candidate_handle}</strong>
            <span style="font-size: 10px; background: #fffbeb; color: #b45309; border: 1px solid #fde68a; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Pending Review</span>
          </div>
          <p style="color: #475569; font-size: 12px; line-height: 1.4; white-space: pre-wrap;">${p.platform_text}</p>
        </div>
      `).join('');
        } catch (err) {
            boardContainer.innerHTML = `<div style="color: #ef4444; text-align: center;">Failed to load candidate board.</div>`;
        }
    }

    fetchManifestoBoard();

    shadow.getElementById('btn-submit-lobby')?.addEventListener('click', async () => {
        const handleInput = shadow.getElementById('lobby-handle');
        const platformInput = shadow.getElementById('lobby-platform');
        const handle = handleInput?.value.trim();
        const platform = platformInput?.value.trim();

        if (!handle || !platform) return showLriModal('Missing Fields', 'Please provide both your handle and political platform.', '⚠️');

        const submitBtn = shadow.getElementById('btn-submit-lobby');
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        try {
            const config = getSupabaseConfig();
            const res = await fetch(`${config.url}/rest/v1/lri_ballots_and_lobbies`, {
                method: 'POST',
                headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                body: JSON.stringify({ type: 'lobby_petition', candidate_handle: handle, platform_text: platform, votes_count: 0 })
            });
            if (!res.ok) throw new Error();
            showLriModal('Platform Submitted', 'Your platform has been successfully published to the Public Manifesto Board!', '📜');
            handleInput.value = '';
            platformInput.value = '';
            fetchManifestoBoard();
        } catch (err) {
            showLriModal('Error', 'Failed to submit platform.', '❌');
        } finally {
            submitBtn.textContent = 'Submit Platform for Review';
            submitBtn.disabled = false;
        }
    });
}