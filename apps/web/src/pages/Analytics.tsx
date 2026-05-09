import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3, Loader2, Play, Clock, History, Settings,
  Check, X, AlertTriangle, FileDown, RefreshCw, Plus, Trash2,
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { api, getCurrentOrgId, type LlmConfigPublic } from '../lib/api'

// ── Types ──────────────────────────────────────────────────────────────────────

interface TemplateInfo {
  key: string; name: string; description: string; category: string
  default_period: string; has_custom_prompt: boolean
}

interface AnalysisRun {
  id: string; template_key: string; period_label: string; status: string
  llm_provider: string | null; llm_model: string | null; error: string | null
  scheduled: boolean; created_at: string; completed_at: string | null
}

interface ScheduleInfo {
  id: string; template_key: string; period: string; cadence: string
  hour: number; timezone: string; is_active: boolean
  last_run_at: string | null; next_run_at: string
}

interface KpiData {
  monthlyIpl: { value: number | null; unit: string; trend: number | null }
  closedLoops: { value: number; period: string }
  activeUsers: { value: number; period: string }
  topAgent: { name: string | null; signalCount: number | null; period: string }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  roi: 'bg-green-50 text-green-700',
  adoption: 'bg-blue-50 text-blue-700',
  optimization: 'bg-purple-50 text-purple-700',
  people: 'bg-amber-50 text-amber-700',
  risk: 'bg-red-50 text-red-700',
}

const PERIOD_OPTIONS = [
  { value: 'last_7d', label: 'Last 7 days' },
  { value: 'last_30d', label: 'Last 30 days' },
  { value: 'last_90d', label: 'Last 90 days' },
  { value: 'mtd', label: 'Current month' },
  { value: 'qtd', label: 'Current quarter' },
]

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', { day: '2-digit', month: 'short' })
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function Analytics() {
  const orgId = getCurrentOrgId()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'overview' | 'analysis' | 'history' | 'config'>('overview')
  const [role, setRole] = useState<string | null>(null)

  // Loading states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data
  const [templates, setTemplates] = useState<TemplateInfo[]>([])
  const [analyses, setAnalyses] = useState<AnalysisRun[]>([])
  const [schedules, setSchedules] = useState<ScheduleInfo[]>([])
  const [llmConfigs, setLlmConfigs] = useState<LlmConfigPublic[]>([])
  const [hourlyRate, setHourlyRate] = useState(50)
  const [updatingRate, setUpdatingRate] = useState(false)

  // Run analysis modal
  const [runTemplate, setRunTemplate] = useState<TemplateInfo | null>(null)
  const [runPeriod, setRunPeriod] = useState('last_30d')
  const [runConfigId, setRunConfigId] = useState<string | null>(null)
  const [runPromptOverride, setRunPromptOverride] = useState('')
  const [runShowPrompt, setRunShowPrompt] = useState(false)
  const [runLoading, setRunLoading] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)

  // KPI overview data
  const [kpiData, setKpiData] = useState<KpiData | null>(null)
  const [kpiLoading, setKpiLoading] = useState(false)
  const [kpiError, setKpiError] = useState(false)

  // Check user role
  useEffect(() => {
    api.me.get().then(prof => {
      const currentOrg = prof.orgs.find(o => o.id === orgId)
      setRole(currentOrg?.role ?? null)
      if (!currentOrg || (currentOrg.role !== 'admin' && currentOrg.role !== 'owner')) {
        navigate('/dashboard', { replace: true })
        return
      }
    }).catch(() => {
      navigate('/dashboard', { replace: true })
    })
  }, [orgId, navigate])

  const loadAll = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const [tmpl, anls, sch, llm] = await Promise.all([
        api.analytics.templates.list().catch(() => []),
        api.analytics.listAnalyses({ limit: 20 }).catch(() => []),
        api.analytics.schedules.list().catch(() => []),
        api.llm.list(orgId).catch(() => []),
      ])
      setTemplates(tmpl)
      setAnalyses(anls)
      setSchedules(sch)
      setLlmConfigs(llm)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading analytics')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { if (role) loadAll() }, [role, loadAll])

  // Fetch KPI data for the Overview tab
  useEffect(() => {
    if (!role) return
    setKpiLoading(true)
    setKpiError(false)
    api.analytics.kpi()
      .then(data => setKpiData(data))
      .catch(() => { setKpiError(true); setKpiData(null) })
      .finally(() => setKpiLoading(false))
  }, [role])

  async function handleRunAnalysis() {
    if (!runTemplate || !orgId) return
    setRunLoading(true)
    setRunError(null)
    try {
      const result = await api.analytics.run({
        template_key: runTemplate.key,
        period: runPeriod,
        llm_config_id: runConfigId,
        prompt_override: runShowPrompt ? runPromptOverride.trim() || undefined : undefined,
      })
      setRunTemplate(null)
      navigate(`/analytics/runs/${result.analysis_id}`)
    } catch (e: unknown) {
      setRunError(e instanceof Error ? e.message : 'Error running analysis')
    } finally {
      setRunLoading(false)
    }
  }

  async function handleUpdateRate() {
    if (!orgId) return
    setUpdatingRate(true)
    try {
      await api.orgs.updateSettings(orgId, { hourly_rate_usd: hourlyRate })
    } catch { /* ignore */ }
    finally { setUpdatingRate(false) }
  }

  if (!role) return null

  const defaultConfig = llmConfigs.find(c => c.is_default && c.is_active)
  const hasLlm = llmConfigs.some(c => c.is_active)

  return (
    <Layout title="Analytics" breadcrumbs={[{ label: 'Executive Panel', href: '/admin' }, { label: 'Analytics' }]}>
      <div className="max-w-5xl">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center gap-2">
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-6 border-b border-edge">
          {([['overview', 'Overview'], ['analysis', 'Analysis'], ['history', 'History'], ['config', 'Configuration']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === key ? 'border-indigo-600 text-accent' : 'border-transparent text-muted hover:text-secondary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-subtle text-sm gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
          <>
            {/* ══ TAB: Resumen ════════════════════════════════════════════════ */}
            {tab === 'overview' && (
              <div className="space-y-6">
                <p className="text-sm text-muted">
                  Quick panel with the main KPIs of your organization.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard
                    label="Monthly IPL"
                    value={kpiData?.monthlyIpl.value != null ? `${kpiData.monthlyIpl.value.toFixed(1)} h` : '—'}
                    sub="vs previous month"
                    loading={kpiLoading}
                    error={kpiError}
                  />
                  <KpiCard
                    label="Closed loops"
                    value={kpiData?.closedLoops.value != null ? String(kpiData.closedLoops.value) : '—'}
                    sub="this month"
                    loading={kpiLoading}
                    error={kpiError}
                  />
                  <KpiCard
                    label="Active users"
                    value={kpiData?.activeUsers.value != null ? String(kpiData.activeUsers.value) : '—'}
                    sub="this week"
                    loading={kpiLoading}
                    error={kpiError}
                  />
                  <KpiCard
                    label="Top agent"
                    value={kpiData?.topAgent.name ?? '—'}
                    sub={kpiData?.topAgent.name ? `${kpiData.topAgent.signalCount} signals · of the month` : 'of the month'}
                    loading={kpiLoading}
                    error={kpiError}
                  />
                </div>

                {/* Próximas analíticas programadas */}
                {schedules.filter(s => s.is_active).length > 0 && (
                  <div className="bg-card border border-edge rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                      <Clock size={14} className="text-subtle" /> Scheduled analytics
                    </h3>
                    <div className="space-y-2">
                      {schedules.filter(s => s.is_active).map(s => (
                        <div key={s.id} className="flex items-center justify-between text-sm">
                          <span className="text-secondary capitalize">{s.template_key.replace(/_/g, ' ')}</span>
                          <span className="text-subtle text-xs">
                            {s.cadence === 'weekly' ? 'Weekly' : 'Monthly'} · Next: {fmtShortDate(s.next_run_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!hasLlm && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
                    No LLM provider configured. Add one in Settings → LLM Providers to enable generative analytics.
                  </div>
                )}
              </div>
            )}

            {/* ══ TAB: Análisis ═══════════════════════════════════════════════ */}
            {tab === 'analysis' && (
              <div className="space-y-6">
                <p className="text-sm text-muted">
                  Select a template to run an analysis. Results are AI-generated and saved to the history.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(t => (
                    <div key={t.key} className="bg-card border border-edge rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-semibold text-primary">{t.name}</h3>
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 font-medium ${CATEGORY_COLORS[t.category] ?? ''}`}>
                            {t.category}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setRunTemplate(t)
                            setRunPeriod(t.default_period)
                            setRunConfigId(defaultConfig?.id ?? null)
                            setRunPromptOverride('')
                            setRunShowPrompt(false)
                            setRunError(null)
                            // Load existing prompt
                            api.analytics.templates.get(t.key).then(d => {
                              setRunPromptOverride(d.org_prompt ?? d.default_prompt)
                            }).catch(() => {})
                          }}
                          className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent px-3 py-1.5 rounded-lg hover:bg-accent-light transition-colors"
                        >
                          <Play size={13} /> Run
                        </button>
                      </div>
                      <p className="text-xs text-muted">{t.description}</p>
                      {t.has_custom_prompt && (
                        <span className="text-xs text-amber-600 mt-1 inline-block">Custom prompt</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ TAB: Historial ══════════════════════════════════════════════ */}
            {tab === 'history' && (
              <div>
                {analyses.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-edge rounded-xl">
                    <History size={32} className="mx-auto text-subtle mb-2" />
                    <p className="text-sm text-subtle">No analyses run yet.</p>
                  </div>
                ) : (
                  <div className="bg-card border border-edge rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-edge text-xs font-medium text-subtle uppercase tracking-wide">
                          <th className="text-left px-4 py-3">Template</th>
                          <th className="text-left px-4 py-3">Period</th>
                          <th className="text-left px-4 py-3">Model</th>
                          <th className="text-left px-4 py-3">Status</th>
                          <th className="text-left px-4 py-3 hidden md:table-cell">Date</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-edge-subtle">
                        {analyses.map(a => (
                          <tr key={a.id} className="hover:bg-hover cursor-pointer" onClick={() => navigate(`/analytics/runs/${a.id}`)}>
                            <td className="px-4 py-3 font-medium text-primary capitalize">{a.template_key.replace(/_/g, ' ')}</td>
                            <td className="px-4 py-3 text-muted">{a.period_label}</td>
                            <td className="px-4 py-3 text-muted text-xs">{a.llm_model ?? '—'}</td>
                            <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                            <td className="px-4 py-3 text-subtle text-xs hidden md:table-cell">{fmtDate(a.created_at)}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={e => { e.stopPropagation(); navigate(`/analytics/runs/${a.id}`) }}
                                className="text-xs text-accent hover:text-accent px-2 py-1 rounded hover:bg-accent-light transition-colors"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══ TAB: Configuración ══════════════════════════════════════════ */}
            {tab === 'config' && (
              <div className="space-y-6">
                {/* Tarifa horaria */}
                <div className="bg-card border border-edge rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-primary mb-3">Hourly rate for ROI</h3>
                  <p className="text-xs text-muted mb-3">
                    Used to calculate estimated savings in ROI analyses.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-subtle">$</span>
                      <input
                        type="number"
                        min={1} max={10000}
                        value={hourlyRate}
                        onChange={e => setHourlyRate(Number(e.target.value))}
                        className="w-28 pl-7 pr-3 py-2 text-sm border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </div>
                    <span className="text-sm text-muted">USD/hora</span>
                    <button
                      onClick={handleUpdateRate}
                      disabled={updatingRate}
                      className="px-3 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
                    >
                      {updatingRate ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Proveedores LLM */}
                <div className="bg-card border border-edge rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-primary mb-3">LLM Providers</h3>
                  {llmConfigs.length === 0 ? (
                    <p className="text-sm text-subtle">No providers configured.</p>
                  ) : (
                    <div className="space-y-2">
                      {llmConfigs.map(c => (
                        <div key={c.id} className="flex items-center justify-between text-sm px-3 py-2 bg-surface rounded-lg">
                          <span className="text-secondary">{c.display_name} <span className="text-subtle">({c.provider})</span></span>
                          <span className="text-xs text-subtle">••••{c.api_key_last4}{c.is_default ? ' · default' : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <a href="/settings" className="text-xs text-accent hover:text-accent mt-2 inline-block">
                    Go to Settings →
                  </a>
                </div>

                {/* Plantillas con prompt personalizado */}
                <div className="bg-card border border-edge rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-primary mb-3">Templates with custom prompt</h3>
                  {templates.filter(t => t.has_custom_prompt).length === 0 ? (
                    <p className="text-sm text-subtle">No templates have a custom prompt.</p>
                  ) : (
                    <div className="space-y-2">
                      {templates.filter(t => t.has_custom_prompt).map(t => (
                        <div key={t.key} className="flex items-center justify-between text-sm px-3 py-2 bg-surface rounded-lg">
                          <span className="text-secondary">{t.name}</span>
                          <button
                            onClick={async () => {
                              await api.analytics.templates.resetPrompt(t.key)
                              loadAll()
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Reset to default
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Programaciones */}
                <div className="bg-card border border-edge rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-primary mb-3">Scheduled analytics</h3>
                  {schedules.length === 0 ? (
                    <p className="text-sm text-subtle">No schedules.</p>
                  ) : (
                    <div className="space-y-2">
                      {schedules.map(s => (
                        <div key={s.id} className="flex items-center justify-between text-sm px-3 py-2 bg-surface rounded-lg">
                          <div>
                            <span className="text-secondary capitalize">{s.template_key.replace(/_/g, ' ')}</span>
                            <span className="text-subtle ml-2">
                              {s.cadence === 'weekly' ? 'Weekly' : 'Monthly'} · {s.hour}:00 {s.timezone}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${s.is_active ? 'text-green-600' : 'text-subtle'}`}>
                              {s.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={async () => {
                                await api.analytics.schedules.update(s.id, { is_active: !s.is_active })
                                loadAll()
                              }}
                              className="text-xs text-accent hover:text-accent"
                            >
                              {s.is_active ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={async () => {
                                await api.analytics.schedules.remove(s.id)
                                loadAll()
                              }}
                              className="p-1 text-subtle hover:text-red-500"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══ Run Analysis Modal ════════════════════════════════════════════════ */}
      {runTemplate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setRunTemplate(null)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-primary mb-1">Run: {runTemplate.name}</h2>
            <p className="text-xs text-muted mb-4">{runTemplate.description}</p>

            {runError && (
              <div className="mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-600">{runError}</div>
            )}

            <div className="space-y-4">
              {/* Period */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Period</label>
                <select
                  value={runPeriod}
                  onChange={e => setRunPeriod(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {PERIOD_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              {/* LLM Config */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">LLM Provider</label>
                <select
                  value={runConfigId ?? ''}
                  onChange={e => setRunConfigId(e.target.value || null)}
                  className="w-full px-3 py-2 text-sm border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  <option value="">— Default —</option>
                  {llmConfigs.filter(c => c.is_active).map(c => (
                    <option key={c.id} value={c.id}>{c.display_name} ({c.provider})</option>
                  ))}
                </select>
              </div>

              {/* Prompt toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setRunShowPrompt(v => !v)}
                  className="text-xs text-accent hover:text-accent"
                >
                  {runShowPrompt ? 'Hide prompt' : 'Edit prompt'}
                </button>
                {runShowPrompt && (
                  <textarea
                    value={runPromptOverride}
                    onChange={e => setRunPromptOverride(e.target.value)}
                    rows={8}
                    className="w-full mt-1 px-3 py-2 text-xs font-mono border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleRunAnalysis}
                  disabled={runLoading}
                  className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {runLoading ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                  Run analysis
                </button>
                <button onClick={() => setRunTemplate(null)} className="text-sm text-muted hover:text-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, loading, error }: {
  label: string; value: string; sub: string; loading?: boolean; error?: boolean
}) {
  return (
    <div className="bg-card border border-edge rounded-xl p-4">
      <p className="text-xs text-muted mb-1">{label}</p>
      {loading ? (
        <div className="h-7 w-20 bg-gray-200 animate-pulse rounded" />
      ) : (
        <p className="text-xl font-semibold text-primary" title={error ? 'No data yet' : undefined}>
          {value}
        </p>
      )}
      <p className="text-xs text-subtle mt-1">{sub}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'succeeded') return <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit"><Check size={10} /> Completed</span>
  if (status === 'failed') return <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit"><X size={10} /> Error</span>
  if (status === 'running') return <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit"><Loader2 size={10} className="animate-spin" /> Running</span>
  return <span className="text-xs text-muted bg-elevated px-2 py-0.5 rounded-full font-medium">{status}</span>
}
