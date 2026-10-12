import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0f0e0c] text-[#e8d98c] flex flex-col items-center justify-center px-4 py-12 text-center font-serif">
      <div className="max-w-lg space-y-6">
        <span className="text-6xl text-[#d4af37] block animate-pulse">⬡</span>
        
        <h1 className="text-3xl sm:text-4xl font-bold tracking-widest text-[#d4af37] uppercase">
          The Secret Lodge
        </h1>
        
        <p className="text-sm text-[#8b7320] tracking-widest uppercase">
          Exclusive Brotherhood Mod for Lagos Life
        </p>

        <p className="text-sm text-[#c8b96c] leading-relaxed max-w-md mx-auto">
          Ascend the ranks from Novice to Grand Master. Access the Inner Sanctum, secret rituals, and the Lodge Treasury directly inside your game.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/checkout"
            className="px-8 py-4 bg-gradient-to-r from-[#d4af37] to-[#8b7320] text-[#0f0e0c] font-bold text-sm tracking-widest uppercase rounded-xl transition-transform active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
          >
            Enter the Lodge (Checkout)
          </Link>
          
          <Link
            href="/dashboard"
            className="px-6 py-4 bg-[#1a1810] border border-[#3a3020] text-[#8b7320] hover:text-[#d4af37] font-bold text-sm tracking-widest uppercase rounded-xl transition-colors"
          >
            Council Admin
          </Link>
        </div>

        <div className="pt-8 text-xs text-[#4a4030] space-y-1">
          <p>Requires the Lodge Browser Extension</p>
          <p>Works seamlessly on mobile and desktop web</p>
        </div>
      </div>
    </main>
  );
}
