import { useState, useEffect } from 'react'
import { Check, Copy, Trash2, Loader2, User, Key, Building2, Sparkles } from 'lucide-react'
import { Layout } from '../components/Layout'
import { api, getCurrentOrgId } from '../lib/api'
import { LlmConfigSection } from '../components/settings/LlmConfigSection'

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string
  email: string
  display_name: string | null
  created_at: string
  orgs: Array<{ id: string; name: string; slug: string; role: string }>
}

interface AgentEntry {
  id: string
  agent_name: string
  description: string | null
  is_active: boolean
  created_at: string
  last_seen_at: string | null
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, icon, children }: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-card border border-edge rounded-xl overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-edge-subtle flex items-center gap-2">
        <span className="text-subtle">{icon}</span>
        <h2 className="text-sm font-semibold text-primary">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      className="p-1.5 text-subtle hover:text-secondary hover:bg-hover rounded transition-colors"
      title="Copy"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  )
}

// ── Role badge ────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  owner:  'bg-violet-50 text-violet-700',
  admin:  'bg-indigo-50 text-indigo-700',
  member: 'bg-blue-50   text-blue-700',
  viewer: 'bg-gray-100  text-gray-600',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[role] ?? ROLE_COLORS.viewer}`}>
      {role}
    </span>
  )
}

// ── Settings page ─────────────────────────────────────────────────────────────

export function Settings() {
  const [profile,  setProfile]  = useState<UserProfile | null>(null)
  const [agents,   setAgents]   = useState<AgentEntry[]>([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [name,     setName]     = useState('')
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.me.get(), api.me.agents()])
      .then(([prof, ags]) => {
        setProfile(prof)
        setName(prof.display_name ?? '')
        setAgents(ags)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    api.me.update({ display_name: name.trim() })
      .then(updated => {
        setProfile(p => p ? { ...p, display_name: updated.display_name } : p)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      })
      .catch(e => setError(e.message))
      .finally(() => setSaving(false))
  }

  function handleRevokeAgent(agentId: string, agentName: string) {
    if (!confirm(`Revoke token for agent "${agentName}"? This action cannot be undone.`)) return
    api.me.revokeAgent(agentId)
      .then(() => setAgents(prev => prev.map(a => a.id === agentId ? { ...a, is_active: false } : a)))
      .catch(e => setError(e.message))
  }

  if (loading) {
    return (
      <Layout title="Settings" breadcrumbs={[{ label: 'Settings' }]}>
        <div className="flex items-center justify-center h-64 text-subtle text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Settings" breadcrumbs={[{ label: 'Settings' }]}>
      <div className="max-w-2xl">

        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ── Profile ──────────────────────────────────────────────────────── */}
        <Section title="My profile" icon={<User size={15} />}>
          <form onSubmit={handleSaveName} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">
                Display name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={120}
                placeholder="Your name"
                className="w-full px-3 py-2 text-sm border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">
                Email
              </label>
              <input
                type="text"
                value={profile?.email ?? '—'}
                disabled
                className="w-full px-3 py-2 text-sm bg-surface border border-edge rounded-lg text-subtle cursor-not-allowed"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="py-2 px-4 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              {saved && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Check size={13} /> Saved
                </span>
              )}
            </div>
          </form>
        </Section>

        {/* ── Agent tokens ────────────────────────────────────────────── */}
        <Section title="Agent tokens" icon={<Key size={15} />}>
          <p className="text-xs text-muted mb-4">
            Agent tokens let scripts and skills authenticate against the API.
            The plain-text token is shown only once, when registering the agent. Here you can
            see which agents are active and revoke them if no longer needed.
          </p>

          {agents.length === 0 ? (
            <p className="text-sm text-subtle text-center py-4">
              You don't have any registered agents yet.<br />
              <span className="text-xs">Use <code className="bg-elevated px-1 py-0.5 rounded">POST /agents</code> to create one.</span>
            </p>
          ) : (
            <div className="space-y-2">
              {agents.map(agent => (
                <div
                  key={agent.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                    agent.is_active ? 'border-edge bg-surface' : 'border-edge bg-surface opacity-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-primary truncate">{agent.agent_name}</p>
                      {!agent.is_active && (
                        <span className="text-xs text-subtle bg-elevated px-1.5 py-0.5 rounded">revoked</span>
                      )}
                    </div>
                    {agent.description && (
                      <p className="text-xs text-muted truncate">{agent.description}</p>
                    )}
                    <p className="text-xs text-subtle mt-0.5">
                      ID: <span className="font-mono">{agent.id.slice(0, 8)}…</span>
                      {' · '}
                      {agent.last_seen_at
                        ? `Last used: ${new Date(agent.last_seen_at).toLocaleDateString('en')}`
                        : 'No activity'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <CopyButton text={agent.id} />
                    {agent.is_active && (
                      <button
                        onClick={() => handleRevokeAgent(agent.id, agent.agent_name)}
                        className="p-1.5 text-subtle hover:text-red-500 hover:bg-red-light rounded transition-colors"
                        title="Revoke token"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Organizaciones ──────────────────────────────────────────────── */}
        <Section title="My organizations" icon={<Building2 size={15} />}>
          {!profile?.orgs?.length ? (
            <p className="text-sm text-subtle text-center py-4">You don't belong to any organization.</p>
          ) : (
            <div className="space-y-2">
              {profile.orgs.map(org => (
                <div key={org.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-edge bg-surface">
                  <div>
                    <p className="text-sm font-medium text-primary">{org.name}</p>
                    <p className="text-xs text-subtle font-mono">{org.slug}</p>
                  </div>
                  <RoleBadge role={org.role} />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── LLM Providers — only for admin+ ────────────────────────────── */}
        {profile?.orgs?.some(o => o.id === getCurrentOrgId() && (o.role === 'admin' || o.role === 'owner')) && (
          <LlmConfigSection />
        )}

      </div>
    </Layout>
  )
}
