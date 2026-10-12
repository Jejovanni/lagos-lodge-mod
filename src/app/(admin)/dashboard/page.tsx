'use client';
// src/app/(admin)/dashboard/page.tsx
// Grand Master admin dashboard — petition review UI.
// Mobile-first, dark theme, protected by session-based auth.

import { useState, useEffect, useCallback } from 'react';
import type { ApplicationStatus } from '@/types/mod';

interface Petition {
  id: string;
  applicant_name: string;
  email: string;
  in_game_name: string;
  status: ApplicationStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_notes: string | null;
}

type FilterStatus = ApplicationStatus | 'all';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending:      'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  under_review: 'text-blue-400  bg-blue-400/10  border-blue-400/30',
  accepted:     'text-green-400 bg-green-400/10 border-green-400/30',
  rejected:     'text-red-400   bg-red-400/10   border-red-400/30',
  waitlisted:   'text-purple-400 bg-purple-400/10 border-purple-400/30',
};

export default function AdminDashboard() {
  const [sessionToken, setSessionToken] = useState('');
  const [authed, setAuthed]             = useState(false);
  const [petitions, setPetitions]       = useState<Petition[]>([]);
  const [filter, setFilter]             = useState<FilterStatus>('pending');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [selected, setSelected]         = useState<Petition | null>(null);
  const [reviewNotes, setReviewNotes]   = useState('');
  const [reviewTier, setReviewTier]     = useState<string>('standard');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg]       = useState<string | null>(null);

  const fetchPetitions = useCallback(async (token: string, status: FilterStatus) => {
    setLoading(true);
    setError(null);
    const qs = status === 'all' ? '' : `?status=${status}`;
    try {
      const res = await fetch(`/api/admin/petitions${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { setAuthed(false); return; }
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setPetitions(data.petitions ?? []);
    } catch {
      setError('Network error loading petitions.');
    } finally {
      setLoading(false);
    }
  }, []);

  function handleLogin() {
    if (!sessionToken.trim()) return;
    setAuthed(true);
    fetchPetitions(sessionToken, filter);
  }

  useEffect(() => {
    if (authed) fetchPetitions(sessionToken, filter);
  }, [filter, authed, sessionToken, fetchPetitions]);

  async function handleReview(status: 'accepted' | 'rejected' | 'under_review' | 'waitlisted') {
    if (!selected) return;
    setActionLoading(true);
    setActionMsg(null);

    try {
      const res = await fetch(`/api/admin/petitions/${selected.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reviewer_notes: reviewNotes,
          license_tier: status === 'accepted' ? reviewTier : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setActionMsg(`Error: ${data.error}`);
        return;
      }

      setActionMsg(data.message);
      setSelected(null);
      fetchPetitions(sessionToken, filter);
    } catch {
      setActionMsg('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }

  // ── Login screen ──────────────────────────────────────────────────────
  if (!authed) {
    return (
      <main className="min-h-screen bg-[#0f0e0c] flex flex-col items-center justify-center px-6">
        <span className="text-5xl mb-4">⬡</span>
        <h1 className="text-xl font-bold text-[#d4af37] tracking-widest uppercase mb-8">
          Grand Lodge Administration
        </h1>
        <div className="w-full max-w-sm space-y-4">
          <input
            type="password"
            placeholder="Paste your session token"
            value={sessionToken}
            onChange={(e) => setSessionToken(e.target.value)}
            className="w-full bg-[#1a1810] border border-[#3a3020] rounded-lg
                       px-4 py-3 text-[#e8d98c] placeholder-[#4a4030]
                       focus:outline-none focus:border-[#d4af37] text-sm"
          />
          <button
            onClick={handleLogin}
            className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#8b7320]
                       text-[#0f0e0c] font-bold tracking-widest uppercase
                       rounded-xl min-h-[48px]"
          >
            Enter the Sanctum
          </button>
        </div>
      </main>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0f0e0c] text-[#e8d98c] font-serif">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f0e0c] border-b border-[#2a2518] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#d4af37] text-xl">⬡</span>
            <span className="text-[#d4af37] font-bold tracking-wider text-sm uppercase">
              Lodge Admin
            </span>
          </div>
          <button
            onClick={() => { setAuthed(false); setSessionToken(''); }}
            className="text-[#4a4030] text-xs uppercase tracking-wider"
          >
            Sign Out
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {(['pending', 'under_review', 'accepted', 'rejected', 'waitlisted', 'all'] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-full text-xs uppercase tracking-wider border
                transition-colors
                ${filter === s
                  ? 'bg-[#d4af37] text-[#0f0e0c] border-[#d4af37]'
                  : 'text-[#8b7320] border-[#2a2518]'}
              `}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4 space-y-3">
        {loading && (
          <p className="text-center text-[#4a4030] text-sm py-10">Loading petitions…</p>
        )}
        {error && (
          <p className="text-center text-red-400 text-sm py-10">{error}</p>
        )}
        {!loading && !error && petitions.length === 0 && (
          <p className="text-center text-[#4a4030] text-sm py-10">
            No petitions with status: {filter}
          </p>
        )}
        {petitions.map((p) => (
          <button
            key={p.id}
            onClick={() => { setSelected(p); setReviewNotes(p.reviewer_notes ?? ''); setActionMsg(null); }}
            className="w-full text-left bg-[#1a1810] rounded-xl border border-[#2a2518]
                       p-4 transition-colors active:border-[#d4af37]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-[#d4af37] text-sm">{p.applicant_name}</p>
                <p className="text-[#8b7320] text-xs mt-0.5">{p.in_game_name} · {p.email}</p>
              </div>
              <span className={`
                text-[10px] uppercase font-bold tracking-wider px-2 py-1
                rounded-full border flex-shrink-0
                ${STATUS_COLORS[p.status]}
              `}>
                {p.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[#4a4030] text-xs mt-2">
              {new Date(p.submitted_at).toLocaleDateString('en-NG', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
          </button>
        ))}
      </div>

      {/* Review panel (slide-up) */}
      {selected && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelected(null)}
          />
          <div className="relative bg-[#0f0e0c] border-t-2 border-[#d4af37]
                          rounded-t-2xl max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 bg-[#d4af37] rounded mx-auto mt-3 mb-4" />

            <div className="px-5 pb-8 space-y-5">
              <div>
                <h2 className="text-[#d4af37] font-bold text-lg">{selected.applicant_name}</h2>
                <p className="text-[#8b7320] text-sm">{selected.email} · {selected.in_game_name}</p>
              </div>

              {/* Reviewer notes */}
              <div>
                <label className="block text-xs text-[#8b7320] uppercase tracking-widest mb-2">
                  Reviewer Notes
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Internal notes (not sent to applicant)"
                  rows={3}
                  className="w-full bg-[#1a1810] border border-[#3a3020] rounded-lg
                             px-4 py-3 text-[#e8d98c] placeholder-[#4a4030]
                             focus:outline-none focus:border-[#d4af37] text-sm resize-none"
                />
              </div>

              {/* Tier (shown only for acceptance) */}
              <div>
                <label className="block text-xs text-[#8b7320] uppercase tracking-widest mb-2">
                  License Tier (if accepting)
                </label>
                <select
                  value={reviewTier}
                  onChange={(e) => setReviewTier(e.target.value)}
                  className="w-full bg-[#1a1810] border border-[#3a3020] rounded-lg
                             px-4 py-3 text-[#e8d98c] focus:outline-none
                             focus:border-[#d4af37] text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>

              {actionMsg && (
                <p className="text-center text-sm text-[#d4af37]">{actionMsg}</p>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleReview('under_review')}
                  disabled={actionLoading}
                  className="py-3 rounded-xl border border-blue-400/30 text-blue-400
                             text-sm font-bold tracking-wider disabled:opacity-50"
                >
                  Under Review
                </button>
                <button
                  onClick={() => handleReview('waitlisted')}
                  disabled={actionLoading}
                  className="py-3 rounded-xl border border-purple-400/30 text-purple-400
                             text-sm font-bold tracking-wider disabled:opacity-50"
                >
                  Waitlist
                </button>
                <button
                  onClick={() => handleReview('rejected')}
                  disabled={actionLoading}
                  className="py-3 rounded-xl border border-red-400/30 text-red-400
                             text-sm font-bold tracking-wider disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleReview('accepted')}
                  disabled={actionLoading}
                  className="py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#8b7320]
                             text-[#0f0e0c] text-sm font-bold tracking-wider
                             disabled:opacity-50"
                >
                  {actionLoading ? '…' : '⬡ Accept'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
