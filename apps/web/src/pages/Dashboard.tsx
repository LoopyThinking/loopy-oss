import { Link } from 'react-router-dom'
import { useLoops } from '../hooks/useLoops'
import { LoopCard } from '../components/LoopCard'
import { clearToken } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export function Dashboard() {
  const navigate = useNavigate()
  const { loops, loading, error, refetch } = useLoops()

  const open   = loops.filter((l) => l.status === 'open')
  const other  = loops.filter((l) => l.status !== 'open')

  function handleSignOut() {
    clearToken()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-loopy-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">L</span>
            </div>
            <span className="font-semibold text-slate-900">Loopy OSS</span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-slate-500 hover:text-slate-800 transition"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Title row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Loops</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {open.length} active{open.length === 1 ? '' : 's'}
            </p>
          </div>
          <Link
            to="/loops/new"
            className="rounded-lg bg-loopy-600 px-4 py-2 text-sm font-semibold text-white
                       hover:bg-loopy-700 transition"
          >
            + New loop
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button
              onClick={() => void refetch()}
              className="mt-2 text-xs text-red-600 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Active loops */}
        {!loading && !error && (
          <>
            {open.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center">
                <p className="text-slate-400 text-sm">No active loops.</p>
                <Link
                  to="/loops/new"
                  className="mt-3 inline-block text-sm font-medium text-loopy-600 hover:underline"
                >
                  Create your first loop →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {open.map((loop) => <LoopCard key={loop.id} loop={loop} />)}
              </div>
            )}

            {/* Closed / blocked */}
            {other.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Closed & Blocked
                </h2>
                <div className="space-y-3">
                  {other.map((loop) => <LoopCard key={loop.id} loop={loop} />)}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
