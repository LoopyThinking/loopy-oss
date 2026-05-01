import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { LoopScope } from '../lib/api'

export function CreateLoopForm() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [hypothesis, setHypothesis] = useState('')
  const [scope, setScope] = useState<LoopScope>('personal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError(null)

    try {
      const loop = await api.loops.create({
        title: title.trim(),
        hypothesis: hypothesis.trim() || undefined,
        scope,
      })
      navigate(`/loops/${loop.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create loop')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-secondary mb-1.5">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you working toward?"
          required
          maxLength={255}
          className="w-full rounded-lg border border-edge bg-card px-3.5 py-2.5 text-sm
                     placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30
                     focus:border-accent transition"
        />
      </div>

      <div>
        <label htmlFor="hypothesis" className="block text-sm font-medium text-secondary mb-1.5">
          Hypothesis
          <span className="ml-1.5 text-xs text-subtle font-normal">optional</span>
        </label>
        <textarea
          id="hypothesis"
          value={hypothesis}
          onChange={(e) => setHypothesis(e.target.value)}
          placeholder="What outcome or decision are you testing?"
          rows={3}
          className="w-full rounded-lg border border-edge bg-card px-3.5 py-2.5 text-sm
                     placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30
                     focus:border-accent transition resize-none"
        />
      </div>

      <div>
        <label htmlFor="scope" className="block text-sm font-medium text-secondary mb-1.5">
          Scope
        </label>
        <select
          id="scope"
          value={scope}
          onChange={(e) => setScope(e.target.value as LoopScope)}
          className="w-full rounded-lg border border-edge bg-card px-3.5 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-loopy-400 focus:border-loopy-400
                     transition appearance-none cursor-pointer"
        >
          <option value="personal">Personal</option>
          <option value="team">Team</option>
          <option value="organizational">Organizational</option>
        </select>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex-1 rounded-lg border border-edge px-4 py-2.5 text-sm font-medium
                     text-secondary hover:bg-surface transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white
                     hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Creating…' : 'Create Loop'}
        </button>
      </div>
    </form>
  )
}
