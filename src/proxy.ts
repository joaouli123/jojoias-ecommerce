import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { consumeRateLimit, isUpstashConfigured } from "@/lib/upstash";

type RateLimitRule = {
  pattern: RegExp;
  limit: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOutcome = {
  blockedResponse: NextResponse | null;
  headers: Record<string, string>;
};

const RATE_LIMIT_RULES: RateLimitRule[] = [
  { pattern: /^\/api\/auth\/register$/, limit: 5, windowMs: 10 * 60 * 1000 },
  { pattern: /^\/api\/coupons\/validate$/, limit: 20, windowMs: 10 * 60 * 1000 },
  { pattern: /^\/api\/newsletter$/, limit: 10, windowMs: 10 * 60 * 1000 },
  { pattern: /^\/api\/shipping\/calculate$/, limit: 40, windowMs: 5 * 60 * 1000 },
  { pattern: /^\/api\/upload$/, limit: 20, windowMs: 10 * 60 * 1000 },
  { pattern: /^\/api\/products\/search$/, limit: 80, windowMs: 5 * 60 * 1000 },
  { pattern: /^\/api\/webhooks\/mercado-pago$/, limit: 120, windowMs: 5 * 60 * 1000 },
];

const globalForRateLimit = globalThis as typeof globalThis & {
  __rateLimitBuckets?: Map<string, RateLimitBucket>;
};

const rateLimitBuckets = globalForRateLimit.__rateLimitBuckets ?? new Map<string, RateLimitBucket>();

if (!globalForRateLimit.__rateLimitBuckets) {
  globalForRateLimit.__rateLimitBuckets = rateLimitBuckets;
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function findRateLimitRule(pathname: string) {
  return RATE_LIMIT_RULES.find((rule) => rule.pattern.test(pathname));
}

function buildRateLimitHeaders(limit: number, remaining: number, resetAt: number) {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(Math.max(0, remaining)),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  };
}

async function applyRateLimit(request: NextRequest, pathname: string): Promise<RateLimitOutcome> {
  const rule = findRateLimitRule(pathname);
  if (!rule) {
    return { blockedResponse: null, headers: {} };
  }

  const now = Date.now();
  const clientIp = getClientIp(request);
  const key = `${pathname}:${clientIp}`;

  if (isUpstashConfigured()) {
    try {
      const result = await consumeRateLimit(pathname, clientIp, rule.limit, rule.windowMs);
      if (result) {
        const resetAt = Number(result.reset);
        const headers = buildRateLimitHeaders(result.limit, result.remaining, resetAt);

        if (!result.success) {
          return {
            blockedResponse: NextResponse.json(
              { error: "Muitas requisições. Tente novamente em instantes." },
              {
                status: 429,
                headers: {
                  ...headers,
                  "Retry-After": String(Math.max(1, Math.ceil((resetAt - now) / 1000))),
                },
              },
            ),
            headers,
          };
        }

        return { blockedResponse: null, headers };
      }
    } catch {
    }
  }

  const existing = rateLimitBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + rule.windowMs;
    rateLimitBuckets.set(key, {
      count: 1,
      resetAt,
    });
    return {
      blockedResponse: null,
      headers: buildRateLimitHeaders(rule.limit, rule.limit - 1, resetAt),
    };
  }

  if (existing.count >= rule.limit) {
    return {
      blockedResponse: NextResponse.json(
        { error: "Muitas requisições. Tente novamente em instantes." },
        {
          status: 429,
          headers: {
            ...buildRateLimitHeaders(rule.limit, 0, existing.resetAt),
            "Retry-After": String(Math.max(1, Math.ceil((existing.resetAt - now) / 1000))),
          },
        },
      ),
      headers: buildRateLimitHeaders(rule.limit, 0, existing.resetAt),
    };
  }

  existing.count += 1;
  rateLimitBuckets.set(key, existing);
  return {
    blockedResponse: null,
    headers: buildRateLimitHeaders(rule.limit, rule.limit - existing.count, existing.resetAt),
  };
}

function buildContentSecurityPolicy() {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https:",
    "script-src 'self' 'unsafe-inline' https:",
    "connect-src 'self' https:",
    "object-src 'none'",
    "media-src 'self' data: https:",
    process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
  ].filter(Boolean).join("; ");
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const rateLimitOutcome = pathname.startsWith("/api") ? await applyRateLimit(request, pathname) : { blockedResponse: null, headers: {} };
  if (rateLimitOutcome.blockedResponse) {
    return rateLimitOutcome.blockedResponse;
  }

  const response = NextResponse.next();
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;
  const isAuthenticated = Boolean(sessionToken);
  const isProtectedPage = pathname.startsWith("/account") || pathname.startsWith("/admin");

  if (isProtectedPage && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy());

  if (pathname.startsWith("/api")) {
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-webhook-signature");
    for (const [header, value] of Object.entries(rateLimitOutcome.headers)) {
      response.headers.set(header, value);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.png|favicon-16x16.png|favicon-32x32.png|apple-touch-icon.png|icon-192.png|icon-512.png).*)"],
};