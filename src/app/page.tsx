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
        <Link href="#pricing" style={{ padding: '8px 16px', background: '#10b981', color: '#ffffff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s' }}>
          Join the Syndicate
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
        <Link href="#pricing" style={{ display: 'inline-block', padding: '14px 28px', background: '#10b981', color: '#ffffff', borderRadius: '12px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
          Secure Your Syndicate Fellowship
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

      {/* Pricing / Checkout Card */}
      <section id="pricing" style={{ width: '100%', maxWidth: '440px', background: '#ffffff', border: '2px solid #d97706', borderRadius: '20px', padding: '32px', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(217, 119, 6, 0.1)' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', marginBottom: '8px' }}>Lifetime Access Pass</div>
        <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>₦15,000 <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>/ one-time</span></div>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Unlocks full extension package, gold profile frame, and voting rights.</p>

        <Link href="/download" style={{ display: 'block', width: '100%', padding: '14px', background: '#10b981', color: '#ffffff', borderRadius: '12px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', transition: 'background 0.2s', textAlign: 'center' }}>
          Proceed to Secure Checkout
        </Link>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px' }}>Instant activation upon successful verification.</div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: '80px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
        &copy; 2026 Lagos Research Initiative. All rights reserved. Operating within Lagos Life.
      </footer>

    </div>
  );
}