import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLoops } from '../hooks/useLoops'
import { LoopCard } from '../components/LoopCard'
import { Layout } from '../components/Layout'
import { getCurrentOrgId, api } from '../lib/api'
import { useEffect } from 'react'

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

        {/* Title row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {scope === 'team' ? 'Loops del equipo' : 'Mis loops'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {open.length} activo{open.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Segmented toggle — admin+ only */}
            {isAdmin && (
              <div className="flex bg-gray-100 rounded-lg p-0.5 text-sm">
                <button
                  onClick={() => setScope('mine')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    scope === 'mine' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Mis loops
                </button>
                <button
                  onClick={() => setScope('team')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                    scope === 'team' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Del equipo
                </button>
              </div>
            )}

            {scope === 'mine' && (
              <Link
                to="/loops/new"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              >
                + Nuevo loop
              </Link>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button onClick={() => void refetch()} className="mt-2 text-xs text-red-600 underline hover:no-underline">
              Reintentar
            </button>
          </div>
        )}

        {/* Loops list */}
        {!loading && !error && (
          <>
            {open.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
                <p className="text-gray-400 text-sm">
                  {scope === 'team' ? 'El equipo no tiene loops activos.' : 'No hay loops activos.'}
                </p>
                {scope === 'mine' && (
                  <Link to="/loops/new" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline">
                    Crea tu primer loop →
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
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Cerrados y bloqueados
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
