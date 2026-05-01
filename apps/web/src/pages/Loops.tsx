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
  personal:     'bg-surface text-muted',
  team:         'bg-accent-light text-accent',
  organizational: 'bg-purple-50 text-purple-600',
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' })
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
      className={`flex items-center gap-1 group ${active ? 'text-accent' : 'text-subtle hover:text-secondary'}`}
    >
      {label}
      <ArrowUpDown size={11} className={active ? 'text-accent' : 'text-subtle group-hover:text-muted'} />
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
            <Repeat2 size={18} className="text-subtle" />
            <h1 className="text-xl font-bold text-primary">All loops</h1>
            <span className="text-xs bg-elevated text-muted px-2 py-0.5 rounded-full">{loops.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as LoopStatus | '')}
              className="px-3 py-1.5 text-sm border border-edge rounded-lg bg-card text-secondary focus:outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="blocked">Blocked</option>
            </select>
            <Link
              to="/loops/new"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
            >
              <Plus size={14} /> New loop
            </Link>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-subtle text-sm py-12">
            <Loader2 size={16} className="animate-spin" /> Loading loops…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button onClick={() => void refetch()} className="mt-2 text-xs text-red-600 underline">Retry</button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          sorted.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-edge rounded-xl">
              <Repeat2 size={28} className="mx-auto text-subtle mb-3" />
              <p className="text-sm text-subtle">No loops to show.</p>
              <Link to="/loops/new" className="mt-3 inline-block text-sm text-accent hover:underline">
                Create your first loop →
              </Link>
            </div>
          ) : (
            <div className="bg-card border border-edge rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-edge-subtle text-xs font-medium text-subtle uppercase tracking-wide">
                    <th className="text-left px-4 py-3">
                      <SortButton label="Title" sortKey="title" current={sortKey} dir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="text-left px-4 py-3">
                      <SortButton label="Status" sortKey="status" current={sortKey} dir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="text-left px-4 py-3 hidden sm:table-cell">
                      <SortButton label="Scope" sortKey="scope" current={sortKey} dir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      <SortButton label="Confidence" sortKey="confidence_index" current={sortKey} dir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="text-left px-4 py-3 hidden md:table-cell">
                      <SortButton label="IPL" sortKey="ipl_minutes" current={sortKey} dir={sortDir} onSort={handleSort} />
                    </th>
                    <th className="text-left px-4 py-3 hidden lg:table-cell">
                      <SortButton label="Updated" sortKey="updated_at" current={sortKey} dir={sortDir} onSort={handleSort} />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge-subtle">
                  {sorted.map(loop => (
                    <tr key={loop.id} className="hover:bg-hover transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/loops/${loop.id}`} className="font-medium text-primary hover:text-accent block truncate max-w-xs">
                          {loop.title}
                        </Link>
                        {loop.hypothesis && (
                          <p className="text-xs text-subtle truncate max-w-xs">{loop.hypothesis}</p>
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
                      <td className="px-4 py-3 text-subtle text-xs hidden lg:table-cell">
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
