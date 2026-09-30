import { Redis } from '@upstash/redis'

// Initialize the Redis client only if the environment variables exist
// This allows the app to fail gracefully or bypass Redis if not configured
export const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;
