import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Repeat2, ArrowUpDown, Plus, Loader2 } from 'lucide-react'
import { Layout } from '../components/Layout'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import { IPLBadge } from '../components/IPLBadge'
import { useLoops } from '../hooks/useLoops'
import type { Loop, LoopStatus, LoopScope } from '../lib/api'

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<LoopStatus, string> = {
  open:    'bg-blue-50 text-blue-700 border-blue-100',
  closed:  'bg-slate-100 text-slate-500 border-slate-200',
  blocked: 'bg-red-50 text-red-700 border-red-100',
}

const SCOPE_BADGE: Record<LoopScope, string> = {
  personal:     'bg-gray-50 text-gray-500',
  team:         'bg-indigo-50 text-indigo-600',
  organizational: 'bg-purple-50 text-purple-600',
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

type SortKey = 'title' | 'status' | 'scope' | 'confidence_index' | 'ipl_minutes' | 'updated_at'
type SortDir = 'asc' | 'desc'

function sortLoops(loops: Loop[], key: SortKey, dir: SortDir): Loop[] {
  return [...loops].sort((a, b) => {
    const av = a[key] as string | number
    const bv = b[key] as string | number
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return dir === 'asc' ? cmp : -cmp
  })
}

function SortButton({ label, sortKey, current, dir, onSort }: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (k: SortKey) => void
}) {
  const active = current === sortKey
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 group ${active ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-700'}`}
    >
      {label}
      <ArrowUpDown size={11} className={active ? 'text-indigo-600' : 'text-gray-300 group-hover:text-gray-500'} />
      {active && <span className="text-xs">{dir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function Loops() {
  const { loops, loading, error, refetch } = useLoops()
  const [sortKey, setSortKey] = useState<SortKey>('updated_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filterStatus, setFilterStatus] = useState<LoopStatus | ''>('')

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = filterStatus ? loops.filter(l => l.status === filterStatus) : loops
  const sorted   = sortLoops(filtered, sortKey, sortDir)

  return (
    <Layout title="Loops" breadcrumbs={[{ label: 'Loops' }]}>
      <div className="max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Repeat2 size={18} className="text-gray-400" />
            <h1 className="text-xl font-bold text-gray-900">Todos los loops</h1>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{loops.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as LoopStatus | '')}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">Todos los estados</option>
              <option value="open">Abiertos</option>
              <option value="closed">Cerrados</option>
              <option value="blocked">Bloqueados</option>
            </select>
            <Link
              to="/loops/new"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={14} /> Nuevo loop
            </Link>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-12">
            <Loader2 size={16} className="animate-spin" /> Cargando loops…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button onClick={() => void refetch()} className="mt-2 text-xs text-red-600 underline">Reintentar</button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          sorted.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
              <Repeat2 size={28} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">No hay loops que mostrar.</p>
              <Link to="/loops/new" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
                Crea tu primer loop →
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    <th className="text-left px-4 py-3">
                      <SortButton label="Título" sortKey="title" current={sortKey} dir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="text-left px-4 py-3">
                      <SortButton label="Estado" sortKey="status" current={sortKey} dir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">
                      <SortButton label="Scope" sortKey="scope" current={sortKey} dir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      <SortButton label="Confianza" sortKey="confidence_index" current={sortKey} dir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      <SortButton label="IPL" sortKey="ipl_minutes" current={sortKey} dir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">
                      <SortButton label="Actualizado" sortKey="updated_at" current={sortKey} dir={sortDir} onSort={handleSort} />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sorted.map(loop => (
                    <tr key={loop.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/loops/${loop.id}`} className="font-medium text-gray-800 hover:text-indigo-700 block truncate max-w-xs">
                          {loop.title}
                        </Link>
                        {loop.hypothesis && (
                          <p className="text-xs text-gray-400 truncate max-w-xs">{loop.hypothesis}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs border px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_BADGE[loop.status]}`}>
                          {loop.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${SCOPE_BADGE[loop.scope]}`}>
                          {loop.scope}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <ConfidenceBadge value={loop.confidence_index} size="sm" />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <IPLBadge minutes={loop.ipl_minutes} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                        {fmtDate(loop.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </Layout>
  )
}
