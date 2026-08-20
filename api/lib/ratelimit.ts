import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis client using environment variables
// Make sure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set in Vercel
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Create a new ratelimiter, that allows 15 requests per 1 minute
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, '1 m'),
  analytics: true,
});

/**
 * Validates if the user has exceeded their request quota.
 * @param userId - The unique identifier of the user (from Firebase Auth)
 * @returns boolean indicating if the request is allowed
 */
export async function checkRateLimit(userId: string): Promise<boolean> {
  // If Redis credentials are not provided (e.g. local dev without env), we bypass the rate limit
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    console.warn('Bypassing Rate Limit (Upstash credentials not found)');
    return true;
  }

  try {
    const { success } = await ratelimit.limit(`ratelimit_${userId}`);
    return success;
  } catch (error) {
    console.error('Rate limit error:', error);
    // In case of Redis failure, we fail open so we don't break the app for users
    return true;
  }
}
