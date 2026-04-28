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
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
        <span className="text-gray-400">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
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
      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
      title="Copiar"
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
    if (!confirm(`¿Revocar el token del agente "${agentName}"? Esta acción no se puede deshacer.`)) return
    api.me.revokeAgent(agentId)
      .then(() => setAgents(prev => prev.map(a => a.id === agentId ? { ...a, is_active: false } : a)))
      .catch(e => setError(e.message))
  }

  if (loading) {
    return (
      <Layout title="Ajustes" breadcrumbs={[{ label: 'Ajustes' }]}>
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-2">
          <Loader2 size={16} className="animate-spin" /> Cargando…
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Ajustes" breadcrumbs={[{ label: 'Ajustes' }]}>
      <div className="max-w-2xl">

        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ── Perfil ──────────────────────────────────────────────────────── */}
        <Section title="Mi perfil" icon={<User size={15} />}>
          <form onSubmit={handleSaveName} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nombre visible
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={120}
                placeholder="Tu nombre"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Email
              </label>
              <input
                type="text"
                value={profile?.email ?? '—'}
                disabled
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="py-2 px-4 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              {saved && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Check size={13} /> Guardado
                </span>
              )}
            </div>
          </form>
        </Section>

        {/* ── Tokens de agente ────────────────────────────────────────────── */}
        <Section title="Tokens de agente" icon={<Key size={15} />}>
          <p className="text-xs text-gray-500 mb-4">
            Los tokens de agente permiten que scripts y skills se autentiquen en la API.
            El token en claro solo se muestra una vez, al registrar el agente. Aquí puedes
            ver qué agentes tienes activos y revocarlos si ya no los necesitas.
          </p>

          {agents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No tienes agentes registrados todavía.<br />
              <span className="text-xs">Usa <code className="bg-gray-100 px-1 py-0.5 rounded">POST /agents</code> para crear uno.</span>
            </p>
          ) : (
            <div className="space-y-2">
              {agents.map(agent => (
                <div
                  key={agent.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                    agent.is_active ? 'border-gray-100 bg-gray-50/50' : 'border-gray-100 bg-gray-50 opacity-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{agent.agent_name}</p>
                      {!agent.is_active && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">revocado</span>
                      )}
                    </div>
                    {agent.description && (
                      <p className="text-xs text-gray-500 truncate">{agent.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      ID: <span className="font-mono">{agent.id.slice(0, 8)}…</span>
                      {' · '}
                      {agent.last_seen_at
                        ? `Último uso: ${new Date(agent.last_seen_at).toLocaleDateString('es')}`
                        : 'Sin actividad'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <CopyButton text={agent.id} />
                    {agent.is_active && (
                      <button
                        onClick={() => handleRevokeAgent(agent.id, agent.agent_name)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Revocar token"
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
        <Section title="Mis organizaciones" icon={<Building2 size={15} />}>
          {!profile?.orgs?.length ? (
            <p className="text-sm text-gray-400 text-center py-4">No perteneces a ninguna organización.</p>
          ) : (
            <div className="space-y-2">
              {profile.orgs.map(org => (
                <div key={org.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{org.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{org.slug}</p>
                  </div>
                  <RoleBadge role={org.role} />
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Proveedores LLM — only for admin+ ────────────────────────────── */}
        {profile?.orgs?.some(o => o.id === getCurrentOrgId() && (o.role === 'admin' || o.role === 'owner')) && (
          <LlmConfigSection />
        )}

      </div>
    </Layout>
  )
}
