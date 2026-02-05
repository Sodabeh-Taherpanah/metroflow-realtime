import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter — suitable for dev/testing only
const RATE_LIMIT = Number(
  process.env.NEXT_RATE_LIMIT ?? (process.env.NODE_ENV === 'development' ? '100000' : '60')
); // requests
const RATE_WINDOW = Number(process.env.NEXT_RATE_WINDOW || 60) * 1000; // ms
const ipMap = new Map<string, { count: number; start: number }>();

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Enforce HTTPS
  if (process.env.ENFORCE_HTTPS === 'true' && req.nextUrl.protocol !== 'https:') {
    url.protocol = 'https:';
    return NextResponse.redirect(url);
  }

  // Rate limiting by IP
  try {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const entry = ipMap.get(ip) || { count: 0, start: now };
    if (now - entry.start > RATE_WINDOW) {
      entry.count = 1;
      entry.start = now;
    } else {
      entry.count += 1;
    }
    ipMap.set(ip, entry);
    if (entry.count > RATE_LIMIT) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }
  } catch (err) {
    // best effort
  }

  // Add a few security headers (double-check server headers in next.config)
  const res = NextResponse.next();
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'no-referrer');
  return res;
}

export const config = {
  matcher: '/:path*',
};
