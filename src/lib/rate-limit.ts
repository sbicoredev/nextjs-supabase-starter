import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

// General API rate limit
export const generalRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 req / minute
  analytics: true,
  prefix: "@ratelimit/general",
});

// Stricter for auth endpoints
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "5 m"), // 5 attempts / 5 min
  analytics: true,
  prefix: "@ratelimit/auth",
});

// Optional: Per-user (after auth)
export function createUserRateLimit(userId: string) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: `@ratelimit/user/${userId}`,
  });
}
