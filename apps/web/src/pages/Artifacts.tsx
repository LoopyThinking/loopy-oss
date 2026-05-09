import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Brain, Eye, MessageSquare, Wrench, RotateCcw,
  Loader2, AlertTriangle, ChevronRight, Signal,
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { api } from '../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

const COGNITIVE_LAYERS = ['perception', 'interpretation', 'decision', 'action', 'reflection'] as const
type CognitiveLayer = (typeof COGNITIVE_LAYERS)[number]

const LAYER_META: Record<CognitiveLayer, { icon: React.ReactNode; color: string; label: string }> = {
  perception:     { icon: <Eye size={16} />,       color: 'bg-blue-50 text-blue-700 border-blue-100',       label: 'Signals catalog (Perception)' },
  interpretation: { icon: <Brain size={16} />,    color: 'bg-purple-50 text-purple-700 border-purple-100', label: 'Hypothesis records (Interpretation)' },
  decision:       { icon: <MessageSquare size={16} />, color: 'bg-amber-50 text-amber-700 border-amber-100', label: 'Decision log (Decision)' },
  action:         { icon: <Wrench size={16} />,     color: 'bg-green-50 text-green-700 border-green-100',   label: 'Playbooks (Action)' },
  reflection:     { icon: <RotateCcw size={16} />,  color: 'bg-rose-50 text-rose-700 border-rose-100',      label: 'Learning Book (Reflection)' },
}

interface ArtifactSignal {
  id: string
  content: string
  source: string
  created_at: string
}

interface ArtifactEntry {
  loop_id: string
  title: string
  hypothesis: string | null
  status: string
  scope: string
  created_at: string
  owner_name?: string | null
  owner_email?: string
  signal_count: number
  signals: ArtifactSignal[]
}

type LayerSummary = Record<string, number>

// ── Signal bubble ─────────────────────────────────────────────────────────────

function SignalBubble({ signal }: { signal: ArtifactSignal }) {
  return (
    <div className="flex items-start gap-2 py-2.5 px-3 rounded-lg bg-surface border border-edge-subtle">
      <Signal size={13} className="text-subtle mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-primary">{signal.content}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
            signal.source === 'agent' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-600'
          }`}>
            {signal.source}
          </span>
          <span className="text-xs text-subtle">
            {new Date(signal.created_at).toLocaleDateString('en', { month: 'short', day: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Layer panel ───────────────────────────────────────────────────────────────

function LayerPanel({ layer, count, isOpen, onToggle }: {
  layer: CognitiveLayer
  count: number
  isOpen: boolean
  onToggle: () => void
}) {
  const meta = LAYER_META[layer]
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
        isOpen ? `${meta.color} shadow-sm` : 'border-edge bg-card hover:bg-hover'
      }`}
    >
      <span className={`p-1.5 rounded-lg ${isOpen ? 'bg-white/50' : 'bg-elevated'}`}>
        {meta.icon}
      </span>
      <div className="flex-1 text-left">
        <span className={`text-sm font-medium ${isOpen ? '' : 'text-primary'}`}>{meta.label}</span>
        <span className="ml-2 text-xs text-subtle">{count} artifact{count !== 1 ? 's' : ''}</span>
      </div>
      <ChevronRight size={15} className={`text-subtle transition-transform ${isOpen ? 'rotate-90' : ''}`} />
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function Artifacts() {
  const [summary, setSummary]     = useState<LayerSummary | null>(null)
  const [expanded, setExpanded]   = useState<CognitiveLayer | null>(null)
  const [entries, setEntries]     = useState<ArtifactEntry[]>([])
  const [loading, setLoading]     = useState(true)
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    api.artifacts.summary()
      .then(setSummary)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleToggle(layer: CognitiveLayer) {
    if (expanded === layer) {
      setExpanded(null)
      setEntries([])
      return
    }
    setExpanded(layer)
    setLoadingEntries(true)
    try {
      const data = await api.artifacts.list(layer)
      setEntries(data as ArtifactEntry[])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading artifacts')
    } finally {
      setLoadingEntries(false)
    }
  }

  return (
    <Layout title="Artifacts" breadcrumbs={[{ label: 'Artifacts' }]}>
      <div className="max-w-3xl">
        <p className="text-sm text-muted mb-6">
          Loops grouped by cognitive layer. Each artifact captures signals generated at that layer.
        </p>

        {loading && (
          <div className="flex items-center gap-2 text-subtle text-sm py-12">
            <Loader2 size={16} className="animate-spin" /> Loading artifacts…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-2">
            {COGNITIVE_LAYERS.map(layer => (
              <div key={layer}>
                <LayerPanel
                  layer={layer}
                  count={summary?.[layer] ?? 0}
                  isOpen={expanded === layer}
                  onToggle={() => handleToggle(layer)}
                />

                {expanded === layer && (
                  <div className="mt-2 mb-4 ml-6 pl-4 border-l-2 border-edge-subtle space-y-3">
                    {loadingEntries ? (
                      <div className="flex items-center gap-2 text-subtle text-sm py-4">
                        <Loader2 size={14} className="animate-spin" /> Loading…
                      </div>
                    ) : entries.length === 0 ? (
                      <p className="text-sm text-subtle py-4 text-center">No artifacts in this layer.</p>
                    ) : (
                      entries.map(entry => (
                        <div key={entry.loop_id} className="bg-card border border-edge rounded-xl overflow-hidden">
                          {/* Header */}
                          <div className="px-4 py-3 border-b border-edge-subtle flex items-center justify-between">
                            <Link
                              to={`/loops/${entry.loop_id}`}
                              className="text-sm font-medium text-accent hover:underline truncate"
                            >
                              {entry.title}
                            </Link>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <span className={`text-xs rounded-full border px-2 py-0.5 font-medium capitalize
                                ${entry.status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                  entry.status === 'closed' ? 'bg-elevated text-secondary border-edge' :
                                  'bg-red-50 text-red-700 border-red-100'}`}>
                                {entry.status}
                              </span>
                              <span className="text-xs text-subtle capitalize">{entry.scope}</span>
                            </div>
                          </div>

                          {/* Signals */}
                          <div className="px-4 py-3 space-y-1.5">
                            {entry.signals.map(s => (
                              <SignalBubble key={s.id} signal={s} />
                            ))}
                          </div>

                          {/* Footer */}
                          <div className="px-4 py-2 border-t border-edge-subtle bg-surface flex items-center gap-2 text-xs text-subtle">
                            {entry.owner_name && <span>{entry.owner_name}</span>}
                            <span>{entry.signal_count} signal{entry.signal_count !== 1 ? 's' : ''}</span>
                            <span className="ml-auto">{new Date(entry.created_at).toLocaleDateString('en', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
