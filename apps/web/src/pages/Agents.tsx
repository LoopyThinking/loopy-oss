import { useState, useEffect } from 'react'
import { Bot, Copy, Check, Trash2, Loader2, Plus } from 'lucide-react'
import { Layout } from '../components/Layout'
import { api } from '../lib/api'

interface AgentEntry {
  id: string
  agent_name: string
  description: string | null
  is_active: boolean
  created_at: string
  last_seen_at: string | null
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <button onClick={copy} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Copiar ID">
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  )
}

export function Agents() {
  const [agents, setAgents] = useState<AgentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newToken, setNewToken] = useState<string | null>(null)

  useEffect(() => {
    api.me.agents()
      .then(setAgents)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setRegistering(true)
    try {
      // POST /agents to register a new agent
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
      setNewToken(data.token)  // show once
      setNewName('')
      setNewDesc('')
      setShowForm(false)
      // Refresh list
      const updated = await api.me.agents()
      setAgents(updated)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setRegistering(false)
    }
  }

  async function handleRevoke(agentId: string, agentName: string) {
    if (!confirm(`¿Revocar el token de "${agentName}"? No se puede deshacer.`)) return
    await api.me.revokeAgent(agentId)
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, is_active: false } : a))
  }

  return (
    <Layout title="Agentes" breadcrumbs={[{ label: 'Agentes' }]}>
      <div className="max-w-2xl">

        {/* Token shown once after registration */}
        {newToken && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm font-medium text-green-800 mb-1">✅ Agente registrado — guarda este token ahora, no se mostrará de nuevo:</p>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 text-xs bg-white border border-green-200 rounded px-3 py-2 font-mono break-all">{newToken}</code>
              <CopyButton text={newToken} />
            </div>
            <button onClick={() => setNewToken(null)} className="mt-3 text-xs text-green-700 underline">Entendido, cerrar</button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Agentes registrados</h1>
            <p className="text-sm text-gray-500 mt-0.5">Tokens de agente para conectar scripts y skills al API.</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} /> Nuevo agente
          </button>
        </div>

        {/* Registration form */}
        {showForm && (
          <form onSubmit={handleRegister} className="bg-white border border-gray-100 rounded-xl p-5 mb-6 space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">Registrar nuevo agente</h2>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del agente</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="claude-cowork-agent"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción (opcional)</label>
              <input
                type="text"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Agente de Cowork para el proyecto X"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={registering || !newName.trim()}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700 transition-colors">
                {registering ? 'Registrando…' : 'Registrar'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-8"><Loader2 size={16} className="animate-spin" /> Cargando…</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
            <Bot size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">No tienes agentes registrados.</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-indigo-600 hover:underline">
              Registra tu primer agente →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {agents.map(agent => (
              <div key={agent.id} className={`flex items-center justify-between px-4 py-3 bg-white rounded-xl border ${agent.is_active ? 'border-gray-100' : 'border-gray-100 opacity-50'}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800">{agent.agent_name}</p>
                    {!agent.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">revocado</span>}
                  </div>
                  {agent.description && <p className="text-xs text-gray-500 truncate">{agent.description}</p>}
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    {agent.id.slice(0, 8)}…
                    {agent.last_seen_at ? ` · último uso ${new Date(agent.last_seen_at).toLocaleDateString('es')}` : ' · sin actividad'}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  <CopyButton text={agent.id} />
                  {agent.is_active && (
                    <button onClick={() => handleRevoke(agent.id, agent.agent_name)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Revocar">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Usage hint */}
        <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
          <p className="text-xs font-medium text-indigo-800 mb-1">¿Cómo usar el token?</p>
          <p className="text-xs text-indigo-700">
            Pasa el token como variable de entorno <code className="bg-white px-1 rounded">LOOPY_AGENT_REGISTRY_TOKEN</code> en tu script o en la config del MCP server.
            El agente se identifica automáticamente al llamar al API.
          </p>
        </div>
      </div>
    </Layout>
  )
}
