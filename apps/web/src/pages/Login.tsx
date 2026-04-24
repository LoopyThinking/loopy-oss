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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-loopy-600 mb-4">
            <span className="text-white text-xl font-bold">L</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Loopy OSS</h1>
          <p className="mt-1 text-sm text-slate-500">Self-hosted work signal tracking</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-6">
            Paste your JWT token to continue.
          </p>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="token" className="block text-sm font-medium text-slate-700 mb-1.5">
                Bearer Token
              </label>
              <textarea
                id="token"
                value={token}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="eyJ..."
                rows={4}
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5
                           text-xs font-mono placeholder:text-slate-400 focus:outline-none
                           focus:ring-2 focus:ring-loopy-400 focus:border-loopy-400 transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full rounded-lg bg-loopy-600 px-4 py-2.5 text-sm font-semibold text-white
                         hover:bg-loopy-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Connecting…' : 'Connect'}
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500 font-medium mb-1">Generate a token</p>
            <code className="text-xs text-slate-600 break-all leading-relaxed">
              node -e &quot;require('./scripts/gen-token')&quot;
            </code>
            <p className="text-xs text-slate-400 mt-1">
              See <span className="font-mono">docker/README.md</span> for full instructions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
