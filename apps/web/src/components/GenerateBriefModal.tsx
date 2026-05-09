import { useState, useEffect } from 'react'
import { X, Loader2, FileDown, AlertTriangle, Check, Info } from 'lucide-react'
import { api, type LoopEligibility, type SponsorAttestation } from '../lib/api'

interface Props {
  loopId: string
  loopTitle: string
  onClose: () => void
}

export function GenerateBriefModal({ loopId, loopTitle, onClose }: Props) {
  const [eligibility, setEligibility] = useState<LoopEligibility | null>(null)
  const [attestation, setAttestation] = useState<SponsorAttestation | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [templateId, setTemplateId] = useState<'project_brief' | 'endoso_jefatura'>('project_brief')
  const [mode, setMode] = useState<'validated' | 'hypothesis'>('validated')
  const [contextText, setContextText] = useState('')

  useEffect(() => {
    Promise.all([
      api.loops.getEligibility(loopId),
      api.loops.getAttestation(loopId).catch(() => null),
    ])
      .then(([elig, att]) => {
        setEligibility(elig)
        setAttestation(att)
        // Default to the first eligible mode
        if (elig.validated_mode.eligible) {
          setMode('validated')
        } else if (elig.hypothesis_mode.eligible) {
          setMode('hypothesis')
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar elegibilidad'))
      .finally(() => setLoading(false))
  }, [loopId])

  async function handleGenerate() {
    setGenerating(true)
    setError(null)

    try {
      const { filename, blob } = await api.loops.generateBrief(loopId, {
        template_id: templateId,
        mode,
        context_text: contextText || undefined,
      })

      // Trigger download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar el brief')
    } finally {
      setGenerating(false)
    }
  }

  const validatedOk = eligibility?.validated_mode.eligible ?? false
  const hypothesisOk = eligibility?.hypothesis_mode.eligible ?? false
  const selectedModeOk = mode === 'validated' ? validatedOk : hypothesisOk

  // Hypothesis mode needs attestation
  const needsAttestation = mode === 'hypothesis' && !attestation

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-panel rounded-2xl border border-edge shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
          <h2 className="text-lg font-semibold text-primary">Generar Brief</h2>
          <button onClick={onClose} className="text-subtle hover:text-secondary transition p-1">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted">
              <Loader2 size={20} className="animate-spin" />
              Verificando elegibilidad...
            </div>
          ) : eligibility ? (
            <>
              {/* Loop info */}
              <div className="text-sm text-secondary">
                Loop: <span className="font-medium text-primary">{loopTitle}</span>
              </div>

              {/* Template selector */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Plantilla</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplateId('project_brief')}
                    className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                      templateId === 'project_brief'
                        ? 'border-accent bg-accent-light text-accent'
                        : 'border-edge text-secondary hover:bg-hover'
                    }`}
                  >
                    <div className="font-semibold">Project Brief</div>
                    <div className="text-xs text-subtle mt-0.5">Para TI o partner externo</div>
                  </button>
                  <button
                    type="button"
                    disabled
                    className="rounded-lg border border-edge px-4 py-3 text-left text-sm opacity-50 cursor-not-allowed"
                  >
                    <div className="font-semibold">Endoso de Jefatura</div>
                    <div className="text-xs text-subtle mt-0.5">Próximamente</div>
                  </button>
                </div>
              </div>

              {/* Mode selector */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Modo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!validatedOk}
                    onClick={() => setMode('validated')}
                    className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                      mode === 'validated'
                        ? 'border-accent bg-accent-light text-accent'
                        : validatedOk
                          ? 'border-edge text-secondary hover:bg-hover'
                          : 'border-edge text-subtle opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">Validado</span>
                      {validatedOk && <Check size={14} className="text-emerald-500" />}
                    </div>
                    <div className="text-xs text-subtle mt-0.5">Con evidencia medida</div>
                  </button>
                  <button
                    type="button"
                    disabled={!hypothesisOk}
                    onClick={() => setMode('hypothesis')}
                    className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                      mode === 'hypothesis'
                        ? 'border-accent bg-accent-light text-accent'
                        : hypothesisOk
                          ? 'border-edge text-secondary hover:bg-hover'
                          : 'border-edge text-subtle opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">Hipótesis</span>
                      {hypothesisOk && <Check size={14} className="text-emerald-500" />}
                    </div>
                    <div className="text-xs text-subtle mt-0.5">Con supuestos atestiguados</div>
                  </button>
                </div>

                {/* Show missing criteria for selected mode */}
                {!selectedModeOk && (
                  <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1.5">
                      Faltan requisitos para el modo {mode === 'validated' ? 'Validado' : 'Hipótesis'}:
                    </p>
                    <ul className="list-disc list-inside text-xs text-amber-700 space-y-0.5">
                      {(mode === 'validated' ? eligibility.validated_mode.missing : eligibility.hypothesis_mode.missing).map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Show available modes info */}
                {!validatedOk && !hypothesisOk && (
                  <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
                    El loop no cumple los criterios para ningún modo. Completa los requisitos listados arriba para habilitar la generación.
                  </div>
                )}
              </div>

              {/* Attestation needed warning */}
              {needsAttestation && hypothesisOk && mode === 'hypothesis' && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Atestación del sponsor requerida</p>
                    <p className="text-xs mt-0.5">
                      El modo Hipótesis requiere que el sponsor complete la atestación con los inputs del caso de negocio.
                      Completa el formulario de atestación en la página del loop antes de generar el brief.
                    </p>
                  </div>
                </div>
              )}

              {/* Context text */}
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Destinatario / contexto
                  <span className="ml-1 text-xs text-subtle font-normal">opcional</span>
                </label>
                <input
                  type="text"
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="Ej: Para revisión del equipo de TI"
                  className="w-full rounded-lg border border-edge px-3 py-2 text-sm
                             placeholder:text-subtle focus:outline-none focus:ring-2
                             focus:ring-accent/30 focus:border-accent transition"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              {/* Generate button */}
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={!selectedModeOk || generating || needsAttestation}
                className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white
                           hover:bg-accent-hover disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <FileDown size={16} />
                    Generar Brief
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="text-center py-8 text-red-600 text-sm">
              <AlertTriangle size={20} className="mx-auto mb-2" />
              {error ?? 'No se pudo cargar la información de elegibilidad.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
