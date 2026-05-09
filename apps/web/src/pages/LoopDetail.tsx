import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api, getToken } from '../lib/api'
import { SignalTimeline } from '../components/SignalTimeline'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import { IPLBadge } from '../components/IPLBadge'
import { GenerateBriefModal } from '../components/GenerateBriefModal'
import { SponsorAttestationForm } from '../components/SponsorAttestationForm'
import type { LoopWithSignals } from '../lib/api'
import { FileDown, ChevronDown, ChevronUp } from 'lucide-react'

// Decode the user ID from the JWT token (sub claim).
function getCurrentUserId(): string | null {
  try {
    const token = getToken()
    if (!token) return null
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub ?? null
  } catch {
    return null
  }
}

export function LoopDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loop, setLoop] = useState<LoopWithSignals | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)
  const [resolution, setResolution] = useState('')
  const [showCloseForm, setShowCloseForm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showBriefModal, setShowBriefModal] = useState(false)
  const [showAttestation, setShowAttestation] = useState(false)

  const currentUserId = getCurrentUserId()

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

  async function handleDelete() {
    if (!id) return
    if (!confirm('Delete this loop? This action cannot be undone.')) return
    setDeleting(true)
    try {
      await api.loops.delete(id)
      navigate('/loops')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete loop')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error || !loop) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted text-sm">{error ?? 'Loop not found'}</p>
          <Link to="/dashboard" className="mt-3 inline-block text-sm text-accent hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="bg-panel border-b border-edge sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-subtle hover:text-secondary transition text-lg leading-none"
            aria-label="Back"
          >
            ←
          </button>
          <span className="font-semibold text-primary truncate">{loop.title}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Meta card */}
        <div className="bg-card rounded-2xl border border-edge shadow-sm p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-primary leading-tight">{loop.title}</h1>
              {loop.hypothesis && (
                <p className="mt-2 text-sm text-muted leading-relaxed">{loop.hypothesis}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <IPLBadge minutes={loop.ipl_minutes} size="lg" />
              <ConfidenceBadge value={loop.confidence_index} size="lg" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted pt-1">
            <span className={`rounded-full border px-2.5 py-1 font-medium capitalize
              ${loop.status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                loop.status === 'closed' ? 'bg-elevated text-secondary border-edge' :
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

          {/* Close + Delete actions — only shown to the loop owner */}
          {loop.status === 'open' && !showCloseForm && loop.user_id === currentUserId && (
            <button
              onClick={() => setShowCloseForm(true)}
              className="w-full rounded-lg border border-edge py-2 text-sm font-medium
                         text-secondary hover:bg-hover transition"
            >
              Close loop
            </button>
          )}

          {loop.status === 'closed' && loop.user_id === currentUserId && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full rounded-lg border border-red-200 py-2 text-sm font-medium
                         text-red-600 hover:bg-red-light transition disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete loop'}
            </button>
          )}

          {/* Generate Brief button */}
          {loop.status === 'open' && loop.user_id === currentUserId && (
            <button
              onClick={() => setShowBriefModal(true)}
              className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white
                         hover:bg-accent-hover transition flex items-center justify-center gap-2"
            >
              <FileDown size={16} />
              Generar Brief
            </button>
          )}

          {/* Close form */}
          {showCloseForm && (
            <form onSubmit={(e) => void handleClose(e)} className="space-y-3 pt-1">
              <div>
                <label htmlFor="resolution" className="block text-sm font-medium text-secondary mb-1.5">
                  Resolution
                  <span className="ml-1.5 text-xs text-subtle font-normal">optional</span>
                </label>
                <textarea
                  id="resolution"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="What was the outcome or decision?"
                  rows={2}
                  className="w-full rounded-lg border border-edge px-3.5 py-2.5 text-sm
                             placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30
                             focus:border-accent transition resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCloseForm(false)}
                  className="flex-1 rounded-lg border border-edge py-2 text-sm font-medium
                             text-secondary hover:bg-hover transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={closing}
                  className="flex-1 rounded-lg bg-accent py-2 text-sm font-semibold text-white
                             hover:bg-accent-hover disabled:opacity-50 transition"
                >
                  {closing ? 'Closing…' : 'Confirm close'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sponsor attestation section */}
        {loop.status === 'open' && loop.user_id === currentUserId && (
          <section className="bg-card rounded-2xl border border-edge shadow-sm p-6">
            <button
              onClick={() => setShowAttestation(!showAttestation)}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
                  Atestación del Sponsor
                </h2>
                <p className="text-xs text-subtle mt-0.5">
                  Requerida para generar briefs en modo Hipótesis
                </p>
              </div>
              {showAttestation ? <ChevronUp size={18} className="text-subtle" /> : <ChevronDown size={18} className="text-subtle" />}
            </button>
            {showAttestation && (
              <div className="mt-4 pt-4 border-t border-edge">
                <SponsorAttestationForm
                  loopId={loop.id}
                  isOwner={loop.user_id === currentUserId}
                  currentUserId={currentUserId}
                />
              </div>
            )}
          </section>
        )}

        {/* Signal timeline */}
        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
            Signal Timeline
          </h2>
          <SignalTimeline signals={loop.signals} />
        </section>

        {/* Generate Brief Modal */}
        {showBriefModal && (
          <GenerateBriefModal
            loopId={loop.id}
            loopTitle={loop.title}
            onClose={() => setShowBriefModal(false)}
          />
        )}
      </main>
    </div>
  )
}
