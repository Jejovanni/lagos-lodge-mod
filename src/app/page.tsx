import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: '#334155', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>

      {/* Navigation Header */}
      <header style={{ width: '100%', maxWidth: '900px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/lri-logo.jpg" alt="LRI Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Lagos Research Initiative</span>
        </div>
        <Link href="/download" style={{ padding: '8px 16px', background: '#10b981', color: '#ffffff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}>
          Get the Extension
        </Link>
      </header>

      {/* Hero Section */}
      <main style={{ width: '100%', maxWidth: '800px', textAlign: 'center', marginBottom: '60px' }}>
        <div style={{ display: 'inline-block', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, marginBottom: '16px' }}>
          👑 The Kingmaker Election Syndicate
        </div>
        <h1 style={{ fontSize: '38px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: '20px' }}>
          Shape Policy. Command Power. <br /><span style={{ color: '#d97706' }}>Rule Lagos Life.</span>
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.6, maxWidth: '650px', margin: '0 auto 30px' }}>
          The official political operating system and research network for elite fellows inside Lagos Life. Control Active Policy Directives, race for Grand Director, and secure your political influence.
        </p>
        <Link href="/download" style={{ display: 'inline-block', padding: '14px 28px', background: '#10b981', color: '#ffffff', borderRadius: '12px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
          Install Free LRI Extension
        </Link>
      </main>

      {/* Features Grid */}
      <section style={{ width: '100%', maxWidth: '900px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '60px' }}>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>👑</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Inner Sanctum & Policy Board</h3>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
            Access official marching orders issued by the reigning Grand Director and collaborate directly with active syndicate fellows.
          </p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏱️</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Weekly Election Races</h3>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
            Fast-paced 7-day countdowns, a high-stakes first-5 application slot race, and a 10-hour voting sprint to crown the weekly leader.
          </p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>📜</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Candidate Lobby & Manifestos</h3>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
            Publish your political platform to the public manifesto board for review and secure official LRI endorsement before ballots open.
          </p>
        </div>

      </section>

      {/* How To Guide Section */}
      <section style={{ width: '100%', maxWidth: '900px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '36px 32px', marginBottom: '60px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-block', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '16px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            User Guide
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            How to Use the LRI Mod
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Everything you need to know after installing the extension inside Lagos Life.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          
          {/* Step 1 */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ width: '26px', height: '26px', background: '#10b981', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>1</span>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Open the Dashboard</h4>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Launch <a href="https://lagoslife.app/" target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', fontWeight: 600 }}>lagoslife.app</a>. Click the circular <strong>LRI seal button</strong> floating in the bottom-right corner to slide up the dashboard.
            </p>
          </div>

          {/* Step 2 */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ width: '26px', height: '26px', background: '#d97706', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>2</span>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Follow Sanctum Directives</h4>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Under <strong>Inner Sanctum</strong>, review the reigning Grand Director&apos;s active weekly policy directive, syndicate roster, and collective political objectives.
            </p>
          </div>

          {/* Step 3 */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ width: '26px', height: '26px', background: '#4f46e5', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>3</span>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Run for Grand Director</h4>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Switch to <strong>Elections</strong>. When the countdown ends, be among the first 5 candidates to apply with your manifesto and campaign across Lagos.
            </p>
          </div>

          {/* Step 4 */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ width: '26px', height: '26px', background: '#0284c7', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>4</span>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Vote in Sprint Ballots</h4>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              During the 10-hour voting window, cast your vote for endorsed candidates. Live tallies determine who commands the syndicate for the following week.
            </p>
          </div>

        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link href="/download" style={{ display: 'inline-block', fontSize: '13px', fontWeight: 600, color: '#10b981', textDecoration: 'none' }}>
            Ready to deploy? Visit Download & Installation &rarr;
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: '80px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
        &copy; 2026 Lagos Research Initiative. All rights reserved. Operating within Lagos Life.
      </footer>

    </div>
  );
}