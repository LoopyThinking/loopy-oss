import { Link } from 'react-router-dom'
import { ConfidenceBadge } from './ConfidenceBadge'
import { IPLBadge } from './IPLBadge'
import type { Loop } from '../lib/api'

const STATUS_STYLES: Record<string, string> = {
  open:    'bg-blue-50 text-blue-700 border-blue-100',
  closed:  'bg-slate-50 text-slate-500 border-slate-100',
  blocked: 'bg-red-50 text-red-700 border-red-100',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface LoopCardProps {
  loop: Loop
}

export function LoopCard({ loop }: LoopCardProps) {
  return (
    <Link
      to={`/loops/${loop.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm
                 hover:border-loopy-300 hover:shadow-md transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900 text-base leading-tight">
            {loop.title}
          </h3>
          {loop.hypothesis && (
            <p className="mt-1 text-sm text-slate-500 line-clamp-2 leading-snug">
              {loop.hypothesis}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <IPLBadge minutes={loop.ipl_minutes} size="sm" />
          <ConfidenceBadge value={loop.confidence_index} size="sm" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
        <span
          className={`rounded-full border px-2 py-0.5 font-medium capitalize ${STATUS_STYLES[loop.status]}`}
        >
          {loop.status}
        </span>
        <span className="capitalize">{loop.scope}</span>
        <span className="ml-auto">{timeAgo(loop.updated_at)}</span>
      </div>
    </Link>
  )
}
