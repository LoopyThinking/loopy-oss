import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { Loop, LoopStatus } from '../lib/api'

export function useLoops(status?: LoopStatus) {
  const [loops, setLoops] = useState<Loop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.loops.list(status)
      setLoops(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loops')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { void load() }, [load])

  return { loops, loading, error, refetch: load }
}
