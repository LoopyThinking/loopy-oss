import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Repeat2, CheckCircle2, TrendingUp, Clock, Bot,
  ArrowUpDown, ChevronUp, ChevronDown, Crown, Zap,
} from 'lucide-react'
import { Layout } from '../components/Layout'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import { IPLBadge } from '../components/IPLBadge'
import {
  api,
  type AdminOverview, type ActivityPoint, type AdminLoopsResponse, type AdminAgent,
} from '../lib/api'

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color?: string
}

function KpiCard({ icon, label, value, sub, color = 'indigo' }: KpiCardProps) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-green-50 text-green-600',
    amber:  'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
  }
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg ${colorMap[color] ?? colorMap.indigo}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// ── Sort helpers ──────────────────────────────────────────────────────────────

type SortField = 'confidence_index' | 'ipl_minutes' | 'signal_count' | 'created_at'
type SortDir   = 'asc' | 'desc'

// ── Admin page ────────────────────────────────────────────────────────────────

export function Admin() {
  const [overview,  setOverview]  = useState<AdminOverview | null>(null)
  const [activity,  setActivity]  = useState<ActivityPoint[]>([])
  const [loopsResp, setLoopsResp] = useState<AdminLoopsResponse | null>(null)
  const [agents,    setAgents]    = useState<AdminAgent[]>([])
  const [window_,   setWindow]    = useState<'7d' | '30d' | '90d'>('30d')
  const [sortField, setSortField] = useState<SortField>('confidence_index')
  const [sortDir,   setSortDir]   = useState<SortDir>('desc')
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.admin.overview(),
      api.admin.activity(window_),
      api.admin.loops({ limit: 100 }),
      api.admin.agents(),
    ])
      .then(([ov, act, loops, ags]) => {
        setOverview(ov)
        setActivity(act.data)
        setLoopsResp(loops)
        setAgents(ags)
        setError(null)
      })
      .catch(e => setError(e.message ?? 'Error cargando datos'))
      .finally(() => setLoading(false))
  }, [window_])

  // Re-fetch activity when window changes
  useEffect(() => {
    if (!loading) {
      api.admin.activity(window_).then(act => setActivity(act.data)).catch(() => {})
    }
  }, [window_])

  // Sorted loops (grouped by owner by default when sortField is default)
  const sortedLoops = loopsResp?.data
    ? [...loopsResp.data].sort((a, b) => {
        // Primary: group by owner name/email
        const aOwner = a.owner_name ?? a.owner_email ?? ''
        const bOwner = b.owner_name ?? b.owner_email ?? ''
        const ownerCmp = aOwner.localeCompare(bOwner)
        if (ownerCmp !== 0) return ownerCmp
        // Secondary: sort field
        const av = a[sortField as keyof typeof a] as number | string
        const bv = b[sortField as keyof typeof b] as number | string
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av
        }
        const as = String(av ?? '')
        const bs = String(bv ?? '')
        return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as)
      })
    : []

  // Derived stats
  const ownerLoopCounts = loopsResp?.data?.reduce<Record<string, { name: string; count: number; ipl: number }>>((acc, l) => {
    const key  = l.owner_email ?? 'unknown'
    const name = l.owner_name ?? l.owner_email?.split('@')[0] ?? key
    if (!acc[key]) acc[key] = { name, count: 0, ipl: 0 }
    if (l.status === 'open') acc[key].count++
    acc[key].ipl += l.ipl_minutes
    return acc
  }, {}) ?? {}

  const ownerEntries = Object.values(ownerLoopCounts).sort((a, b) => b.count - a.count)
  const topOwner     = ownerEntries[0] ?? null
  const topAgents    = [...agents].sort((a, b) => b.total_signals - a.total_signals).slice(0, 3)
  const iplByUser    = ownerEntries.sort((a, b) => b.ipl - a.ipl).slice(0, 5)

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={13} className="text-gray-300 ml-1" />
    return sortDir === 'desc'
      ? <ChevronDown size={13} className="text-indigo-500 ml-1" />
      : <ChevronUp size={13} className="text-indigo-500 ml-1" />
  }

  if (loading) {
    return (
      <Layout title="Panel ejecutivo" breadcrumbs={[{ label: 'Panel ejecutivo' }]}>
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
          Cargando datos…
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Panel ejecutivo" breadcrumbs={[{ label: 'Panel ejecutivo' }]}>
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-600 text-sm">
          {error}
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title="Panel ejecutivo"
      breadcrumbs={[{ label: 'Panel ejecutivo' }]}
    >
      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KpiCard
          icon={<Repeat2 size={18} />}
          label="Loops activos"
          value={overview?.active_loops ?? 0}
          sub={`${overview?.total_loops ?? 0} en total`}
          color="indigo"
        />
        <KpiCard
          icon={<CheckCircle2 size={18} />}
          label="Cerrados (30d)"
          value={overview?.closed_last_30d ?? 0}
          color="green"
        />
        <KpiCard
          icon={<TrendingUp size={18} />}
          label="Confidence promedio"
          value={`${overview?.avg_confidence ?? 0}`}
          sub="índice 0–100"
          color="amber"
        />
        <KpiCard
          icon={<Clock size={18} />}
          label="IPL acumulado"
          value={`${overview?.total_ipl_hours ?? 0}h`}
          sub="horas liberadas por agentes"
          color="violet"
        />
        <KpiCard
          icon={<Crown size={18} />}
          label="Top owner"
          value={topOwner?.name ?? '—'}
          sub={topOwner ? `${topOwner.count} loops activos` : 'Sin datos'}
          color="indigo"
        />
      </div>

      {/* ── Activity chart ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800">Señales por día</h2>
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as const).map(w => (
              <button
                key={w}
                onClick={() => setWindow(w)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                  window_ === w
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={activity} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickFormatter={(d: string) => {
                const [, m, day] = d.split('-')
                return `${day}/${m}`
              }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              labelFormatter={(d: string) => `Fecha: ${d}`}
              formatter={(v: number) => [v, 'señales']}
            />
            <Area
              type="monotone"
              dataKey="signal_count"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#grad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Loops table ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl mb-8 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Loops</h2>
          <span className="text-xs text-gray-400">{loopsResp?.total ?? 0} en total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Título
                </th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Estado
                </th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Propietario
                </th>
                <th
                  className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => toggleSort('confidence_index')}
                >
                  <span className="flex items-center">Confidence <SortIcon field="confidence_index" /></span>
                </th>
                <th
                  className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => toggleSort('ipl_minutes')}
                >
                  <span className="flex items-center">IPL <SortIcon field="ipl_minutes" /></span>
                </th>
                <th
                  className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => toggleSort('signal_count')}
                >
                  <span className="flex items-center">Señales <SortIcon field="signal_count" /></span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedLoops.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">
                    No hay loops en esta organización
                  </td>
                </tr>
              )}
              {sortedLoops.map((loop, idx) => {
                const owner     = loop.owner_name ?? loop.owner_email?.split('@')[0] ?? '—'
                const prevOwner = idx > 0
                  ? (sortedLoops[idx - 1].owner_name ?? sortedLoops[idx - 1].owner_email?.split('@')[0])
                  : null
                const showOwnerHeader = owner !== prevOwner
                return (
                  <>
                    {showOwnerHeader && (
                      <tr key={`owner-${owner}-${idx}`} className="bg-gray-50">
                        <td colSpan={6} className="px-5 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          {owner}
                        </td>
                      </tr>
                    )}
                    <tr key={loop.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 max-w-xs">
                        <p className="font-medium text-gray-800 truncate">{loop.title}</p>
                        <p className="text-xs text-gray-400">{loop.scope}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          loop.status === 'open'   ? 'bg-green-50 text-green-700'  :
                          loop.status === 'closed' ? 'bg-gray-100 text-gray-600'   :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {loop.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">
                        {loop.owner_name ?? loop.owner_email?.split('@')[0]}
                      </td>
                      <td className="px-3 py-3">
                        <ConfidenceBadge value={loop.confidence_index} />
                      </td>
                      <td className="px-3 py-3">
                        <IPLBadge minutes={loop.ipl_minutes} />
                      </td>
                      <td className="px-3 py-3 text-gray-500 text-xs">
                        {(loop as any).signal_count ?? 0}
                      </td>
                    </tr>
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Two-column row: IPL por usuario + Agentes más activos ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* IPL por usuario */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={15} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-800">IPL por usuario</h2>
            <span className="text-xs text-gray-400 ml-auto">top 5</span>
          </div>
          {iplByUser.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {iplByUser.map(u => {
                const maxIpl = iplByUser[0]?.ipl ?? 1
                const pct    = Math.round((u.ipl / maxIpl) * 100)
                return (
                  <div key={u.name}>
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-gray-700 font-medium truncate max-w-[140px]">{u.name}</span>
                      <span className="text-gray-400 ml-2">{(u.ipl / 60).toFixed(1)}h</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Agentes más activos */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={15} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-800">Agentes más activos</h2>
            <span className="text-xs text-gray-400 ml-auto">top 3</span>
          </div>
          {topAgents.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">Sin agentes</p>
          ) : (
            <div className="space-y-3">
              {topAgents.map((ag, i) => (
                <div key={ag.id} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-300 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{ag.agent_name}</p>
                    <p className="text-xs text-gray-400">{ag.owner_name ?? ag.owner_email?.split('@')[0]}</p>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{ag.total_signals} señales</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Agents table ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <Bot size={15} className="text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-800">Agentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Agente</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Propietario</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Estado</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Señales</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Última actividad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                    No hay agentes registrados
                  </td>
                </tr>
              )}
              {agents.map(agent => (
                <tr key={agent.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{agent.agent_name}</p>
                    {agent.description && (
                      <p className="text-xs text-gray-400 truncate max-w-xs">{agent.description}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">
                    {agent.owner_name ?? agent.owner_email?.split('@')[0]}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      agent.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {agent.is_active ? 'activo' : 'inactivo'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500">{agent.total_signals}</td>
                  <td className="px-3 py-3 text-xs text-gray-400">
                    {agent.last_seen_at
                      ? new Date(agent.last_seen_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
