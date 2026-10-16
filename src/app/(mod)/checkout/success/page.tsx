'use client';
// src/app/(mod)/checkout/success/page.tsx
// Displays the generated license key directly on-screen after payment.
// 100% Free: No domain or email provider required.

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [tier, setTier] = useState<string>('standard');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ref) {
      setError('No payment reference found.');
      setLoading(false);
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/checkout/verify?ref=${encodeURIComponent(ref!)}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.message || 'Payment verification pending or failed.');
          return;
        }

        if (data.licenseKey) {
          setLicenseKey(data.licenseKey);
        }
        if (data.tier) {
          setTier(data.tier);
        }
      } catch {
        setError('Network error while verifying payment.');
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [ref]);

  function copyToClipboard() {
    if (!licenseKey) return;
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  if (loading) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl animate-pulse block mb-4">⬡</span>
        <h2 className="text-[#d4af37] text-xl font-bold tracking-widest uppercase">
          Verifying Offering…
        </h2>
        <p className="text-[#8b7320] text-sm mt-2">
          Contacting the Grand Lodge…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <span className="text-4xl text-red-500 block mb-4">⚠️</span>
        <h2 className="text-red-400 text-lg font-bold mb-2">Verification Notice</h2>
        <p className="text-[#8b7320] text-sm mb-6">{error}</p>
        <a
          href="/checkout"
          className="inline-block px-6 py-3 bg-[#1a1810] border border-[#d4af37] text-[#d4af37] rounded-lg text-sm uppercase tracking-wider"
        >
          Return to Checkout
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center py-12 px-4 space-y-6">
      <span className="text-5xl text-[#d4af37] block">⬡</span>
      <div>
        <h1 className="text-2xl font-bold tracking-widest text-[#d4af37] uppercase">
          Welcome Initiate!
        </h1>
        <p className="text-xs text-[#8b7320] tracking-widest uppercase mt-1">
          Your Offering Has Been Accepted
        </p>
      </div>

      <div className="bg-[#1a1810] border-2 border-[#d4af37] rounded-xl p-6 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
        <p className="text-xs text-[#8b7320] uppercase tracking-widest mb-2">
          Your Secret License Key
        </p>

        {licenseKey ? (
          <>
            <div className="bg-[#0f0e0c] border border-[#3a3020] rounded-lg p-3 my-3">
              <code className="text-[#d4af37] font-mono text-lg font-bold tracking-widest select-all">
                {licenseKey}
              </code>
            </div>

            <button
              onClick={copyToClipboard}
              className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#8b7320] text-[#0f0e0c] font-bold text-sm tracking-widest uppercase rounded-lg transition-transform active:scale-95"
            >
              {copied ? '✓ Copied to Clipboard!' : '⬡ Copy License Key'}
            </button>
          </>
        ) : (
          <p className="text-sm text-[#e8d98c] my-4">
            Your key was previously issued. If you need it re-sent, contact your lodge master.
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-[#2a2518] text-xs text-[#8b7320] flex justify-between">
          <span>Tier: <strong className="text-[#e8d98c] uppercase">{tier}</strong></span>
          <span>Status: <strong className="text-green-400">ACTIVE</strong></span>
        </div>
      </div>

      <div className="bg-[#1a1810] border border-[#2a2518] rounded-xl p-4 text-left space-y-2 text-xs text-[#c8b96c]">
        <p className="font-bold text-[#d4af37] uppercase tracking-wider">How to activate in Lagos Life:</p>
        <ol className="list-decimal list-inside space-y-1 text-[#8b7320]">
          <li>Copy your license key above.</li>
          <li>Open Lagos Life in your browser.</li>
          <li>Click the gold compass-and-square emblem at the bottom right.</li>
          <li>Paste your key to enter the Inner Sanctum.</li>
        </ol>
      </div>

      <p className="text-[#4a4030] text-[11px] leading-relaxed">
        Save this key now. It is your permanent passport to the lodge.
      </p>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-[#0f0e0c] text-[#e8d98c] font-serif">
      <Suspense fallback={<div className="text-center py-20 text-[#8b7320]">Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </main>
  );
}
