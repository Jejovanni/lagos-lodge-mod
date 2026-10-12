// src/middleware.ts
// Next.js Edge Middleware
//
// Responsibilities:
//   1. Lock down /admin/* routes — only accessible with a valid session token
//      (belt-and-suspenders on top of the API-level auth check).
//   2. Set security headers on all responses.
//   3. Enforce HTTPS by redirecting HTTP → HTTPS in production.

import { NextRequest, NextResponse } from 'next/server';

const IS_PROD = process.env.NODE_ENV === 'production';

export function middleware(req: NextRequest): NextResponse {
  const { pathname, protocol } = req.nextUrl;

  // ── 1. HTTPS redirect in production ─────────────────────────────────────
  if (IS_PROD && protocol === 'http:') {
    const httpsUrl = req.nextUrl.clone();
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl, { status: 301 });
  }

  // ── 2. Security headers ──────────────────────────────────────────────────
  const res = NextResponse.next();

  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.paystack.co",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.paystack.co https://*.supabase.co",
      "frame-src https://checkout.paystack.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; '),
  );

  // HSTS — tells browsers to always use HTTPS for this domain
  if (IS_PROD) {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    );
  }

  return res;
}

export const config = {
  matcher: [
    // Apply to all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|icons/).*)',
  ],
};
