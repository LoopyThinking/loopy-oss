import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken, api } from '../lib/api'

export function Login() {
  const navigate = useNavigate()
  const [token, setTokenInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Strip all whitespace — JWTs have none, but copy-paste from terminals/chats
    // can introduce zero-width spaces, soft hyphens, or embedded newlines that
    // browsers reject as invalid HTTP header values.
    const trimmed = token.replace(/\s+/g, '')
    if (!trimmed) return

    setLoading(true)
    setError(null)

    try {
      // Verify the token works by hitting /health (no auth needed)
      // then /loops to confirm the token is valid
      setToken(trimmed)
      await api.loops.list()
      navigate('/dashboard')
    } catch (err) {
      setToken('')
      setError(
        err instanceof Error && err.message.includes('401')
          ? 'Invalid token — check that it hasn\'t expired.'
          : (err instanceof Error ? err.message : 'Connection failed')
      )
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mb-4">
            <span className="text-white text-xl font-bold">L</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">Loopy OSS</h1>
          <p className="mt-1 text-sm text-muted">Self-hosted work signal tracking</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-edge shadow-sm p-8">
          <h2 className="text-lg font-semibold text-primary mb-1">Sign in</h2>
          <p className="text-sm text-muted mb-6">
            Paste your JWT token to continue.
          </p>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="token" className="block text-sm font-medium text-secondary mb-1.5">
                Bearer Token
              </label>
              <textarea
                id="token"
                value={token}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="eyJ..."
                rows={4}
                required
                className="w-full rounded-lg border border-edge bg-surface px-3.5 py-2.5
                           text-xs font-mono placeholder:text-subtle focus:outline-none
                           focus:ring-2 focus:ring-accent/30 focus:border-accent transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white
                         hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Connecting…' : 'Connect'}
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-surface border border-edge px-4 py-3">
            <p className="text-xs text-muted font-medium mb-1">Generate a token</p>
            <code className="text-xs text-secondary break-all leading-relaxed">
              node -e &quot;require('./scripts/gen-token')&quot;
            </code>
            <p className="text-xs text-subtle mt-1">
              See <span className="font-mono">docker/README.md</span> for full instructions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
