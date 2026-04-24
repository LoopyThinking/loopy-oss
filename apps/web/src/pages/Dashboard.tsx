import { Link } from 'react-router-dom'
import { useLoops } from '../hooks/useLoops'
import { LoopCard } from '../components/LoopCard'
import { Layout } from '../components/Layout'

export function Dashboard() {
  const { loops, loading, error, refetch } = useLoops()
  const open  = loops.filter(l => l.status === 'open')
  const other = loops.filter(l => l.status !== 'open')

  return (
    <Layout title="Dashboard" breadcrumbs={[{ label: 'Dashboard' }]}>
      <div className="max-w-3xl">

        {/* Title row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mis loops</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {open.length} activo{open.length === 1 ? '' : 's'}
            </p>
          </div>
          <Link
            to="/loops/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            + Nuevo loop
          </Link>
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

        {/* Active loops */}
        {!loading && !error && (
          <>
            {open.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
                <p className="text-gray-400 text-sm">No hay loops activos.</p>
                <Link to="/loops/new" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline">
                  Crea tu primer loop →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {open.map(loop => <LoopCard key={loop.id} loop={loop} />)}
              </div>
            )}

            {other.length > 0 && (
              <section className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Cerrados y bloqueados
                </h2>
                <div className="space-y-3">
                  {other.map(loop => <LoopCard key={loop.id} loop={loop} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
