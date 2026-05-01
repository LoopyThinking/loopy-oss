import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Loader2, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { Layout } from '../components/Layout'
import { api } from '../lib/api'

// ── Types ──────────────────────────────────────────────────────────────────────

type RegistryEntry = Awaited<ReturnType<typeof api.registry.get>>

// ── Badges ─────────────────────────────────────────────────────────────────────

const TYPE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  agent:    { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'agent' },
  skill:    { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'skill' },
  tool:     { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'tool' },
  workflow: { bg: 'bg-purple-50',  text: 'text-purple-700',  label: 'workflow' },
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-edge rounded-xl p-5">
      <h2 className="text-xs font-semibold text-subtle uppercase tracking-wide mb-3">{title}</h2>
      {children}
    </div>
  )
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <span key={item} className="text-xs bg-surface border border-edge text-secondary px-2 py-1 rounded-lg">
          {item}
        </span>
      ))}
    </div>
  )
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function RegistryDetail() {
  const { agentKey } = useParams<{ agentKey: string }>()
  const navigate = useNavigate()

  const [entry, setEntry] = useState<RegistryEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!agentKey) return
    setLoading(true)
    try {
      const data = await api.registry.get(decodeURIComponent(agentKey))
      setEntry(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading registry entry')
    } finally {
      setLoading(false)
    }
  }, [agentKey])

  useEffect(() => { load() }, [load])

  const badge = entry ? (TYPE_BADGES[entry.type] ?? TYPE_BADGES.agent) : null

  return (
    <Layout
      title={entry?.name ?? 'Detail'}
      breadcrumbs={[
        { label: 'Agents', href: '/agents' },
        { label: entry?.name ?? agentKey ?? '…' },
      ]}
    >
      <div className="max-w-3xl">

        <button
          onClick={() => navigate('/agents')}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-5 transition-colors"
        >
          <ChevronLeft size={15} /> AI Registry
        </button>

        {loading && (
          <div className="flex items-center gap-2 text-subtle text-sm py-12">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        {!loading && entry && badge && (
          <div className="space-y-4">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-4 pb-2">
              <span className="text-4xl leading-none">{entry.emoji ?? '⚙️'}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-xl font-bold text-primary">{entry.name}</h1>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                  {entry.status !== 'active' && (
                    <span className="text-xs bg-elevated text-muted px-2 py-0.5 rounded-full">
                      {entry.status}
                    </span>
                  )}
                </div>
                {entry.role && (
                  <p className="text-sm text-muted">{entry.role}</p>
                )}
                {entry.vibe && (
                  <p className="text-xs text-subtle mt-0.5 italic">"{entry.vibe}"</p>
                )}
              </div>
            </div>

            {/* ── Reporta a (parent link) ─────────────────────────────────────── */}
            {entry.parent_key && (
              <Section title="Reports to">
                <Link
                  to={`/registry/${encodeURIComponent(entry.parent_key)}`}
                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent font-medium"
                >
                  {entry.parent_key}
                  <ArrowUpRight size={13} />
                </Link>
              </Section>
            )}

            {/* ── Responsabilidades ──────────────────────────────────────────── */}
            {entry.responsibilities && entry.responsibilities.length > 0 && (
              <Section title="Responsibilities">
                <ul className="space-y-1.5">
                  {entry.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-secondary">
                      <span className="text-subtle mt-0.5 shrink-0">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* ── Especialización técnica ────────────────────────────────────── */}
            {entry.technical_specialization && entry.technical_specialization.length > 0 && (
              <Section title="Technical specialization">
                <TagList items={entry.technical_specialization} />
              </Section>
            )}

            {/* ── Prioridades estratégicas ──────────────────────────────────── */}
            {entry.strategic_priorities && entry.strategic_priorities.length > 0 && (
              <Section title="Strategic priorities">
                <TagList items={entry.strategic_priorities} />
              </Section>
            )}

            {/* ── Subordinados (children) ────────────────────────────────────── */}
            {entry.children && entry.children.length > 0 && (
              <Section title={`Subordinates · ${entry.children.length}`}>
                <div className="space-y-1">
                  {entry.children.map(child => {
                    const childBadge = TYPE_BADGES[child.type] ?? TYPE_BADGES.agent
                    return (
                      <Link
                        key={child.id}
                        to={`/registry/${encodeURIComponent(child.agent_key)}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-hover transition-colors group"
                      >
                        <span className="text-base w-6 text-center shrink-0">{child.emoji ?? '⚙️'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-primary truncate">{child.name}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${childBadge.bg} ${childBadge.text}`}>
                              {childBadge.label}
                            </span>
                          </div>
                          {child.role && (
                            <p className="text-xs text-muted truncate mt-0.5">{child.role}</p>
                          )}
                        </div>
                        <ArrowUpRight size={12} className="text-subtle group-hover:text-accent shrink-0 transition-colors" />
                      </Link>
                    )
                  })}
                </div>
              </Section>
            )}

            {/* ── Meta ──────────────────────────────────────────────────────── */}
            <Section title="Registry info">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-xs text-subtle mb-0.5">Agent Key</p>
                  <code className="text-xs font-mono text-secondary break-all">{entry.agent_key}</code>
                </div>
                <div>
                  <p className="text-xs text-subtle mb-0.5">Registered by</p>
                  <p className="text-secondary">{entry.registered_by_name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-subtle mb-0.5">Created</p>
                  <p className="text-secondary">{fmtDate(entry.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-subtle mb-0.5">Last seen</p>
                  <p className="text-secondary">{fmtDate(entry.last_seen_at)}</p>
                </div>
              </div>
            </Section>

          </div>
        )}
      </div>
    </Layout>
  )
}
