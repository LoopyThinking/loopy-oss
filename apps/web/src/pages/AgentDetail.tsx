import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Bot, Wrench, Loader2, AlertTriangle, ChevronLeft,
  CheckCircle2, XCircle, Calendar, Clock, Zap, Trash2,
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { api, getCurrentOrgId, type AgentSkill, type AgentTool } from '../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgentDetail {
  id: string
  agent_name: string
  description: string | null
  is_active: boolean
  created_at: string
  last_seen_at: string | null
}

type TabId = 'overview' | 'skills' | 'tools'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, string> = {
    'built-in': 'bg-blue-50 text-blue-700',
    'plugin':   'bg-purple-50 text-purple-700',
    'user':     'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${map[source] ?? 'bg-gray-100 text-gray-500'}`}>
      {source}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    'mcp':       'bg-orange-50 text-orange-700',
    'connector': 'bg-teal-50 text-teal-700',
    'function':  'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${map[type] ?? 'bg-gray-100 text-gray-500'}`}>
      {type}
    </span>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

interface TabsProps {
  active: TabId
  onChange: (t: TabId) => void
  skillCount: number
  toolCount: number
}

function Tabs({ active, onChange, skillCount, toolCount }: TabsProps) {
  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'skills',  label: 'Skills',  count: skillCount },
    { id: 'tools',   label: 'Tools',   count: toolCount  },
  ]
  return (
    <div role="tablist" className="flex gap-1 border-b border-edge mb-6">
      {tabs.map(t => (
        <button
          key={t.id}
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
            active === t.id
              ? 'border-b-2 border-indigo-600 text-accent -mb-px'
              : 'text-muted hover:text-primary'
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${active === t.id ? 'bg-indigo-100 text-accent' : 'bg-elevated text-muted'}`}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Tab: Overview ──────────────────────────────────────────────────────────────

interface OverviewTabProps {
  agent: AgentDetail
  onRevoke: () => void
}

function OverviewTab({ agent, onRevoke }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-edge rounded-xl divide-y divide-edge-subtle">
        <Row label="ID" value={<code className="text-xs font-mono text-secondary">{agent.id}</code>} />
        <Row label="Name" value={agent.agent_name} />
        <Row label="Description" value={agent.description ?? <span className="text-subtle">—</span>} />
        <Row
          label="Status"
          value={
            agent.is_active
              ? <span className="flex items-center gap-1 text-green-700 text-sm"><CheckCircle2 size={14} /> Active</span>
              : <span className="flex items-center gap-1 text-red-500 text-sm"><XCircle size={14} /> Revoked</span>
          }
        />
        <Row label="Created" value={<span className="flex items-center gap-1 text-sm text-secondary"><Calendar size={13} className="text-subtle" />{fmtDate(agent.created_at)}</span>} />
        <Row label="Last used" value={<span className="flex items-center gap-1 text-sm text-secondary"><Clock size={13} className="text-subtle" />{fmtDateTime(agent.last_seen_at)}</span>} />
      </div>

      {agent.is_active && (
        <button
          onClick={onRevoke}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-light transition-colors"
        >
          <Trash2 size={14} /> Revoke token
        </button>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 px-5 py-3.5">
      <span className="text-xs font-medium text-subtle uppercase tracking-wide w-24 shrink-0 pt-0.5">{label}</span>
      <div className="text-sm text-primary flex-1 min-w-0">{value}</div>
    </div>
  )
}

// ── Tab: Skills ───────────────────────────────────────────────────────────────

interface SkillsTabProps {
  agentId: string
  skills: AgentSkill[]
  onDeactivate: (skillId: string) => void
  isOrgAdmin?: boolean
}

function SkillsTab({ agentId, skills, onDeactivate, isOrgAdmin }: SkillsTabProps) {
  if (skills.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-edge rounded-xl">
        <Zap size={28} className="mx-auto text-subtle mb-3" />
        <p className="text-sm text-muted font-medium mb-1">This agent hasn't declared any skills yet.</p>
        <p className="text-xs text-subtle">
          Use{' '}
          <code className="bg-elevated px-1 rounded">POST /agents/{agentId}/skills</code>{' '}
          from the SDK or Cowork plugin.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-edge rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-edge-subtle text-xs font-medium text-subtle uppercase tracking-wide">
            <th className="text-left px-4 py-3">Skill</th>
            <th className="text-left px-4 py-3">Source</th>
            <th className="text-left px-4 py-3 hidden sm:table-cell">Version</th>
            <th className="text-left px-4 py-3 hidden md:table-cell">Last used</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-edge-subtle">
          {skills.map(s => (
            <tr key={s.id} className={!s.is_active && isOrgAdmin ? 'bg-surface' : s.is_active ? '' : 'opacity-40 bg-surface'}>
              <td className="px-4 py-3">
                <span className="font-medium text-primary">{s.skill_name}</span>
                {!s.is_active && isOrgAdmin ? (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                    Deactivated {s.deactivated_at ? fmtDateTime(s.deactivated_at) : ''}
                  </span>
                ) : !s.is_active ? (
                  <span className="ml-2 text-xs text-subtle">inactive</span>
                ) : null}
                {s.description && <p className="text-xs text-subtle mt-0.5 truncate max-w-xs">{s.description}</p>}
              </td>
              <td className="px-4 py-3"><SourceBadge source={s.source} /></td>
              <td className="px-4 py-3 text-muted text-xs hidden sm:table-cell">{s.version ?? '—'}</td>
              <td className="px-4 py-3 text-subtle text-xs hidden md:table-cell">{fmtDate(s.last_seen_at)}</td>
              <td className="px-4 py-3 text-right">
                {s.is_active && (
                  <button
                    onClick={() => onDeactivate(s.id)}
                    className="text-xs text-subtle hover:text-red-500 hover:bg-red-light px-2 py-1 rounded transition-colors"
                    title="Deactivate"
                  >
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Tab: Tools ────────────────────────────────────────────────────────────────

interface ToolsTabProps {
  agentId: string
  tools: AgentTool[]
  onDeactivate: (toolId: string) => void
  isOrgAdmin?: boolean
}

function ToolsTab({ agentId, tools, onDeactivate, isOrgAdmin }: ToolsTabProps) {
  if (tools.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-edge rounded-xl">
        <Wrench size={28} className="mx-auto text-subtle mb-3" />
        <p className="text-sm text-muted font-medium mb-1">This agent hasn't declared any tools yet.</p>
        <p className="text-xs text-subtle">
          Use{' '}
          <code className="bg-elevated px-1 rounded">POST /agents/{agentId}/tools</code>{' '}
          from the SDK or Cowork plugin.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-edge rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-edge-subtle text-xs font-medium text-subtle uppercase tracking-wide">
            <th className="text-left px-4 py-3">Tool</th>
            <th className="text-left px-4 py-3">Tipo</th>
            <th className="text-left px-4 py-3 hidden md:table-cell">Last used</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-edge-subtle">
          {tools.map(t => (
            <tr key={t.id} className={!t.is_active && isOrgAdmin ? 'bg-surface' : t.is_active ? '' : 'opacity-40 bg-surface'}>
              <td className="px-4 py-3">
                <span className="font-medium text-primary">{t.tool_name}</span>
                {!t.is_active && isOrgAdmin ? (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                    Deactivated {t.deactivated_at ? fmtDateTime(t.deactivated_at) : ''}
                  </span>
                ) : !t.is_active ? (
                  <span className="ml-2 text-xs text-subtle">inactive</span>
                ) : null}
                {t.description && <p className="text-xs text-subtle mt-0.5 truncate max-w-xs">{t.description}</p>}
              </td>
              <td className="px-4 py-3"><TypeBadge type={t.tool_type} /></td>
              <td className="px-4 py-3 text-subtle text-xs hidden md:table-cell">{fmtDate(t.last_seen_at)}</td>
              <td className="px-4 py-3 text-right">
                {t.is_active && (
                  <button
                    onClick={() => onDeactivate(t.id)}
                    className="text-xs text-subtle hover:text-red-500 hover:bg-red-light px-2 py-1 rounded transition-colors"
                    title="Deactivate"
                  >
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AgentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [agent, setAgent]   = useState<AgentDetail | null>(null)
  const [skills, setSkills] = useState<AgentSkill[]>([])
  const [tools, setTools]   = useState<AgentTool[]>([])
  const [tab, setTab]       = useState<TabId>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
  const [isOrgAdmin, setIsOrgAdmin] = useState(false)

  useEffect(() => {
    api.orgs.list().then(orgs => {
      const org = orgs.find(o => o.id === getCurrentOrgId())
      if (org && (org.role === 'admin' || org.role === 'owner')) setIsOrgAdmin(true)
    }).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [agentList, skillsList, toolsList] = await Promise.all([
        api.me.agents(),
        api.agents.skills.list(id),
        api.agents.tools.list(id),
      ])
      const found = agentList.find(a => a.id === id)
      if (!found) { setError('Agent not found'); return }
      setAgent(found)
      setSkills(skillsList)
      setTools(toolsList)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading agent')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function handleRevokeAgent() {
    if (!agent) return
    if (!confirm(`Revoke token for "${agent.agent_name}"? This cannot be undone.`)) return
    await api.me.revokeAgent(agent.id)
    setAgent(prev => prev ? { ...prev, is_active: false } : prev)
  }

  async function handleDeactivateSkill(skillId: string) {
    if (!id) return
    await api.agents.skills.deactivate(id, skillId)
    setSkills(prev => prev.map(s => s.id === skillId ? { ...s, is_active: false } : s))
  }

  async function handleDeactivateTool(toolId: string) {
    if (!id) return
    await api.agents.tools.deactivate(id, toolId)
    setTools(prev => prev.map(t => t.id === toolId ? { ...t, is_active: false } : t))
  }

  const activeSkills = skills.filter(s => s.is_active)
  const activeTools  = tools.filter(t => t.is_active)

  return (
    <Layout
      title={agent?.agent_name ?? 'Agente'}
      breadcrumbs={[
        { label: 'Agentes', href: '/agents' },
        { label: agent?.agent_name ?? id ?? '…' },
      ]}
    >
      <div className="max-w-3xl">

        {/* Back link */}
        <button
          onClick={() => navigate('/agents')}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-5 transition-colors"
        >
          <ChevronLeft size={15} /> All agents
        </button>

        {loading && (
          <div className="flex items-center gap-2 text-subtle text-sm py-12">
            <Loader2 size={16} className="animate-spin" /> Loading agent…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        {!loading && agent && (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center shrink-0">
                <Bot size={20} className="text-accent" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">{agent.agent_name}</h1>
                {agent.description && <p className="text-sm text-muted">{agent.description}</p>}
              </div>
              {!agent.is_active && (
                <span className="ml-auto text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-1 rounded-lg">Revoked</span>
              )}
            </div>

            <Tabs
              active={tab}
              onChange={setTab}
              skillCount={activeSkills.length}
              toolCount={activeTools.length}
            />

            {tab === 'overview' && (
              <OverviewTab agent={agent} onRevoke={handleRevokeAgent} />
            )}
            {tab === 'skills' && (
              <SkillsTab agentId={id!} skills={skills} onDeactivate={handleDeactivateSkill} isOrgAdmin={isOrgAdmin} />
            )}
            {tab === 'tools' && (
              <ToolsTab agentId={id!} tools={tools} onDeactivate={handleDeactivateTool} isOrgAdmin={isOrgAdmin} />
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
