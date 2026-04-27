import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { WorkSignal } from '../lib/api'

export function useSignals(loopId: string) {
  const [signals, setSignals] = useState<WorkSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.loops.signals(loopId)
      setSignals(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load signals')
    } finally {
      setLoading(false)
    }
  }, [loopId])

  useEffect(() => { void fetch() }, [fetch])

  return { signals, loading, error, refetch: fetch }
}
