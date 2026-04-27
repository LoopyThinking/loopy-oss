interface ConfidenceBadgeProps {
  value: number  // 0–100
  size?: 'sm' | 'md' | 'lg'
}

function getColor(value: number): string {
  if (value >= 75) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (value >= 40) return 'bg-amber-100 text-amber-800 border-amber-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

function getLabel(value: number): string {
  if (value >= 75) return 'High'
  if (value >= 40) return 'Building'
  return 'Low'
}

export function ConfidenceBadge({ value, size = 'md' }: ConfidenceBadgeProps) {
  const color = getColor(value)
  const label = getLabel(value)
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-base px-4 py-1.5' : 'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${color} ${sizeClass}`}>
      <span className="font-mono font-semibold">{value}</span>
      <span className="opacity-70">{label}</span>
    </span>
  )
}
