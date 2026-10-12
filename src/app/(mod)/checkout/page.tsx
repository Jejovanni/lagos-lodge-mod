'use client';
// src/app/(mod)/checkout/page.tsx
// Public checkout landing page — mobile-first, dark theme.
// Lets buyers choose a membership tier and redirects to Paystack checkout.

import { useState } from 'react';

type Tier = 'standard' | 'premium' | 'lifetime';

interface TierConfig {
  id: Tier;
  name: string;
  price: string;
  description: string;
  perks: string[];
  highlight?: boolean;
}

const TIERS: TierConfig[] = [
  {
    id: 'standard',
    name: 'Novice',
    price: '₦2,500',
    description: 'Begin your journey into the Brotherhood.',
    perks: [
      'Access to Inner Sanctum',
      'Novice → Craftsman ranks',
      'Petition Portal',
      'Basic task access',
    ],
  },
  {
    id: 'premium',
    name: 'Brother',
    price: '₦7,500',
    description: 'Rise through all ranks of the Lodge.',
    perks: [
      'All Novice perks',
      'Access to all 6 ranks',
      'Lodge Treasury dashboard',
      'Exclusive ritual tasks',
      'Priority petition review',
    ],
    highlight: true,
  },
  {
    id: 'lifetime',
    name: 'Grand Master',
    price: '₦25,000',
    description: 'Eternal membership. Your name etched in the Lodge records.',
    perks: [
      'All Brother perks',
      'Up to 3 device activations',
      'Lifetime access — never expires',
      'Grand Master badge',
      'Admin petition review access',
    ],
  },
];

export default function CheckoutPage() {
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [selected, setSelected]   = useState<Tier>('premium');

  async function handleCheckout() {
    setError(null);
    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/checkout/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tier: selected }),
      });

      const data = await res.json();

      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? 'Failed to initialise checkout. Please try again.');
        return;
      }

      // Redirect to Paystack's hosted checkout
      window.location.href = data.checkoutUrl;
    } catch {
      setError('A network error occurred. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f0e0c] text-[#e8d98c] px-4 py-10 font-serif">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="text-5xl block mb-3">⬡</span>
        <h1 className="text-2xl font-bold tracking-widest text-[#d4af37] uppercase">
          The Secret Lodge
        </h1>
        <p className="text-sm text-[#8b7320] tracking-wider mt-1 uppercase">
          Choose your rank. Begin the journey.
        </p>
      </div>

      {/* Tier cards */}
      <div className="flex flex-col gap-4 max-w-md mx-auto">
        {TIERS.map((tier) => (
          <button
            key={tier.id}
            onClick={() => setSelected(tier.id)}
            className={`
              w-full text-left rounded-xl border-2 p-5 transition-all duration-200
              ${selected === tier.id
                ? 'border-[#d4af37] bg-[#1a1810] shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                : 'border-[#2a2518] bg-[#0f0e0c]'}
              ${tier.highlight ? 'relative' : ''}
            `}
          >
            {tier.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2
                               bg-[#d4af37] text-[#0f0e0c] text-[10px] font-bold
                               px-3 py-0.5 rounded-full tracking-widest uppercase">
                Most Popular
              </span>
            )}

            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[#d4af37] font-bold text-lg tracking-wider">
                  {tier.name}
                </span>
                {selected === tier.id && (
                  <span className="ml-2 text-[#d4af37] text-xs">✓ Selected</span>
                )}
              </div>
              <span className="text-[#d4af37] font-bold text-xl">{tier.price}</span>
            </div>

            <p className="text-[#8b7320] text-sm mb-3">{tier.description}</p>

            <ul className="space-y-1">
              {tier.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-sm text-[#c8b96c]">
                  <span className="text-[#d4af37] text-xs">◆</span>
                  {perk}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Email + CTA */}
      <div className="max-w-md mx-auto mt-8 space-y-4">
        <div>
          <label className="block text-xs text-[#8b7320] uppercase tracking-widest mb-2">
            Your Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="brother@example.com"
            className="w-full bg-[#1a1810] border border-[#3a3020] rounded-lg
                       px-4 py-3 text-[#e8d98c] placeholder-[#4a4030]
                       focus:outline-none focus:border-[#d4af37] text-sm"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#8b7320]
                     text-[#0f0e0c] font-bold text-base tracking-widest uppercase
                     rounded-xl transition-opacity disabled:opacity-60
                     min-h-[48px]"
        >
          {loading ? 'Redirecting to payment…' : `⬡ Proceed to Payment`}
        </button>

        <p className="text-center text-[#4a4030] text-xs leading-relaxed">
          Payments secured by Paystack. Your key will be emailed immediately after payment.
          One-time purchase — no subscription.
        </p>
      </div>

      {/* Trust badges */}
      <div className="flex justify-center gap-6 mt-8 text-[#4a4030] text-xs">
        <span>🔒 SSL Secured</span>
        <span>✓ Instant Delivery</span>
        <span>⬡ 1-Key 1-Device</span>
      </div>
    </main>
  );
}
