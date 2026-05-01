import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLoops } from '../hooks/useLoops'
import { LoopCard } from '../components/LoopCard'
import { Layout } from '../components/Layout'
import { getCurrentOrgId, api } from '../lib/api'
import { useEffect } from 'react'
import { BarChart3 } from 'lucide-react'

type ScopeView = 'mine' | 'team'

export function Dashboard() {
  const [scope, setScope]       = useState<ScopeView>('mine')
  const [isAdmin, setIsAdmin]   = useState(false)

  // Detect whether the current user is admin/owner in their org
  useEffect(() => {
    api.orgs.list()
      .then(orgs => {
        const orgId = getCurrentOrgId()
        const org   = orgs.find(o => o.id === orgId) ?? orgs[0]
        if (org && (org.role === 'admin' || org.role === 'owner')) setIsAdmin(true)
      })
      .catch(() => {})
  }, [])

  const { loops, loading, error, refetch } = useLoops(
    scope === 'team' ? { scope: 'team' } : {}
  )

  const open  = loops.filter(l => l.status === 'open')
  const other = loops.filter(l => l.status !== 'open')

  return (
    <Layout title="Dashboard" breadcrumbs={[{ label: 'Dashboard' }]}>
      <div className="max-w-3xl">

        {/* ── Admin banner: analytics ───────────────────────────────────── */}
        {isAdmin && (
          <Link
            to="/analytics"
            className="block mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white hover:from-indigo-600 hover:to-purple-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Analytics</p>
                <p className="text-xs text-indigo-100 mt-0.5">
                  Run ROI analysis, adoption, stuck loops and more
                </p>
              </div>
              <BarChart3 size={24} className="text-indigo-200" />
            </div>
          </Link>
        )}

        {/* Title row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-primary">
              {scope === 'team' ? 'Team loops' : 'My loops'}
            </h1>
            <p className="text-sm text-muted mt-0.5">
              {open.length} active
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Segmented toggle — admin+ only */}
            {isAdmin && (
              <div className="flex bg-elevated rounded-lg p-0.5 text-sm">
                <button
                  onClick={() => setScope('mine')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    scope === 'mine' ? 'bg-card text-primary shadow-sm' : 'text-muted hover:text-secondary'
                  }`}
                >
                  My loops
                </button>
                <button
                  onClick={() => setScope('team')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    scope === 'team' ? 'bg-card text-primary shadow-sm' : 'text-muted hover:text-secondary'
                  }`}
                >
                  Team
                </button>
              </div>
            )}

            {scope === 'mine' && (
              <Link
                to="/loops/new"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition"
              >
                + New loop
              </Link>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-xl bg-elevated animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button onClick={() => void refetch()} className="mt-2 text-xs text-red-600 underline hover:no-underline">
              Retry
            </button>
          </div>
        )}

        {/* Loops list */}
        {!loading && !error && (
          <>
            {open.length === 0 ? (
              <div className="rounded-xl border border-dashed border-edge py-16 text-center">
                <p className="text-subtle text-sm">
                  {scope === 'team' ? 'No active team loops.' : 'No active loops.'}
                </p>
                {scope === 'mine' && (
                  <Link to="/loops/new" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
                    Create your first loop →
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {open.map(loop => (
                  <LoopCard
                    key={loop.id}
                    loop={loop}
                    showOwner={scope === 'team'}
                  />
                ))}
              </div>
            )}

            {other.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-subtle mb-3">
                  Closed and blocked
                </h2>
                <div className="space-y-3">
                  {other.map(loop => (
                    <LoopCard key={loop.id} loop={loop} showOwner={scope === 'team'} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
