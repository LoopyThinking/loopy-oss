import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { SignalTimeline } from '../components/SignalTimeline'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import { IPLBadge } from '../components/IPLBadge'
import type { LoopWithSignals } from '../lib/api'

export function LoopDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loop, setLoop] = useState<LoopWithSignals | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)
  const [resolution, setResolution] = useState('')
  const [showCloseForm, setShowCloseForm] = useState(false)

  useEffect(() => {
    if (!id) return
    void api.loops.get(id).then(setLoop).catch((e: Error) => setError(e.message)).finally(() => setLoading(false))
  }, [id])

  async function handleClose(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    setClosing(true)
    try {
      const closed = await api.loops.close(id, resolution || undefined)
      setLoop((prev) => prev ? { ...prev, ...closed } : null)
      setShowCloseForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close loop')
    } finally {
      setClosing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-loopy-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error || !loop) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-500 text-sm">{error ?? 'Loop not found'}</p>
          <Link to="/dashboard" className="mt-3 inline-block text-sm text-loopy-600 hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-slate-700 transition text-lg leading-none"
            aria-label="Back"
          >
            ←
          </button>
          <span className="font-semibold text-slate-900 truncate">{loop.title}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Meta card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">{loop.title}</h1>
              {loop.hypothesis && (
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{loop.hypothesis}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <IPLBadge minutes={loop.ipl_minutes} size="lg" />
              <ConfidenceBadge value={loop.confidence_index} size="lg" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
            <span className={`rounded-full border px-2.5 py-1 font-medium capitalize
              ${loop.status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                loop.status === 'closed' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                'bg-red-50 text-red-700 border-red-100'}`}>
              {loop.status}
            </span>
            <span className="capitalize">{loop.scope}</span>
            <span className="ml-auto">{loop.signals.length} signal{loop.signals.length !== 1 ? 's' : ''}</span>
          </div>

          {loop.resolution && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
              <p className="text-xs font-semibold text-emerald-700 mb-1 uppercase tracking-wide">Resolution</p>
              <p className="text-sm text-emerald-900">{loop.resolution}</p>
            </div>
          )}

          {/* Close button */}
          {loop.status === 'open' && !showCloseForm && (
            <button
              onClick={() => setShowCloseForm(true)}
              className="w-full rounded-lg border border-slate-200 py-2 text-sm font-medium
                         text-slate-600 hover:bg-slate-50 transition"
            >
              Close loop
            </button>
          )}

          {/* Close form */}
          {showCloseForm && (
            <form onSubmit={(e) => void handleClose(e)} className="space-y-3 pt-1">
              <div>
                <label htmlFor="resolution" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Resolution
                  <span className="ml-1.5 text-xs text-slate-400 font-normal">optional</span>
                </label>
                <textarea
                  id="resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="What was the outcome or decision?"
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm
                             placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-loopy-400
                             focus:border-loopy-400 transition resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCloseForm(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium
                             text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={closing}
                  className="flex-1 rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white
                             hover:bg-slate-900 disabled:opacity-50 transition"
                >
                  {closing ? 'Closing…' : 'Confirm close'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Signal timeline */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Signal Timeline
          </h2>
          <SignalTimeline signals={loop.signals} />
        </section>
      </main>
    </div>
  )
}
