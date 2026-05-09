import type { Loop, WorkSignal, SponsorAttestation } from '../types.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

const LAYER_LABELS: Record<string, string> = {
  perception: 'Percepción',
  interpretation: 'Interpretación',
  decision: 'Decisión',
  action: 'Acción',
  reflection: 'Reflexión',
}

const SCOPE_LABELS: Record<string, string> = {
  personal: 'Personal',
  team: 'Equipo',
  organizational: 'Organización',
}

function fmtMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = (minutes / 60).toFixed(1)
  return `${hours} h`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

// ── Section generators (mode-aware) ──────────────────────────────────────────

export function generateContextSection(loop: Loop, signals: WorkSignal[]): string {
  const layerLabel = loop.cognitive_layer ? LAYER_LABELS[loop.cognitive_layer] ?? loop.cognitive_layer : 'No asignada'
  const scopeLabel = SCOPE_LABELS[loop.scope] ?? loop.scope

  return [
    `Este loop cubre el proceso de <strong>${escapeHtml(loop.title)}</strong>,`,
    `operando en la capa cognitiva de <strong>${layerLabel}</strong>`,
    `con alcance <strong>${scopeLabel}</strong>.`,
    loop.hypothesis
      ? `</p><p>${escapeHtml(loop.hypothesis)}`
      : '',
    `</p><p>El loop ha acumulado <strong>${signals.length} señales de trabajo</strong>`,
    `desde su creación el ${fmtDate(loop.created_at)}.`,
  ].join(' ')
}

export function generateEvidenceSection(
  loop: Loop,
  signals: WorkSignal[],
  mode: 'validated' | 'hypothesis',
  attestation?: SponsorAttestation | null
): string {
  if (mode === 'validated') {
    // Realizado = medido desde signals
    const monthlyIpl = Math.round(loop.ipl_minutes / 12)
    const signalTypes = new Set(signals.map((s) => s.type))
    const agentSignals = signals.filter((s) => s.source === 'agent')

    return [
      `<li><strong>IPL Realizado acumulado:</strong> ${fmtMinutes(loop.ipl_minutes)} <em>(medido)</em></li>`,
      `<li><strong>IPL Realizado mensual estimado:</strong> ${fmtMinutes(monthlyIpl)} <em>(proyectado lineal)</em></li>`,
      `<li><strong>Total de ejecuciones:</strong> ${signals.length} señales</li>`,
      `<li><strong>Señales de agente:</strong> ${agentSignals.length} <em>(fuentes de datos conectadas)</em></li>`,
      `<li><strong>Capas cognitivas activas:</strong> ${[...signalTypes].map((t) => LAYER_LABELS[t] ?? t).join(', ')}</li>`,
      `<li><strong>Índice de confianza:</strong> ${loop.confidence_index}/100</li>`,
    ].join('')
  }

  // Modo hipótesis: cifras desde atestación
  if (!attestation) return '<li>Atestación del sponsor no disponible.</li>'

  const projectedMonthly = Math.round(loop.ipl_projected_minutes / 12)

  return [
    `<li><strong>IPL Proyectado anual:</strong> ${fmtMinutes(loop.ipl_projected_minutes)} <em>(estimado desde inputs del sponsor)</em></li>`,
    `<li><strong>IPL Proyectado mensual:</strong> ${fmtMinutes(projectedMonthly)} <em>(estimado)</em></li>`,
    `<li><strong>IPL Realizado actual:</strong> ${fmtMinutes(loop.ipl_minutes)} <em>(medido)</em></li>`,
    `<li><strong>Frecuencia mensual del proceso:</strong> ${attestation.frequency_per_month} ejecuciones <em>(atestiguado por sponsor)</em></li>`,
    `<li><strong>Duración por ejecución:</strong> ${attestation.avg_duration_minutes} minutos <em>(atestiguado por sponsor)</em></li>`,
    `<li><strong>Personas que ejecutan:</strong> ${attestation.people_count} <em>(atestiguado por sponsor)</em></li>`,
    `<li><strong>Tasa de adopción esperada:</strong> ${attestation.adoption_rate_pct}% <em>(atestiguado por sponsor)</em></li>`,
    `<li><strong>Total de señales:</strong> ${signals.length}</li>`,
  ].join('')
}

export function generateCurrentStateSection(signals: WorkSignal[]): string {
  const layerBreakdown = new Map<string, number>()
  const sourceBreakdown = new Map<string, number>()

  for (const s of signals) {
    layerBreakdown.set(s.type, (layerBreakdown.get(s.type) ?? 0) + 1)
    sourceBreakdown.set(s.source, (sourceBreakdown.get(s.source) ?? 0) + 1)
  }

  const humanCount = sourceBreakdown.get('human') ?? 0
  const agentCount = sourceBreakdown.get('agent') ?? 0

  const layerList = [...layerBreakdown.entries()]
    .map(([type, count]) => `${LAYER_LABELS[type] ?? type}: ${count} señales`)
    .join(', ')

  return [
    `El loop ha procesado <strong>${signals.length} señales</strong> en total.`,
    `De ellas, <strong>${agentCount}</strong> provienen de agentes de IA`,
    `y <strong>${humanCount}</strong> de intervención humana directa.`,
    layerList ? `</p><p>Distribución por capa cognitiva: ${layerList}.` : '',
    agentCount > 0
      ? `</p><p>Los agentes ya están cubriendo parte del ciclo — las fuentes conectadas están activas y generando señales.`
      : `</p><p>Actualmente no hay fuentes de datos automatizadas conectadas — el loop depende de intervención humana.`,
  ].join(' ')
}

export function generateOpportunitySection(
  loop: Loop,
  mode: 'validated' | 'hypothesis'
): string {
  const realizedHours = (loop.ipl_minutes / 60).toFixed(1)
  const projectedHours = (loop.ipl_projected_minutes / 60).toFixed(1)

  if (mode === 'validated') {
    const delta = loop.ipl_projected_minutes - loop.ipl_minutes
    const deltaHours = (delta / 60).toFixed(1)

    return [
      `Actualmente el loop libera <strong>${realizedHours} horas</strong> de trabajo humano equivalente al año`,
      `con apoyo parcial de IA.`,
      (loop.ipl_projected_minutes > loop.ipl_minutes
        ? ` Con una integracion nativa completa, se proyecta liberar <strong>${projectedHours} horas/año</strong>`
        : ''),
      (loop.ipl_projected_minutes > loop.ipl_minutes
        ? ` — un delta de <strong>${deltaHours} horas/año</strong> adicionales.`
        : ''),
      `</p><p>Formalizar este loop como integración nativa permitiría eliminar los pasos manuales restantes,`,
      `reducir la fricción operacional y mejorar la calidad y consistencia del proceso.`,
    ].join(' ')
  }

  // Modo hipótesis
  return [
    `Se estima que este proceso consume actualmente tiempo de <strong>${loop.ipl_projected_minutes > 0 ? fmtMinutes(loop.ipl_projected_minutes) : '...'}</strong>`,
    `al año en trabajo manual.`,
    `</p><p>Con una integración que conecte las fuentes necesarias y automatice los pasos del loop,`,
    `se proyecta liberar la mayor parte de ese tiempo —`,
    `el delta exacto dependerá de la validación operacional de los supuestos.`,
    `</p><p>La reducción de fricción esperada es sustancial:`,
    `eliminación de pasos manuales repetitivos, reducción de errores por fatiga,`,
    `y aumento de la velocidad de respuesta del proceso.`,
  ].join(' ')
}

export function generateSensitivitySection(): string {
  // Heuristic classification for MVP — static template
  return [
    `<li><strong>Datos involucrados:</strong> Internos operacionales — no contienen PII ni datos regulados en su forma actual.</li>`,
    `<li><strong>Sistemas a integrar:</strong> A determinar según el alcance del proyecto.</li>`,
    `<li><strong>Dependencias externas:</strong> Ninguna identificada en esta etapa.</li>`,
    `<li><strong>Riesgo de implementación:</strong> Bajo-medio — proyecto acotado a un proceso específico.</li>`,
  ].join('')
}

export function generateNextStepsSection(mode: 'validated' | 'hypothesis'): string {
  if (mode === 'validated') {
    return [
      `<li>Revisar la evidencia cuantitativa con el equipo de TI para validar las cifras de IPL.</li>`,
      `<li>Identificar los puntos de integración técnica necesarios para automatizar los pasos manuales restantes.</li>`,
      `<li>Evaluar el esfuerzo de implementación y preparar un business case formal si el retorno lo justifica.</li>`,
    ].join('')
  }

  return [
    `<li>Validar cada supuesto crítico articulado en este brief — empezar por el de mayor impacto en el IPL proyectado.</li>`,
    `<li>Realizar una prueba de concepto acotada para medir el tiempo real del proceso con datos preliminares.</li>`,
    `<li>Si los supuestos se validan, mover el loop a modo Validado y generar un brief con evidencia medida para TI.</li>`,
  ].join('')
}

export function generateCriticalAssumptionsSection(assumptions: string[]): string {
  if (!assumptions || assumptions.length === 0) {
    return '<li>No se han articulado supuestos críticos todavía.</li>'
  }
  return assumptions
    .map((a, i) => `<li><strong>Supuesto ${i + 1}:</strong> ${escapeHtml(a)}</li>`)
    .join('')
}

// ── Utility ──────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
