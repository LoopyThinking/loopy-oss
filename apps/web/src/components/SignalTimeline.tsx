import type { WorkSignal, CognitiveLayer } from '../lib/api'

const LAYER_CONFIG: Record<CognitiveLayer, { label: string; color: string; dot: string }> = {
  perception:     { label: 'Perception',     color: 'bg-sky-50 border-sky-200 text-sky-900',        dot: 'bg-sky-400' },
  interpretation: { label: 'Interpretation', color: 'bg-violet-50 border-violet-200 text-violet-900', dot: 'bg-violet-400' },
  decision:       { label: 'Decision',       color: 'bg-amber-50 border-amber-200 text-amber-900',   dot: 'bg-amber-400' },
  action:         { label: 'Action',         color: 'bg-emerald-50 border-emerald-200 text-emerald-900', dot: 'bg-emerald-400' },
  reflection:     { label: 'Reflection',     color: 'bg-rose-50 border-rose-200 text-rose-900',      dot: 'bg-rose-400' },
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

interface SignalTimelineProps {
  signals: WorkSignal[]
}

export function SignalTimeline({ signals }: SignalTimelineProps) {
  if (signals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-edge py-12 text-center text-subtle">
        <p className="text-sm">No signals yet.</p>
        <p className="mt-1 text-xs">Signals appear here as work is registered.</p>
      </div>
    )
  }

  return (
    <ol className="relative space-y-1">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-px bg-edge-subtle" aria-hidden />

      {signals.map((signal) => {
        const cfg = LAYER_CONFIG[signal.type]
        return (
          <li key={signal.id} className="relative flex gap-4 pl-8">
            {/* Dot */}
            <span
              className={`absolute left-0 top-3 h-[23px] w-[23px] rounded-full border-2 border-white flex items-center justify-center ${cfg.dot}`}
              aria-hidden
            />

            {/* Card */}
            <div className={`flex-1 rounded-lg border px-4 py-3 text-sm ${cfg.color}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-xs uppercase tracking-wide opacity-70">
                  {cfg.label}
                </span>
                <span className="text-xs opacity-50 shrink-0">{formatTime(signal.created_at)}</span>
              </div>
              <p className="leading-snug">{signal.content}</p>
              {signal.source === 'agent' && (
                <span className="mt-2 inline-block text-xs opacity-60 font-mono">
                  via agent
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
