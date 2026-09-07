import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

// Per-IP rate limiter for the public forms (contact + booking). Backed by
// Upstash Redis so the counter survives across Vercel's serverless function
// instances (an in-process Map would reset every cold start and not be
// shared between concurrent containers).
//
// Each form gets its own Redis key prefix so their quotas are independent —
// hitting the contact limit doesn't lock a visitor out of the booking form.
//
// Required env vars (set in Vercel + .env.local):
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
//
// If either is missing the limiter fails open — the request is allowed and
// a warning is logged. This keeps local dev frictionless before Upstash is
// provisioned; production logs surface the misconfiguration loudly.

const WINDOW = "1 h" as const;
const MAX_REQUESTS = 5;

// One Ratelimit instance per prefix, memoized. `undefined` = not yet
// resolved for this prefix; `null` = resolved-but-disabled (env missing).
const limiterCache = new Map<string, Ratelimit | null>();

function getLimiter(prefix: string): Ratelimit | null {
  const existing = limiterCache.get(prefix);
  if (existing !== undefined) return existing;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn(
      "[rate-limit] Upstash env vars missing — limiter disabled (fail-open). " +
        "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
    );
    limiterCache.set(prefix, null);
    return null;
  }

  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, WINDOW),
    analytics: false,
    prefix,
  });
  limiterCache.set(prefix, limiter);
  return limiter;
}

// Extracts the client IP from request headers. Vercel sets x-forwarded-for
// as a comma-separated chain; the first entry is the original client.
// Falls back to a placeholder so the limiter still groups unknown clients
// together rather than silently bypassing them.
async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}

export type RateLimitOutcome = {
  allowed: boolean;
  remaining: number;
};

async function checkRateLimit(prefix: string): Promise<RateLimitOutcome> {
  const limiter = getLimiter(prefix);
  if (!limiter) return { allowed: true, remaining: MAX_REQUESTS };

  const ip = await getClientIp();
  const { success, remaining } = await limiter.limit(ip);
  return { allowed: success, remaining };
}

export function checkContactRateLimit(): Promise<RateLimitOutcome> {
  return checkRateLimit("h2h:contact");
}

export function checkBookingRateLimit(): Promise<RateLimitOutcome> {
  return checkRateLimit("h2h:booking");
}
