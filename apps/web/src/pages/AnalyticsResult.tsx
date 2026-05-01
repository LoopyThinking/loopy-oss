import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Loader2, Check, X, AlertTriangle, ArrowLeft, FileDown,
  Clock, Cpu,
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { api } from '../lib/api'

interface AnalysisDetail {
  id: string; template_key: string; period_label: string; prompt_used: string
  data_inputs: Record<string, unknown>; result: Record<string, unknown> | null
  llm_provider: string | null; llm_model: string | null
  status: string; error: string | null; created_at: string; completed_at: string | null
}

export function AnalyticsResult() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.analytics.getAnalysis(id)
      .then(data => {
        setAnalysis(data)
        setLoading(false)
        // Poll if not in a terminal state
        if (data.status === 'pending' || data.status === 'running') {
          pollRef.current = setInterval(() => {
            api.analytics.getAnalysis(id).then(updated => {
              setAnalysis(updated)
              if (updated.status === 'succeeded' || updated.status === 'failed') {
                if (pollRef.current) clearInterval(pollRef.current)
              }
            }).catch(() => {})
          }, 3000)
        }
      })
      .catch(e => {
        setError(e instanceof Error ? e.message : 'Error loading analysis')
        setLoading(false)
      })

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [id])

  function fmtDate(iso: string | null): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const mdUrl = id ? api.analytics.markdownUrl(id) : null

  if (loading) {
    return (
      <Layout title="Loading…" breadcrumbs={[{ label: 'Analytics', href: '/analytics' }, { label: 'Loading…' }]}>
        <div className="flex items-center justify-center h-64 text-subtle text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      </Layout>
    )
  }

  if (error || !analysis) {
    return (
      <Layout title="Error" breadcrumbs={[{ label: 'Analytics', href: '/analytics' }, { label: 'Error' }]}>
        <div className="bg-red-50 border border-red-100 rounded-xl p-6">
          <div className="flex items-center gap-2 text-red-600 font-medium mb-1">
            <AlertTriangle size={16} /> Error
          </div>
          <p className="text-sm text-red-600">{error ?? 'Analysis not found'}</p>
          <button onClick={() => navigate('/analytics')} className="mt-4 text-sm text-accent hover:underline">
            Back to Analytics
          </button>
        </div>
      </Layout>
    )
  }

  const isRunning = analysis.status === 'pending' || analysis.status === 'running'

  return (
    <Layout
      title="Result"
      breadcrumbs={[
        { label: 'Analytics', href: '/analytics' },
        { label: analysis.template_key.replace(/_/g, ' ') },
      ]}
    >
      <div className="max-w-4xl">
        {/* Back button */}
        <button
          onClick={() => navigate('/analytics')}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-secondary mb-4"
        >
          <ArrowLeft size={14} /> Back to Analytics
        </button>

        {/* Header card */}
        <div className="bg-card border border-edge rounded-xl p-5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold text-primary capitalize">
                {analysis.template_key.replace(/_/g, ' ')}
              </h1>
              <p className="text-sm text-muted mt-1">
                Period: <span className="font-medium text-secondary">{analysis.period_label}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Status badge */}
              {analysis.status === 'succeeded' && (
                <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-full font-medium">
                  <Check size={13} /> Completed
                </span>
              )}
              {analysis.status === 'failed' && (
                <span className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-3 py-1.5 rounded-full font-medium">
                  <X size={13} /> Error
                </span>
              )}
              {isRunning && (
                <span className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full font-medium">
                  <Loader2 size={13} className="animate-spin" />{' '}
                  {analysis.status === 'pending' ? 'Pending' : 'Running'}
                </span>
              )}

              {/* Download markdown */}
              {analysis.status === 'succeeded' && mdUrl && (
                <a
                  href={mdUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-accent bg-accent-light hover:bg-accent-light px-3 py-1.5 rounded-full font-medium transition-colors"
                >
                  <FileDown size={13} /> Markdown
                </a>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-subtle">
            <span className="flex items-center gap-1">
              <Cpu size={12} /> {analysis.llm_provider ?? '—'} / {analysis.llm_model ?? '—'}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> Created: {fmtDate(analysis.created_at)}
            </span>
            {analysis.completed_at && (
              <span className="flex items-center gap-1">
                <Check size={12} /> Completed: {fmtDate(analysis.completed_at)}
              </span>
            )}
          </div>
        </div>

        {/* Running state — spinner */}
        {isRunning && (
          <div className="bg-card border border-edge rounded-xl p-8 text-center">
            <Loader2 size={32} className="animate-spin text-indigo-400 mx-auto mb-3" />
            <p className="text-sm text-secondary">
              Analysis is running…
            </p>
            <p className="text-xs text-subtle mt-1">
              This may take a few seconds. The page updates automatically.
            </p>
          </div>
        )}

        {/* Error state */}
        {analysis.status === 'failed' && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-5">
            <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-2">
              <AlertTriangle size={15} /> Analysis error
            </div>
            <p className="text-xs text-red-600 font-mono whitespace-pre-wrap">
              {analysis.error ?? 'Unknown error'}
            </p>
          </div>
        )}

        {/* Result */}
        {analysis.status === 'succeeded' && analysis.result && (
          <div className="bg-card border border-edge rounded-xl p-5">
            <h2 className="text-sm font-semibold text-primary mb-4">Result</h2>

            {(() => {
              const rawResult = typeof analysis.result === 'string' ? JSON.parse(analysis.result) : analysis.result
              const r = (rawResult ?? {}) as Record<string, unknown>
              return (<>
            {/* Narrative markdown */}
            {r.narrative_md && (
              <div className="mb-6">
                <div className="prose prose-sm max-w-none text-secondary">
                  <RenderMarkdown text={String(r.narrative_md)} />
                </div>
              </div>
            )}

            {/* Table rendering for specific templates */}
            {analysis.template_key === 'roi_snapshot' && (
              <div>
                {(!!r.analisis || !!r.headline_summary || !!r.narrative_md) && (
                  <div className="mb-4 text-sm text-secondary leading-relaxed">
                    {String(r.analisis ?? r.headline_summary ?? r.narrative_md ?? '')}
                  </div>
                )}
                <ResultTable
                  rows={[
                    ...(r.ahorro_usd || r.savings_estimate_usd
                      ? [{ label: 'Estimated savings', value: `$${String(r.ahorro_usd ?? r.savings_estimate_usd ?? '0')} USD` }]
                      : []),
                    ...(r.key_drivers
                      ? [{ label: 'Key drivers', value: formatList(r.key_drivers) }]
                      : []),
                    ...(r.recomendaciones || r.recommendations
                      ? [{ label: 'Recommendations', value: formatList(r.recomendaciones ?? r.recommendations) }]
                      : []),
                  ]}
                />
              </div>
            )}

            {analysis.template_key === 'stuck_loops' && (
              <div>
                <p className="text-xs text-muted mb-2">
                  {Array.isArray(r.stuck_loops)
                    ? `${r.stuck_loops.length} loop(s) identified`
                    : ''}
                </p>
                {!!r.common_pattern && (
                  <p className="text-sm text-secondary mb-3">
                    <span className="font-medium">Common pattern:</span> {String(r.common_pattern)}
                  </p>
                )}
                {!!r.suggested_intervention && (
                  <p className="text-sm text-secondary mb-3">
                    <span className="font-medium">Suggested intervention:</span>{' '}
                    {String(r.suggested_intervention)}
                  </p>
                )}
                <ResultTable
                  rows={[
                    ...(r.stuck_loops && Array.isArray(r.stuck_loops)
                      ? [{ label: 'Stuck loops', value: JSON.stringify(r.stuck_loops, null, 2) }]
                      : []),
                  ]}
                />
              </div>
            )}

            {analysis.template_key === 'adoption_curve' && (
              <ResultTable
                rows={[
                  { label: 'Trend', value: String(r.adoption_trend ?? '') },
                  { label: 'Risks', value: formatList(r.risks) },
                  { label: 'Next action', value: String(r.next_action ?? '') },
                ]}
              />
            )}

            {analysis.template_key === 'agent_tool_optimization' && (
              <div>
                {!!r.champion_agent_per_skill && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
                      Champion per skill
                    </h3>
                    <ResultTable
                      rows={Object.entries(
                        r.champion_agent_per_skill as Record<string, string>
                      ).map(([skill, agent]) => ({ label: skill, value: String(agent) }))}
                    />
                  </div>
                )}
                {!!r.consolidation_opportunities && (
                  <ResultTable
                    rows={[
                      {
                        label: 'Consolidation opportunities',
                        value: formatList(r.consolidation_opportunities),
                      },
                    ]}
                  />
                )}
              </div>
            )}

            {analysis.template_key === 'team_ipl_segmentation' && (
              <div className="space-y-4">
                {!!r.champions && Array.isArray(r.champions) && (
                  <ResultTable
                    title="Champions"
                    rows={(r.champions as Array<Record<string, unknown>>).map((c, i) => ({
                      label: `#${i + 1}`,
                      value: `${String(c.name ?? '')} — ${String(c.ipl_hours ?? '0')}h`,
                    }))}
                  />
                )}
                {!!r.at_risk && Array.isArray(r.at_risk) && (
                  <ResultTable
                    title="At risk"
                    rows={(r.at_risk as Array<Record<string, unknown>>).map((r2, i) => ({
                      label: `#${i + 1}`,
                      value: `${String(r2.name ?? '')} — ${r2.reason ? String(r2.reason) : ''}`,
                    }))}
                  />
                )}
                {!!r.opportunities && (
                  <ResultTable
                    rows={[{ label: 'Opportunities', value: formatList(r.opportunities) }]}
                  />
                )}
              </div>
            )}

            {/* Improved fallback for unknown templates */}
            {!['roi_snapshot', 'adoption_curve', 'agent_tool_optimization', 'stuck_loops', 'team_ipl_segmentation'].includes(analysis.template_key) && (
              <div className="space-y-3">
                {Object.entries(r).map(([key, val]) => (
                  <div key={key} className="border-b border-edge pb-2 last:border-0">
                    <span className="text-xs font-medium text-muted capitalize block mb-0.5">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-primary">
                      {renderValue(val)}
                    </span>
                  </div>
                ))}
              </div>
            )}
              </>)
            })()}
          </div>
        )}
      </div>
    </Layout>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function RenderMarkdown({ text }: { text: string }) {
  // Simple markdown-like rendering — splits on double newlines, detects headers and lists
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold text-primary mt-4 mb-2">{line.slice(4)}</h3>
        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold text-primary mt-5 mb-2">{line.slice(3)}</h2>
        if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-semibold text-primary mt-5 mb-3">{line.slice(2)}</h1>
        if (line.startsWith('- ')) return <li key={i} className="text-sm text-secondary ml-4 list-disc">{line.slice(2)}</li>
        if (line.trim() === '') return <br key={i} />
        return <p key={i} className="text-sm text-secondary mb-1">{line}</p>
      })}
    </>
  )
}

function ResultTable({ rows, title }: { rows: Array<{ label: string; value: string }>; title?: string }) {
  return (
    <div className="mb-4">
      {title && <h3 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">{title}</h3>}
      <table className="w-full text-sm border border-edge rounded-lg overflow-hidden">
        <tbody className="divide-y divide-edge-subtle">
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-card' : 'bg-surface'}>
              <td className="px-4 py-2.5 text-xs font-medium text-muted w-1/3 align-top">{r.label}</td>
              <td className="px-4 py-2.5 text-xs text-secondary whitespace-pre-wrap font-mono">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatList(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(v => typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)).join('\n')
  }
  return String(value ?? '')
}

function renderValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(item => typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)).join('\n')
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2)
  }
  return String(value ?? '')
}
