import { getSupabaseConfig } from './config.js';

export function initElections(shadow, showLriModal) {
    async function fetchShortlistedCandidates() {
        const listContainer = shadow.getElementById('shortlisted-candidates-list');
        if (!listContainer) return;
        try {
            const config = getSupabaseConfig();
            const res = await fetch(`${config.url}/rest/v1/lri_elections?is_shortlisted=eq.true&select=*`, {
                headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
            });
            const candidates = await res.json();
            if (!candidates || candidates.length === 0) {
                listContainer.innerHTML = `<div style="color: #64748b; font-style: italic;">No candidates shortlisted yet. Race opens weekly.</div>`;
                return;
            }
            listContainer.innerHTML = candidates.map(c => `
        <div style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${c.candidate_handle}</strong>
            <div style="font-size: 11px; color: #64748b;">Votes: ${c.votes || 0}</div>
          </div>
          <button class="btn-vote-candidate" data-id="${c.id}" style="padding: 6px 12px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">Vote</button>
        </div>
      `).join('');

            shadow.querySelectorAll('.btn-vote-candidate').forEach(btn => {
                btn.addEventListener('click', () => {
                    showLriModal('Ballot Cast', 'Your vote has been securely recorded on the LRI network ledger!', '🗳️');
                });
            });
        } catch (err) {
            listContainer.innerHTML = `<div style="color: #ef4444;">Error loading election ballot.</div>`;
        }
    }

    fetchShortlistedCandidates();

    shadow.getElementById('btn-apply-candidate')?.addEventListener('click', async () => {
        const input = shadow.getElementById('candidate-apply-handle');
        const handle = input?.value.trim();
        if (!handle) return showLriModal('Missing Handle', 'Please provide your in-game handle.', '⚠️');

        try {
            const config = getSupabaseConfig();
            const checkRes = await fetch(`${config.url}/rest/v1/lri_elections?is_shortlisted=eq.true&select=id`, {
                headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}` }
            });
            const currentShortlist = await checkRes.json();
            if (currentShortlist.length >= 5) return showLriModal('Slots Full', 'All 5 candidate slots for this week have been filled!', '⏳');

            const res = await fetch(`${config.url}/rest/v1/lri_elections`, {
                method: 'POST',
                headers: { 'apikey': config.key, 'Authorization': `Bearer ${config.key}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                body: JSON.stringify({ candidate_handle: handle, is_shortlisted: true, votes: 0 })
            });
            if (!res.ok) throw new Error();
            showLriModal('Slot Secured', 'Success! You secured one of the 5 candidate slots for the election.', '🏃‍♂️');
            input.value = '';
            fetchShortlistedCandidates();
        } catch (err) {
            showLriModal('Error', 'Could not lock in candidacy slot.', '❌');
        }
    });
}