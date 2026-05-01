import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Copy, Check, Trash2, Loader2, Plus, X, ChevronRight } from 'lucide-react'
import { Layout } from '../components/Layout'
import { RegistrySummary, type RegistrySummaryProps } from '../components/RegistrySummary'
import { AgentCard, type AgentCardEntry } from '../components/AgentCard'
import { api } from '../lib/api'

type TabFilter = 'all' | 'agent' | 'skill' | 'tool' | 'workflow'

const TABS: Array<{ key: TabFilter; label: string }> = [
  { key: 'all',     label: 'All' },
  { key: 'agent',   label: 'Agents' },
  { key: 'skill',   label: 'Skills' },
  { key: 'tool',    label: 'Tools' },
  { key: 'workflow', label: 'Workflows' },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <button onClick={copy} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 rounded transition-colors" title="Copy ID">
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  )
}

export function Agents() {
  // ── Registry state (org-wide catalog) ─────────────────────────────────────
  const [catalog, setCatalog] = useState<AgentCardEntry[]>([])
  const [summary, setSummary] = useState<RegistrySummaryProps['data']>(null)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabFilter>('all')
  // (tree expand state removed — listing is now flat)

  // ── Token registration state ──────────────────────────────────────────────
  const [registering, setRegistering] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newToken, setNewToken] = useState<string | null>(null)
  const [myAgents, setMyAgents] = useState<Array<{
    id: string; agent_name: string; description: string | null
    is_active: boolean; created_at: string; last_seen_at: string | null
  }>>([])

  // ── Fetch registry data ──────────────────────────────────────────────────

  const fetchRegistry = useCallback(async () => {
    try {
      setCatalogLoading(true)
      const params = tab === 'all' ? undefined : { type: tab }
      const data = await api.registry.list(params)
      setCatalog(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading registry')
    } finally {
      setCatalogLoading(false)
    }
  }, [tab])

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true)
      const data = await api.registry.summary()
      setSummary(data)
    } catch {
      // Summary is non-critical
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  const fetchMyAgents = useCallback(async () => {
    try {
      const data = await api.me.agents()
      setMyAgents(data)
    } catch {
      // non-critical
    }
  }, [])

  useEffect(() => { fetchRegistry() }, [fetchRegistry])
  useEffect(() => { fetchSummary() }, [fetchSummary])
  useEffect(() => { fetchMyAgents() }, [fetchMyAgents])

  // ── Agent token registration ─────────────────────────────────────────────

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setRegistering(true)
    try {
      const res = await fetch(`${(import.meta.env.VITE_API_URL as string) ?? ''}/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('loopy_token') ?? ''}`,
          ...(sessionStorage.getItem('loopy_org_id') ? { 'X-Org-Id': sessionStorage.getItem('loopy_org_id')! } : {}),
        },
        body: JSON.stringify({ agent_name: newName.trim(), description: newDesc.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Error registering agent')
      setNewToken(data.token)
      setNewName('')
      setNewDesc('')
      setShowForm(false)
      fetchMyAgents()
      fetchRegistry()
      fetchSummary()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setRegistering(false)
    }
  }

  async function handleRevoke(agentId: string, agentName: string) {
    if (!confirm(`Revoke token for "${agentName}"? This cannot be undone.`)) return
    await api.me.revokeAgent(agentId)
    setMyAgents(prev => prev.map(a => a.id === agentId ? { ...a, is_active: false } : a))
  }

  // (tree logic removed — all entries are rendered as a flat list)

  return (
    <Layout title="Agents" breadcrumbs={[{ label: 'Agents' }]}>
      <div className="max-w-3xl">

        {/* Token shown once after registration */}
        {newToken && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-medium text-green-800 mb-1">Agent registered — save this token now, it won't be shown again:</p>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 text-xs bg-white dark:bg-gray-800 border border-green-200 rounded px-3 py-2 font-mono break-all">{newToken}</code>
              <CopyButton text={newToken} />
            </div>
            <button onClick={() => setNewToken(null)} className="mt-3 text-xs text-green-700 underline">Got it, close</button>
          </div>
        )}

        {/* ── Registry summary ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            AI Registry
            {summary && <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-2">— {summary.org_name}</span>}
          </h1>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> Register agent
          </button>
        </div>

        <RegistrySummary data={summary} loading={summaryLoading} />

        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={14} /></button>
          </div>
        )}

        {/* Registration form (collapsible) */}
        {showForm && (
          <form onSubmit={handleRegister} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 mb-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">Register new agent with token</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Create an access token so external scripts and skills can authenticate against the API.</p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Agent name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="claude-cowork-agent"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
              <input
                type="text"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Cowork agent for project X"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={registering || !newName.trim()}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors">
                {registering ? 'Registering…' : 'Register'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* ── Type filter tabs ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                tab === t.key
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Registry listing (flat) ──────────────────────────────────────── */}
        {catalogLoading ? (
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm py-8">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : catalog.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            <Bot size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">No entries in the registry.</p>
            <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Use Claude Cowork to register agents, skills and tools automatically.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {catalog.map(entry => (
              <AgentCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {/* ── My tokens section (collapsed) ────────────────────────────────── */}
        <details className="mt-8 group">
          <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 list-none flex items-center gap-2">
            <span className="border border-gray-200 dark:border-gray-700 rounded px-2 py-0.5 text-xs group-open:bg-gray-50 dark:group-open:bg-gray-900">
              {myAgents.length}
            </span>
            My registered agents (tokens)
          </summary>
          <div className="mt-3 space-y-2">
            {myAgents.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 py-2 text-center">You have no registered agents.</p>
            ) : (
              myAgents.map(agent => (
                <div key={agent.id} className={`flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border transition-colors ${agent.is_active ? 'border-gray-100 dark:border-gray-700 hover:border-indigo-100' : 'border-gray-50 opacity-50'}`}>
                  <Link to={`/agents/${agent.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{agent.agent_name}</span>
                      {!agent.is_active && <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">revoked</span>}
                    </div>
                    {agent.description && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{agent.description}</p>}
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                      {agent.id.slice(0, 8)}…
                      {agent.last_seen_at ? ` · last used ${new Date(agent.last_seen_at).toLocaleDateString('en')}` : ' · no activity'}
                    </p>
                  </Link>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <CopyButton text={agent.id} />
                    {agent.is_active && (
                      <button onClick={() => handleRevoke(agent.id, agent.agent_name)}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Revoke">
                        <Trash2 size={14} />
                      </button>
                    )}
                    <Link to={`/agents/${agent.id}`} className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-indigo-500 rounded transition-colors">
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </details>

        {/* Hint */}
        <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <p className="text-xs font-medium text-indigo-800 mb-1">Auto-registration from Claude Cowork</p>
          <p className="text-xs text-indigo-700">
            Use the <code className="bg-white dark:bg-gray-800 px-1 rounded">loopy-oss-bridge</code> skill in Claude Code to register
            agents, skills and tools automatically. The payload is compatible with the loopythinking.ai cloud format.
          </p>
        </div>
      </div>
    </Layout>
  )
}
