import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { Loop, LoopStatus } from '../lib/api'

export function useLoops(params?: { status?: LoopStatus; scope?: 'mine' | 'team' }) {
  const [loops, setLoops] = useState<Loop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.loops.list(params)
      setLoops(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loops')
    } finally {
      setLoading(false)
    }
  }, [params?.status, params?.scope]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load() }, [load])

  return { loops, loading, error, refetch: load }
}
