const cache = new Map()
const CACHE_TTL = 30_000

export async function cachedQuery(key, query) {
  const entry = cache.get(key)
  if (entry?.data !== undefined && Date.now() - entry.time < CACHE_TTL) return entry.data
  if (entry?.pending) return entry.pending
  const pending = query().then((data) => {
    cache.set(key, { data, time: Date.now() })
    return data
  }).catch((error) => {
    cache.delete(key)
    throw error
  })
  cache.set(key, { pending })
  return pending
}

export function invalidateQueries(prefix) {
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key)
}
