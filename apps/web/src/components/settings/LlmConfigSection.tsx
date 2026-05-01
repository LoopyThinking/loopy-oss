import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Loader2, Check, X, Trash2, RefreshCw,
} from 'lucide-react'
import { api, getCurrentOrgId, type LlmConfigPublic } from '../../lib/api'

const PROVIDER_OPTIONS = [
  { value: 'anthropic', label: 'Anthropic', suggestedModels: 'claude-sonnet-4-6, claude-opus-4-7' },
  { value: 'openai', label: 'OpenAI', suggestedModels: 'gpt-4o, gpt-4o-mini' },
  { value: 'google', label: 'Google', suggestedModels: 'gemini-2.0-flash, gemini-2.5-pro' },
  { value: 'deepseek', label: 'DeepSeek', suggestedModels: 'deepseek-chat, deepseek-reasoner' },
  { value: 'openai_compatible', label: 'OpenAI Compatible', suggestedModels: 'llama3, mixtral' },
]

const PROVIDER_BADGES: Record<string, string> = {
  anthropic: 'bg-orange-50 text-orange-700',
  openai: 'bg-green-50 text-green-700',
  google: 'bg-blue-50 text-blue-700',
  openai_compatible: 'bg-gray-100 text-gray-600',
  deepseek: 'bg-cyan-50 text-cyan-700',
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
    <div className="bg-card border border-edge rounded-xl overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-edge flex items-center justify-between">
        <h2 className="text-sm font-semibold text-primary">LLM Providers</h2>
        <button
          onClick={() => { setShowForm(v => !v); setFormError(null) }}
          className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent transition-colors"
        >
          <Plus size={14} /> Add provider
        </button>
      </div>

      <div className="px-5 py-5">
        {error && (
          <div className="mb-4 bg-red-light border border-red/20 rounded-lg px-3 py-2 text-sm text-red">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8 text-subtle text-sm gap-2">
            <Loader2 size={15} className="animate-spin" /> Loading…
          </div>
        )}

        {!loading && configs.length === 0 && !showForm && (
          <p className="text-sm text-subtle text-center py-6">
            No LLM providers configured.
          </p>
        )}

        {/* Config list */}
        {configs.length > 0 && (
          <div className="space-y-2 mb-4">
            {configs.map(config => (
              <div
                key={config.id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  config.is_active ? 'border-edge bg-surface' : 'border-edge bg-surface opacity-50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${PROVIDER_BADGES[config.provider] ?? PROVIDER_BADGES.openai_compatible}`}>
                      {config.provider}
                    </span>
                    <p className="text-sm font-medium text-primary">{config.display_name}</p>
                    {config.is_default && (
                      <span className="text-xs bg-accent-light text-accent px-1.5 py-0.5 rounded font-medium">default</span>
                    )}
                    {!config.is_active && (
                      <span className="text-xs text-subtle bg-elevated px-1.5 py-0.5 rounded">inactive</span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {config.model}
                    {config.base_url && <span className="text-subtle"> · {config.base_url}</span>}
                    <span className="text-subtle"> · ••••{config.api_key_last4}</span>
                  </p>
                  <p className="text-xs text-subtle mt-0.5">
                    {config.last_tested_at ? (
                      <TestStatus ok={config.last_test_ok} error={config.last_test_error} />
                    ) : (
                      <span className="text-subtle">Not tested</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  {!config.is_default && config.is_active && (
                    <button
                      onClick={() => handleSetDefault(config.id)}
                      className="text-xs text-accent hover:text-accent px-2 py-1 rounded hover:bg-accent-light transition-colors"
                      title="Set as default"
                    >
                      Default
                    </button>
                  )}
                  <button
                    onClick={() => handleTest(config.id)}
                    className="p-1.5 text-subtle hover:text-accent hover:bg-accent-light rounded transition-colors"
                    title="Test connection"
                  >
                    <RefreshCw size={13} className={config.id === createdId ? 'animate-spin' : ''} />
                  </button>
                  {!config.is_default && config.is_active && (
                    <button
                      onClick={() => handleRemove(config.id)}
                      className="p-1.5 text-subtle hover:text-red hover:bg-red-light rounded transition-colors"
                      title="Deactivate"
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
          <form onSubmit={handleCreate} className="bg-accent-light border border-accent/20 rounded-xl p-4 space-y-3">
            {formError && (
              <div className="text-sm text-red bg-red-light border border-red/20 rounded-lg px-3 py-2">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-accent mb-1">Provider</label>
                <select
                  value={formProvider}
                  onChange={e => setFormProvider(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-card border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {PROVIDER_OPTIONS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-accent mb-1">
                  Name <span className="text-subtle font-normal">(e.g. "Claude Prod")</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                  placeholder="My config"
                  className="w-full px-3 py-2 text-sm bg-card border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-accent mb-1">
                Model <span className="text-subtle font-normal">(suggested: {selectedProvider?.suggestedModels})</span>
              </label>
              <input
                type="text"
                value={formModel}
                onChange={e => setFormModel(e.target.value)}
                required
                placeholder={selectedProvider?.suggestedModels?.split(',')[0]?.trim() ?? 'model'}
                className="w-full px-3 py-2 text-sm bg-card border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            {formProvider === 'openai_compatible' && (
              <div>
                <label className="block text-xs font-medium text-accent mb-1">Base URL</label>
                <input
                  type="url"
                  value={formBaseUrl}
                  onChange={e => setFormBaseUrl(e.target.value)}
                  required
                  placeholder="http://localhost:11434/v1"
                  className="w-full px-3 py-2 text-sm bg-card border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-accent mb-1">API Key</label>
              <input
                type="password"
                value={formApiKey}
                onChange={e => setFormApiKey(e.target.value)}
                required
                placeholder={formProvider === 'anthropic' ? 'sk-ant-…' : formProvider === 'openai' || formProvider === 'openai_compatible' ? 'sk-…' : 'AIza…'}
                className="w-full px-3 py-2 text-sm bg-card border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <p className="text-xs text-subtle">
              The API key is encrypted with AES-256-GCM and will not be shown after saving.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={creating || !formName.trim() || !formModel.trim() || !formApiKey.trim()}
                className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Add
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted hover:text-secondary">
                Cancel
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
    return <span className="text-green flex items-center gap-1"><Check size={11} /> Connection OK</span>
  }
  if (ok === false) {
    return <span className="text-red flex items-center gap-1"><X size={11} /> {error ?? 'Error'}</span>
  }
  return null
}
