/**
 * IPLBadge — displays the Índice de Productividad Liberada for a loop.
 *
 * Shows the agent-equivalent minutes (or hours when ≥ 60) accumulated in
 * a loop. Includes a tooltip linking to /framework#ipl for context.
 */

interface IPLBadgeProps {
  minutes: number
  size?: 'sm' | 'md' | 'lg'
  /** Show the tooltip (default: true) */
  tooltip?: boolean
}

function formatIpl(minutes: number): { value: string; unit: string } {
  if (minutes === 0) return { value: '0', unit: 'min' }
  if (minutes < 60) return { value: String(minutes), unit: 'min' }
  const hours = (minutes / 60).toFixed(1)
  return { value: hours, unit: 'h' }
}

export function IPLBadge({ minutes, size = 'md', tooltip = true }: IPLBadgeProps) {
  const { value, unit } = formatIpl(minutes)

  const sizeClass =
    size === 'sm'
      ? 'text-xs px-2 py-0.5'
      : size === 'lg'
        ? 'text-base px-4 py-1.5'
        : 'text-sm px-3 py-1'

  const colorClass =
    minutes === 0
      ? 'bg-slate-50 text-slate-400 border-slate-200'
      : minutes < 30
        ? 'bg-violet-50 text-violet-600 border-violet-200'
        : minutes < 120
          ? 'bg-violet-100 text-violet-700 border-violet-300'
          : 'bg-violet-200 text-violet-900 border-violet-400'

  const badge = (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${colorClass} ${sizeClass}`}
      aria-label={`IPL: ${value}${unit} agent-liberated productivity`}
    >
      {/* Lightning bolt icon — small inline SVG to avoid adding a dep */}
      <svg
        className="shrink-0"
        width={size === 'lg' ? 14 : 11}
        height={size === 'lg' ? 14 : 11}
        viewBox="0 0 12 12"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M7 1 L2 7 H5.5 L5 11 L10 5 H6.5 Z" />
      </svg>
      <span className="font-mono font-semibold">{value}</span>
      <span className="opacity-70">{unit}</span>
    </span>
  )

  if (!tooltip) return badge

  return (
    <span className="relative group inline-flex">
      {badge}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20
                   w-52 rounded-lg bg-elevated px-3 py-2 text-xs text-primary shadow-lg border border-edge
                   opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        role="tooltip"
      >
        <strong className="block font-semibold mb-0.5">IPL · Liberated Productivity</strong>
        Estimated human-minutes executed by agents in this loop.{' '}
        <a
          href="/framework#ipl"
          className="underline text-violet-300 hover:text-violet-200 pointer-events-auto"
          tabIndex={-1}
        >
          Learn more →
        </a>
      </span>
    </span>
  )
}
