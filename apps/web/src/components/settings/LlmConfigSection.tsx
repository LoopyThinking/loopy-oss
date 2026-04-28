import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Loader2, Check, X, Trash2, RefreshCw,
} from 'lucide-react'
import { api, getCurrentOrgId, type LlmConfigPublic } from '../../lib/api'

const PROVIDER_OPTIONS = [
  { value: 'anthropic', label: 'Anthropic', suggestedModels: 'claude-sonnet-4-6, claude-opus-4-7' },
  { value: 'openai', label: 'OpenAI', suggestedModels: 'gpt-4o, gpt-4o-mini' },
  { value: 'google', label: 'Google', suggestedModels: 'gemini-2.0-flash, gemini-2.5-pro' },
  { value: 'openai_compatible', label: 'OpenAI Compatible', suggestedModels: 'llama3, mixtral' },
]

const PROVIDER_BADGES: Record<string, string> = {
  anthropic: 'bg-orange-50 text-orange-700',
  openai: 'bg-green-50 text-green-700',
  google: 'bg-blue-50 text-blue-700',
  openai_compatible: 'bg-gray-100 text-gray-600',
}

export function LlmConfigSection() {
  const orgId = getCurrentOrgId()
  const [configs, setConfigs] = useState<LlmConfigPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // New config form
  const [showForm, setShowForm] = useState(false)
  const [formProvider, setFormProvider] = useState('anthropic')
  const [formName, setFormName] = useState('')
  const [formModel, setFormModel] = useState('')
  const [formBaseUrl, setFormBaseUrl] = useState('')
  const [formApiKey, setFormApiKey] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    try {
      const list = await api.llm.list(orgId)
      setConfigs(list)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading LLM configs')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId) return
    if (!formName.trim() || !formModel.trim() || !formApiKey.trim()) return
    setCreating(true)
    setFormError(null)
    setCreatedId(null)
    try {
      const config = await api.llm.create(orgId, {
        provider: formProvider,
        display_name: formName.trim(),
        model: formModel.trim(),
        base_url: formProvider === 'openai_compatible' ? formBaseUrl.trim() || undefined : undefined,
        api_key: formApiKey.trim(),
        is_default: configs.length === 0, // auto-default if first
      })
      setConfigs(prev => [config, ...prev])
      setCreatedId(config.id)
      // Auto-test the connection
      try {
        const tested = await api.llm.test(orgId, config.id)
        setConfigs(prev => prev.map(c => c.id === tested.id ? tested : c))
      } catch { /* test failure is ok */ }
      // Reset form
      setFormName('')
      setFormModel('')
      setFormBaseUrl('')
      setFormApiKey('')
      setShowForm(false)
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Error creating config')
    } finally {
      setCreating(false)
    }
  }

  async function handleTest(configId: string) {
    if (!orgId) return
    try {
      const updated = await api.llm.test(orgId, configId)
      setConfigs(prev => prev.map(c => c.id === updated.id ? updated : c))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Test failed')
    }
  }

  async function handleSetDefault(configId: string) {
    if (!orgId) return
    try {
      const updated = await api.llm.update(orgId, configId, { is_default: true })
      setConfigs(prev => prev.map(c => ({
        ...c,
        is_default: c.id === updated.id,
      })))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error setting default')
    }
  }

  async function handleRemove(configId: string) {
    if (!orgId) return
    if (!confirm('¿Desactivar esta configuración LLM?')) return
    try {
      await api.llm.remove(orgId, configId)
      setConfigs(prev => prev.map(c => c.id === configId ? { ...c, is_active: false } : c))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error removing config')
    }
  }

  const selectedProvider = PROVIDER_OPTIONS.find(p => p.value === formProvider)

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Proveedores LLM</h2>
        <button
          onClick={() => { setShowForm(v => !v); setFormError(null) }}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <Plus size={14} /> Añadir proveedor
        </button>
      </div>

      <div className="px-5 py-5">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
            <Loader2 size={15} className="animate-spin" /> Cargando…
          </div>
        )}

        {!loading && configs.length === 0 && !showForm && (
          <p className="text-sm text-gray-400 text-center py-6">
            No hay proveedores LLM configurados.
          </p>
        )}

        {/* Config list */}
        {configs.length > 0 && (
          <div className="space-y-2 mb-4">
            {configs.map(config => (
              <div
                key={config.id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  config.is_active ? 'border-gray-100 bg-gray-50/50' : 'border-gray-100 bg-gray-50 opacity-50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${PROVIDER_BADGES[config.provider] ?? PROVIDER_BADGES.openai_compatible}`}>
                      {config.provider}
                    </span>
                    <p className="text-sm font-medium text-gray-800">{config.display_name}</p>
                    {config.is_default && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">predet.</span>
                    )}
                    {!config.is_active && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">inactivo</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {config.model}
                    {config.base_url && <span className="text-gray-400"> · {config.base_url}</span>}
                    <span className="text-gray-400"> · ••••{config.api_key_last4}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {config.last_tested_at ? (
                      <TestStatus ok={config.last_test_ok} error={config.last_test_error} />
                    ) : (
                      <span className="text-gray-300">Sin probar</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  {!config.is_default && config.is_active && (
                    <button
                      onClick={() => handleSetDefault(config.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                      title="Marcar como predeterminado"
                    >
                      Predet.
                    </button>
                  )}
                  <button
                    onClick={() => handleTest(config.id)}
                    className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-colors"
                    title="Probar conexión"
                  >
                    <RefreshCw size={13} className={config.id === createdId ? 'animate-spin' : ''} />
                  </button>
                  {!config.is_default && config.is_active && (
                    <button
                      onClick={() => handleRemove(config.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Desactivar"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
            {formError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-indigo-800 mb-1">Proveedor</label>
                <select
                  value={formProvider}
                  onChange={e => setFormProvider(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {PROVIDER_OPTIONS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-indigo-800 mb-1">
                  Nombre <span className="text-indigo-400 font-normal">(ej. "Claude Prod")</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                  placeholder="Mi config"
                  className="w-full px-3 py-2 text-sm bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-indigo-800 mb-1">
                Modelo <span className="text-indigo-400 font-normal">(sugerido: {selectedProvider?.suggestedModels})</span>
              </label>
              <input
                type="text"
                value={formModel}
                onChange={e => setFormModel(e.target.value)}
                required
                placeholder={selectedProvider?.suggestedModels?.split(',')[0]?.trim() ?? 'model'}
                className="w-full px-3 py-2 text-sm bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            {formProvider === 'openai_compatible' && (
              <div>
                <label className="block text-xs font-medium text-indigo-800 mb-1">Base URL</label>
                <input
                  type="url"
                  value={formBaseUrl}
                  onChange={e => setFormBaseUrl(e.target.value)}
                  required
                  placeholder="http://localhost:11434/v1"
                  className="w-full px-3 py-2 text-sm bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-indigo-800 mb-1">API Key</label>
              <input
                type="password"
                value={formApiKey}
                onChange={e => setFormApiKey(e.target.value)}
                required
                placeholder={formProvider === 'anthropic' ? 'sk-ant-…' : formProvider === 'openai' || formProvider === 'openai_compatible' ? 'sk-…' : 'AIza…'}
                className="w-full px-3 py-2 text-sm bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <p className="text-xs text-indigo-400">
              La API key se cifra con AES-256-GCM y nunca se muestra después de guardarla.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={creating || !formName.trim() || !formModel.trim() || !formApiKey.trim()}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Añadir
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function TestStatus({ ok, error }: { ok: boolean | null; error: string | null }) {
  if (ok === true) {
    return <span className="text-green-600 flex items-center gap-1"><Check size={11} /> Conexión OK</span>
  }
  if (ok === false) {
    return <span className="text-red-500 flex items-center gap-1"><X size={11} /> {error ?? 'Error'}</span>
  }
  return null
}
