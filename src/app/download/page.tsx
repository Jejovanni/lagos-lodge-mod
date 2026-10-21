import React from 'react';
import Link from 'next/link';

export default function DownloadPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', color: '#334155', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>

            <div style={{ width: '100%', maxWidth: '480px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '36px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', textAlign: 'center' }}>

                <div style={{ width: '56px', height: '56px', background: '#ecfdf5', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px', border: '1px solid #a7f3d0' }}>
                    🚀
                </div>

                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                    Join the Syndicate
                </h1>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '24px' }}>
                    Install the official LRI package to unlock your node inside <a href="https://lagoslife.app/" target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>Lagos Life</a>[cite: 1]. 100% Free for all active fellows.
                </p>

                {/* Desktop & Android Download Box */}
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>📦 Desktop / Android Package (v1.0.0)</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>For Chrome, Edge, Brave, or Yandex Browser (Unpacked Zip).</div>

                    <a href="/lri-extension.zip" download style={{ display: 'block', width: '100%', padding: '10px', background: '#10b981', color: '#ffffff', textAlign: 'center', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                        Download Extension (.zip)
                    </a>
                </div>

                {/* iOS Safari Userscript Download Box */}
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>🍏 iOS Safari Userscript</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>For iPhone / iPad via the Userscripts Safari extension.</div>

                    <a href="/lri-mod.user.js" download style={{ display: 'block', width: '100%', padding: '10px', background: '#4f46e5', color: '#ffffff', textAlign: 'center', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                        Download iOS Userscript (.user.js)
                    </a>
                </div>

                {/* Installation Steps */}
                <div style={{ textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '24px', fontSize: '12px', lineHeight: 1.55 }}>
                    <div style={{ fontWeight: 700, marginBottom: '12px', color: '#0f172a', fontSize: '13px' }}>📋 Step-by-Step Installation:</div>

                    {/* Desktop / Android Guide */}
                    <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontWeight: 700, color: '#047857', marginBottom: '6px' }}>💻 Desktop (Chrome / Brave / Edge) & Android (Yandex):</div>
                        <ol style={{ margin: 0, paddingLeft: '18px', color: '#334155' }}>
                            <li>Download & extract the <code style={{ background: '#e2e8f0', padding: '1px 4px', borderRadius: '4px' }}>.zip</code> archive.</li>
                            <li>Go to <code style={{ background: '#e2e8f0', padding: '1px 4px', borderRadius: '4px' }}>chrome://extensions</code> (or browser menu &rarr; Extensions).</li>
                            <li>Toggle <strong>Developer mode</strong> (top right corner).</li>
                            <li>Click <strong>Load unpacked</strong> and select the extracted folder.</li>
                            <li>Open <a href="https://lagoslife.app/" target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', fontWeight: 600 }}>lagoslife.app</a> — the LRI button appears!</li>
                        </ol>
                    </div>

                    {/* Safari Guide */}
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                        <div style={{ fontWeight: 700, color: '#4338ca', marginBottom: '6px' }}>🍏 Safari (iOS / iPadOS):</div>
                        <ol style={{ margin: 0, paddingLeft: '18px', color: '#334155' }}>
                            <li>Install the free <strong>Userscripts</strong> app from the App Store.</li>
                            <li>Open <em>Settings &rarr; Safari &rarr; Extensions</em>, enable <strong>Userscripts</strong>, and grant <em>Allow on All Websites</em>.</li>
                            <li>Tap <strong>Download iOS Userscript</strong> above and save it to the <em>Userscripts</em> folder in the Files app (or tap extension icon &rarr; <em>New / Install Script</em>).</li>
                            <li>Open or refresh <a href="https://lagoslife.app/" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', fontWeight: 600 }}>lagoslife.app</a>.</li>
                        </ol>
                    </div>
                </div>

                <Link href="/" style={{ display: 'inline-block', fontSize: '13px', color: '#64748b', textDecoration: 'none', fontWeight: 600 }}>
                    &larr; Back to Home
                </Link>

            </div>

        </div>
    );
}