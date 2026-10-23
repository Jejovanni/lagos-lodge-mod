'use client';
// src/app/sanctum/page.tsx
// Lagos Research Initiative — Inner Sanctum Web Application
// Recreates the exact Inner Sanctum, Weekly Elections, and Candidate Lobby experience directly in the web app.

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Directive {
  id: string;
  directive_text: string;
  author_handle: string;
  created_at: string;
}

interface Fellow {
  in_game_handle: string;
  research_rank?: string;
  contribution_points?: number;
}

interface ElectionCandidate {
  id: string;
  candidate_handle: string;
  votes: number;
}

interface LobbyPetition {
  id: string;
  candidate_handle: string;
  platform_text: string;
  created_at: string;
}

export default function SanctumPage() {
  const [activeTab, setActiveTab] = useState<'sanctum' | 'elections' | 'lobby'>('sanctum');
  const [sanctumSubTab, setSanctumSubTab] = useState<'board' | 'fellows'>('board');
  const [isLriActive, setIsLriActive] = useState(true);

  // User state
  const [usernameInput, setUsernameInput] = useState('');
  const [userHandle, setUserHandle] = useState<string | null>(null);

  // Data states
  const [directives, setDirectives] = useState<Directive[]>([]);
  const [fellows, setFellows] = useState<Fellow[]>([]);
  const [candidates, setCandidates] = useState<ElectionCandidate[]>([]);
  const [petitions, setPetitions] = useState<LobbyPetition[]>([]);

  // Input states
  const [newDirective, setNewDirective] = useState('');
  const [candidateHandle, setCandidateHandle] = useState('');
  const [lobbyHandle, setLobbyHandle] = useState('');
  const [lobbyPlatform, setLobbyPlatform] = useState('');

  // Status/modal alerts
  const [modal, setModal] = useState<{ title: string; message: string; icon: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lri_user_handle');
    if (saved) {
      setUserHandle(saved);
      setCandidateHandle(saved);
      setLobbyHandle(saved);
    }
    loadAllData();
  }, []);

  async function loadAllData() {
    loadDirectives();
    loadFellows();
    loadCandidates();
    loadPetitions();
  }

  async function loadDirectives() {
    try {
      const res = await fetch('/api/directives');
      if (res.ok) {
        const d = await res.json();
        setDirectives(d.directives || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadFellows() {
    try {
      const res = await fetch('/api/fellows');
      if (res.ok) {
        const d = await res.json();
        setFellows(d.fellows || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadCandidates() {
    try {
      const res = await fetch('/api/elections');
      if (res.ok) {
        const d = await res.json();
        setCandidates(d.candidates || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadPetitions() {
    try {
      const res = await fetch('/api/lobby');
      if (res.ok) {
        const d = await res.json();
        setPetitions(d.petitions || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    const handle = usernameInput.trim();
    localStorage.setItem('lri_user_handle', handle);
    setUserHandle(handle);
    setCandidateHandle(handle);
    setLobbyHandle(handle);
    setModal({
      title: 'Welcome Initiate',
      message: `You have successfully entered as ${handle}.`,
      icon: '👑',
    });
  }

  function handleLogout() {
    localStorage.removeItem('lri_user_handle');
    setUserHandle(null);
  }

  async function handlePublishDirective(e: React.FormEvent) {
    e.preventDefault();
    if (!newDirective.trim()) {
      setModal({ title: 'Empty Field', message: 'Directive text cannot be empty.', icon: '⚠️' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/directives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directive_text: newDirective.trim(),
          author_handle: userHandle || 'Director Adebayo',
        }),
      });
      if (res.ok) {
        setNewDirective('');
        loadDirectives();
        setModal({
          title: 'Directive Broadcasted',
          message: 'New policy directive broadcasted successfully across the LRI network!',
          icon: '👑',
        });
      } else {
        setModal({ title: 'Error', message: 'Failed to broadcast directive.', icon: '❌' });
      }
    } catch {
      setModal({ title: 'Network Error', message: 'Failed to connect to syndicate servers.', icon: '❌' });
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyCandidate(e: React.FormEvent) {
    e.preventDefault();
    const handle = candidateHandle.trim();
    if (!handle) {
      setModal({ title: 'Missing Handle', message: 'Please provide your in-game handle.', icon: '⚠️' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/elections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_handle: handle }),
      });
      const data = await res.json();
      if (res.ok) {
        setModal({
          title: 'Slot Secured',
          message: 'Success! You secured one of the 5 candidate slots for the election.',
          icon: '🏃‍♂️',
        });
        loadCandidates();
      } else {
        setModal({ title: 'Slots Full', message: data.error || 'Could not lock in candidacy slot.', icon: '⏳' });
      }
    } catch {
      setModal({ title: 'Error', message: 'Error securing candidate slot.', icon: '❌' });
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(candidateId: string) {
    try {
      const res = await fetch('/api/elections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', candidate_id: candidateId }),
      });
      if (res.ok) {
        loadCandidates();
        setModal({
          title: 'Ballot Cast',
          message: 'Your vote has been securely recorded on the LRI network ledger!',
          icon: '🗳️',
        });
      }
    } catch {
      setModal({ title: 'Vote Failed', message: 'Unable to cast vote.', icon: '❌' });
    }
  }

  async function handleSubmitLobby(e: React.FormEvent) {
    e.preventDefault();
    const handle = lobbyHandle.trim();
    const platform = lobbyPlatform.trim();
    if (!handle || !platform) {
      setModal({ title: 'Missing Fields', message: 'Please provide both your handle and political platform.', icon: '⚠️' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/lobby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_handle: handle, platform_text: platform }),
      });
      if (res.ok) {
        setLobbyPlatform('');
        loadPetitions();
        setModal({
          title: 'Platform Submitted',
          message: 'Your platform has been successfully published to the Public Manifesto Board!',
          icon: '📜',
        });
      } else {
        setModal({ title: 'Error', message: 'Failed to submit platform.', icon: '❌' });
      }
    } catch {
      setModal({ title: 'Network Error', message: 'Could not connect to syndicate.', icon: '❌' });
    } finally {
      setLoading(false);
    }
  }

  const isDirector = userHandle ? userHandle.toLowerCase().includes('director') || userHandle.toLowerCase().includes('adebayo') : true;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: '#334155', display: 'flex', flexDirection: 'column' }}>

      {/* Top Banner & Header matching original injector layout */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/lri-logo.jpg" alt="LRI Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Lagos Research Initiative</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {userHandle ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: '#475569' }}>
                👤 <strong>{userHandle}</strong>
              </span>
              <button
                onClick={handleLogout}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#64748b', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
              >
                Switch User
              </button>
            </div>
          ) : (
            <Link href="/" style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none' }}>
              &larr; Home
            </Link>
          )}

          {/* Toggle Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
              {isLriActive ? 'Active' : 'Off'}
            </span>
            <button
              onClick={() => setIsLriActive(!isLriActive)}
              style={{
                width: '42px',
                height: '24px',
                borderRadius: '12px',
                background: isLriActive ? '#10b981' : '#cbd5e1',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                padding: '2px',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  transform: isLriActive ? 'translateX(18px)' : 'translateX(0)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Drawer Container */}
      <div style={{ maxWidth: '960px', width: '100%', margin: '24px auto', padding: '0 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Username Login Modal / Banner if not logged in */}
        {!userHandle && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Enter In-Game Username</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Log in to access your personalized candidate slot and issue directives.</div>
            </div>
            <form onSubmit={handleLogin} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="e.g. Director Adebayo"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px' }}
              />
              <button
                type="submit"
                style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Enter
              </button>
            </form>
          </div>
        )}

        {/* The 3 Tabs: Inner Sanctum, Weekly Elections, Candidate Lobby */}
        <div style={{ display: 'flex', background: '#f8fafc', padding: '4px', border: '1px solid #e2e8f0', borderRadius: '12px 12px 0 0', borderBottom: 'none' }}>
          <button
            onClick={() => setActiveTab('sanctum')}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'sanctum' ? '#ffffff' : 'transparent',
              color: activeTab === 'sanctum' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'sanctum' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Inner Sanctum
          </button>
          <button
            onClick={() => setActiveTab('elections')}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'elections' ? '#ffffff' : 'transparent',
              color: activeTab === 'elections' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'elections' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Weekly Elections
          </button>
          <button
            onClick={() => setActiveTab('lobby')}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'lobby' ? '#ffffff' : 'transparent',
              color: activeTab === 'lobby' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'lobby' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            Candidate Lobby
          </button>
        </div>

        {/* Tab Contents Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0 0 12px 12px', padding: '24px', flex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>

          {/* TAB 1: INNER SANCTUM */}
          {activeTab === 'sanctum' && (
            <div>
              {/* Policy Board / Fellows Roster Sub-Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  onClick={() => setSanctumSubTab('board')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: sanctumSubTab === 'board' ? '#e2e8f0' : '#f8fafc',
                    border: sanctumSubTab === 'board' ? 'none' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#0f172a',
                  }}
                >
                  Policy Board
                </button>
                <button
                  onClick={() => setSanctumSubTab('fellows')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: sanctumSubTab === 'fellows' ? '#e2e8f0' : '#f8fafc',
                    border: sanctumSubTab === 'fellows' ? 'none' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#0f172a',
                  }}
                >
                  Fellows Roster
                </button>
              </div>

              {/* Sub-Panel: Policy Board */}
              {sanctumSubTab === 'board' && (
                <div>
                  {/* Executive Authority Card */}
                  <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderLeft: '4px solid #d97706', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 700, textTransform: 'uppercase' }}>
                      Syndicate Executive Authority
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#78350f', margin: '4px 0' }}>
                      👑 Reigned by Grand Director
                    </div>
                    <div style={{ fontSize: '12px', color: '#92400e', fontWeight: 500 }}>
                      Kingmaker Election Syndicate
                    </div>
                  </div>

                  {/* Active Policy Directives Card */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                      📋 Active Policy Directives (APDs)
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                      Official marching orders issued by the reigning Grand Director.
                    </div>

                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', minHeight: '80px', marginBottom: '16px' }}>
                      {directives.length === 0 ? (
                        <div style={{ color: '#64748b', fontStyle: 'italic', fontSize: '13px' }}>
                          No active directives issued yet.
                        </div>
                      ) : (
                        directives.map((d) => (
                          <div key={d.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                            <div style={{ fontWeight: 500, color: '#1e293b' }}>• {d.directive_text}</div>
                            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                              Issued by {d.author_handle}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Grand Director Control Panel */}
                    {isDirector && (
                      <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#d97706', marginBottom: '8px' }}>
                          👑 Grand Director Control Panel
                        </div>
                        <form onSubmit={handlePublishDirective}>
                          <input
                            type="text"
                            placeholder="Broadcast a new policy directive..."
                            value={newDirective}
                            onChange={(e) => setNewDirective(e.target.value)}
                            style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', width: '100%', fontSize: '13px', marginBottom: '10px', boxSizing: 'border-box' }}
                          />
                          <button
                            type="submit"
                            disabled={loading}
                            style={{ width: '100%', padding: '12px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            {loading ? 'Broadcasting...' : 'Issue Directive to Syndicate'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-Panel: Fellows Roster */}
              {sanctumSubTab === 'fellows' && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                    👥 Syndicate Fellows Roster
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                    Active members operating within the LRI network.
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                    {fellows.length === 0 ? (
                      <div style={{ color: '#64748b', fontStyle: 'italic', padding: '10px' }}>No active fellows registered.</div>
                    ) : (
                      fellows.map((m, idx) => (
                        <div key={idx} style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                          <strong>{m.in_game_handle}</strong>
                          <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            {m.research_rank || 'LRI Initiate'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WEEKLY ELECTIONS */}
          {activeTab === 'elections' && (
            <div>
              {/* Election Timer Card */}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#b45309', marginBottom: '4px' }}>
                  ⏱️ Grand Director Election Timer
                </div>
                <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '8px' }}>
                  Next application window opens in:
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#78350f', fontFamily: 'monospace' }}>
                  06D : 14H : 32M
                </div>
              </div>

              {/* Candidate Application Race (First 5 Slots) */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  🏃‍♂️ Candidate Application Race (First 5 Slots)
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                  When countdown hits zero, the first 5 members to register lock in their ballot placement.
                </div>
                <form onSubmit={handleApplyCandidate}>
                  <input
                    type="text"
                    placeholder="Your In-Game Handle"
                    value={candidateHandle}
                    onChange={(e) => setCandidateHandle(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', width: '100%', fontSize: '13px', marginBottom: '10px', boxSizing: 'border-box' }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: 600, background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Lock In Candidacy Slot
                  </button>
                </form>
              </div>

              {/* Active 10-Hour Voting Sprint */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  🗳️ Active 10-Hour Voting Sprint
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', fontSize: '13px' }}>
                  {candidates.length === 0 ? (
                    <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                      Waiting for election sprint to open...
                    </div>
                  ) : (
                    candidates.map((c) => (
                      <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{c.candidate_handle}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Votes: {c.votes || 0}</div>
                        </div>
                        <button
                          onClick={() => handleVote(c.id)}
                          style={{ padding: '6px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Vote
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CANDIDATE LOBBY */}
          {activeTab === 'lobby' && (
            <div>
              {/* Public Manifesto Board */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                  📜 Public Manifesto Board
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                  Review platforms submitted by candidates seeking official LRI endorsement.
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', maxHeight: '240px', overflowY: 'auto' }}>
                  {petitions.length === 0 ? (
                    <div style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>
                      No candidate platforms submitted yet.
                    </div>
                  ) : (
                    petitions.map((p) => (
                      <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong style={{ color: '#0f172a', fontSize: '13px' }}>🏛️ {p.candidate_handle}</strong>
                          <span style={{ fontSize: '10px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            Pending Review
                          </span>
                        </div>
                        <p style={{ color: '#475569', fontSize: '12px', lineHeight: 1.4, margin: 0, whiteSpace: 'pre-wrap' }}>
                          {p.platform_text}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Submit Platform Form */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
                  🤝 Submit Your Political Platform
                </div>
                <form onSubmit={handleSubmitLobby}>
                  <input
                    type="text"
                    placeholder="Candidate In-Game Handle"
                    value={lobbyHandle}
                    onChange={(e) => setLobbyHandle(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '8px', width: '100%', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                  <textarea
                    placeholder="Outline your political platform..."
                    value={lobbyPlatform}
                    onChange={(e) => setLobbyPlatform(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '12px', width: '100%', height: '80px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '12px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {loading ? 'Submitting...' : 'Submit Platform for Review'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Recreated Modal Overlay System from extension */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', padding: '24px', maxWidth: '360px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>{modal.icon}</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>{modal.title}</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 20px 0' }}>{modal.message}</p>
            <button
              onClick={() => setModal(null)}
              style={{ width: '100%', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
