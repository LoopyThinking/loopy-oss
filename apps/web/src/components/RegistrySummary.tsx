import { Bot, Puzzle, Wrench, Workflow } from 'lucide-react'

export interface RegistrySummaryProps {
  data: {
    total: number
    by_type: { agent: number; skill: number; tool: number; workflow: number }
    active_users: number
    org_name: string
  } | null
  loading: boolean
}

const TYPE_CARDS = [
  { key: 'agent' as const,    icon: Bot,     label: 'Agents',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'skill' as const,    icon: Puzzle,  label: 'Skills',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'tool' as const,     icon: Wrench,  label: 'Tools',    color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'workflow' as const, icon: Workflow, label: 'Workflows',  color: 'bg-purple-50 text-purple-700 border-purple-200' },
]

export function RegistrySummary({ data, loading }: RegistrySummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl border border-edge bg-card p-4 animate-pulse">
            <div className="h-3 w-16 bg-elevated rounded mb-2" />
            <div className="h-7 w-10 bg-elevated rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {TYPE_CARDS.map(({ key, icon: Icon, label, color }) => (
          <div key={key} className={`rounded-xl border ${color} p-4 flex items-center gap-3`}>
            <div className="shrink-0">
              <Icon size={22} />
            </div>
            <div>
              <p className="text-xs font-medium opacity-80">{label}</p>
              <p className="text-2xl font-bold">{data.by_type[key]}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted mb-6">
        <span>{data.total} entries total</span>
        <span className="w-1 h-1 rounded-full bg-edge-subtle" />
        <span>{data.active_users} active user{data.active_users !== 1 ? 's' : ''}</span>
        <span className="w-1 h-1 rounded-full bg-edge-subtle" />
        <span className="font-medium text-secondary">{data.org_name}</span>
      </div>
    </div>
  )
}
