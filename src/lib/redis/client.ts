import { Redis } from '@upstash/redis'

const url = process.env.UPSTASH_REDIS_REST_URL ?? ''
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? ''

const isValidRedis = url.startsWith('https://')

// Proxy that silently no-ops when Redis is not configured
function createRedisProxy(): Redis {
  if (isValidRedis) {
    return new Redis({ url, token })
  }
  // Return a mock that returns null for get and ignores set/del
  return new Proxy({} as Redis, {
    get(_target, prop) {
      if (prop === 'get') return async () => null
      if (prop === 'set') return async () => 'OK'
      if (prop === 'del') return async () => 0
      return () => {}
    },
  })
}

export const redis = createRedisProxy()
