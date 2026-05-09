import { useState, useEffect } from 'react'
import { api, type SponsorAttestation } from '../lib/api'
import { Loader2, Check, AlertTriangle, Plus, X } from 'lucide-react'

interface Props {
  loopId: string
  isOwner: boolean
  currentUserId: string | null
  onAttestationSaved?: () => void
}

export function SponsorAttestationForm({ loopId, isOwner, onAttestationSaved }: Props) {
  const [existing, setExisting] = useState<SponsorAttestation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form fields
  const [frequency, setFrequency] = useState('')
  const [duration, setDuration] = useState('')
  const [people, setPeople] = useState('')
  const [adoption, setAdoption] = useState('')
  const [assumptions, setAssumptions] = useState<string[]>(['', '', ''])
  const [comment, setComment] = useState('')

  useEffect(() => {
    api.loops.getAttestation(loopId)
      .then((att) => {
        setExisting(att)
        setFrequency(String(att.frequency_per_month))
        setDuration(String(att.avg_duration_minutes))
        setPeople(String(att.people_count))
        setAdoption(String(att.adoption_rate_pct))
        setAssumptions(att.critical_assumptions?.length >= 3 ? att.critical_assumptions : [...att.critical_assumptions ?? [], '', '', ''].slice(0, Math.max(3, (att.critical_assumptions?.length ?? 0) + 1)))
        setComment(att.comment ?? '')
      })
      .catch(() => { /* no attestation yet */ })
      .finally(() => setLoading(false))
  }, [loopId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const validAssumptions = assumptions.filter((a) => a.trim().length > 0)

    if (validAssumptions.length < 3) {
      setError('Se requieren al menos 3 supuestos críticos articulados.')
      setSaving(false)
      return
    }

    try {
      await api.loops.saveAttestation(loopId, {
        frequency_per_month: parseInt(frequency, 10),
        avg_duration_minutes: parseInt(duration, 10),
        people_count: parseInt(people, 10),
        adoption_rate_pct: parseInt(adoption, 10),
        critical_assumptions: validAssumptions,
        comment: comment || undefined,
      })
      setSuccess(true)
      onAttestationSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la atestación')
    } finally {
      setSaving(false)
    }
  }

  function updateAssumption(index: number, value: string) {
    const next = [...assumptions]
    next[index] = value
    // Auto-add empty slot if all are filled
    if (index === next.length - 1 && value.trim() && next.length < 10) {
      next.push('')
    }
    setAssumptions(next)
  }

  function removeAssumption(index: number) {
    if (assumptions.length <= 3) return
    setAssumptions(assumptions.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted py-4">
        <Loader2 size={14} className="animate-spin" />
        Cargando atestación...
      </div>
    )
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {existing && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-xs text-blue-700">
          Ya existe una atestación para este loop (del {new Date(existing.updated_at).toLocaleDateString('es-CL')}). Al guardar se actualizará.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Frecuencia mensual
          </label>
          <input
            type="number"
            min={1}
            required
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            placeholder="Ej: 20"
            className="w-full rounded-lg border border-edge px-3 py-2 text-sm
                       placeholder:text-subtle focus:outline-none focus:ring-2
                       focus:ring-accent/30 focus:border-accent transition"
          />
          <p className="text-xs text-subtle mt-0.5">Veces al mes que se ejecuta el proceso</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Duración promedio (min)
          </label>
          <input
            type="number"
            min={1}
            required
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Ej: 45"
            className="w-full rounded-lg border border-edge px-3 py-2 text-sm
                       placeholder:text-subtle focus:outline-none focus:ring-2
                       focus:ring-accent/30 focus:border-accent transition"
          />
          <p className="text-xs text-subtle mt-0.5">Minutos por cada ejecución</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Personas que ejecutan
          </label>
          <input
            type="number"
            min={1}
            required
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            placeholder="Ej: 3"
            className="w-full rounded-lg border border-edge px-3 py-2 text-sm
                       placeholder:text-subtle focus:outline-none focus:ring-2
                       focus:ring-accent/30 focus:border-accent transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">
            Tasa de adopción esperada (%)
          </label>
          <input
            type="number"
            min={1}
            max={100}
            required
            value={adoption}
            onChange={(e) => setAdoption(e.target.value)}
            placeholder="Ej: 80"
            className="w-full rounded-lg border border-edge px-3 py-2 text-sm
                       placeholder:text-subtle focus:outline-none focus:ring-2
                       focus:ring-accent/30 focus:border-accent transition"
          />
          <p className="text-xs text-subtle mt-0.5">% de adopción esperada post-integración</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Supuestos críticos a validar
          <span className="ml-1 text-xs text-subtle font-normal">(mínimo 3)</span>
        </label>
        <div className="space-y-2">
          {assumptions.map((a, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-xs text-subtle pt-2.5 w-5 text-right shrink-0">{i + 1}.</span>
              <input
                type="text"
                value={a}
                onChange={(e) => updateAssumption(i, e.target.value)}
                placeholder={i < 3 ? `Supuesto crítico ${i + 1}` : `Supuesto adicional (opcional)`}
                className="flex-1 rounded-lg border border-edge px-3 py-2 text-sm
                           placeholder:text-subtle focus:outline-none focus:ring-2
                           focus:ring-accent/30 focus:border-accent transition"
              />
              {assumptions.length > 3 && (
                <button
                  type="button"
                  onClick={() => removeAssumption(i)}
                  className="text-subtle hover:text-red-500 transition p-2"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-subtle mt-1.5">
          Articula explícitamente qué asume este caso (ej. "asumimos que con acceso a CRM se elimina el paso de exportación manual semanal de 4 horas").
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-1">
          Comentario
          <span className="ml-1 text-xs text-subtle font-normal">opcional</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Contexto adicional sobre el proceso o la atestación..."
          rows={3}
          className="w-full rounded-lg border border-edge px-3 py-2 text-sm
                     placeholder:text-subtle focus:outline-none focus:ring-2
                     focus:ring-accent/30 focus:border-accent transition resize-none"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700">
          <Check size={16} />
          Atestación guardada correctamente.
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white
                   hover:bg-accent-hover disabled:opacity-50 transition flex items-center justify-center gap-2"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        {saving ? 'Guardando...' : existing ? 'Actualizar atestación' : 'Completar atestación'}
      </button>
    </form>
  )
}
