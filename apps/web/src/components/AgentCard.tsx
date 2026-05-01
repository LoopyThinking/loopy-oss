import { Link } from 'react-router-dom'

export interface AgentCardEntry {
  id: string
  agent_key: string
  type: string
  name: string
  role: string | null
  emoji: string | null
  parent_key: string | null
  status: string
  created_at: string
  last_seen_at: string | null
  registered_by_name: string | null
  children_count: number
}

const TYPE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  agent:    { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'agent' },
  skill:    { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'skill' },
  tool:     { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'tool' },
  workflow: { bg: 'bg-purple-50',  text: 'text-purple-700',  label: 'flujo' },
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function AgentCard({ entry }: { entry: AgentCardEntry }) {
  const badge = TYPE_BADGES[entry.type] ?? TYPE_BADGES.agent

  return (
    <Link
      to={`/registry/${encodeURIComponent(entry.agent_key)}`}
      className="flex items-center gap-3 px-4 py-3 bg-card rounded-xl border border-edge hover:border-indigo-200 hover:shadow-sm transition-all"
    >
      {/* Emoji */}
      <span className="shrink-0 text-lg w-7 text-center">
        {entry.emoji ?? '⚙️'}
      </span>

      {/* Name + role */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary truncate">{entry.name}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
          {entry.status !== 'active' && (
            <span className="text-[10px] text-subtle bg-elevated px-1.5 py-0.5 rounded-full">
              {entry.status}
            </span>
          )}
        </div>
        {entry.role && (
          <p className="text-xs text-muted truncate mt-0.5">{entry.role}</p>
        )}
      </div>

      {/* Sub-count + registered by + last seen */}
      <div className="hidden sm:flex items-center gap-3 shrink-0">
        {entry.children_count > 0 && (
          <span className="text-xs text-subtle bg-surface border border-edge rounded px-2 py-0.5">
            {entry.children_count} sub
          </span>
        )}
        <div className="text-right">
          <p className="text-xs text-subtle">{entry.registered_by_name ?? '—'}</p>
          <p className="text-[10px] text-subtle">{timeAgo(entry.last_seen_at)}</p>
        </div>
      </div>
    </Link>
  )
}
