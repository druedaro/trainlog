import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';


const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, '1 m'),
  analytics: true,
});


export async function checkRateLimit(userId: string): Promise<boolean> {

  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return true;
  }

  try {
    const { success } = await ratelimit.limit(`ratelimit_${userId}`);
    return success;
  } catch (error) {

    return true;
  }
}
