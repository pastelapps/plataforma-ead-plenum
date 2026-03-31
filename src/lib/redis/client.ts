import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL ?? ''
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? ''

const isValidRedis = url.startsWith('https://')

// In-memory cache fallback for development
const memoryCache = new Map<string, { value: any; expiry: number }>()

function createMemoryCache(): Redis {
  return new Proxy({} as Redis, {
    get(_target, prop) {
      if (prop === 'get') {
        return async (key: string) => {
          const entry = memoryCache.get(key)
          if (!entry) return null
          if (Date.now() > entry.expiry) {
            memoryCache.delete(key)
            return null
          }
          return entry.value
        }
      }
      if (prop === 'set') {
        return async (key: string, value: any, opts?: { ex?: number }) => {
          const ttl = (opts?.ex ?? 3600) * 1000
          memoryCache.set(key, { value, expiry: Date.now() + ttl })
          return 'OK'
        }
      }
      if (prop === 'del') {
        return async (...keys: string[]) => {
          keys.forEach(k => memoryCache.delete(k))
          return keys.length
        }
      }
      return () => {}
    },
  })
}

function createRedisProxy(): Redis {
  if (isValidRedis) {
    return new Redis({ url, token })
  }
  // Use in-memory cache as fallback
  return createMemoryCache()
}

export const redis = createRedisProxy()
