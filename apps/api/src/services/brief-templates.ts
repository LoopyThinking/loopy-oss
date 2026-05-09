import type { Loop, WorkSignal, SponsorAttestation } from '../types.js'
import {
  generateContextSection,
  generateEvidenceSection,
  generateCurrentStateSection,
  generateOpportunitySection,
  generateSensitivitySection,
  generateNextStepsSection,
  generateCriticalAssumptionsSection,
} from './brief-narrative.js'

export type BriefTemplateId = 'project_brief' | 'endoso_jefatura'
export type BriefMode = 'validated' | 'hypothesis'

export interface BriefData {
  loop: Loop
  signals: WorkSignal[]
  attestation: SponsorAttestation | null
  mode: BriefMode
  contextText?: string
}

// ── CSS (inline for PDF rendering) ───────────────────────────────────────────

const PDF_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #1a1a2e;
    padding: 40px 50px;
  }
  .header { margin-bottom: 32px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
  .header h1 { font-size: 20pt; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
  .header .meta { font-size: 9pt; color: #64748b; }
  .badge {
    display: inline-block; padding: 4px 12px; border-radius: 100px;
    font-size: 9pt; font-weight: 600; margin-top: 10px;
  }
  .badge-validated { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
  .badge-hypothesis { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .badge-estimated { background: #f1f5f9; color: #475569; font-weight: 400; }
  .badge-measured { background: #ecfdf5; color: #065f46; font-weight: 400; }
  .badge-attested { background: #eef2ff; color: #4338ca; font-weight: 400; }
  .watermark {
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg);
    font-size: 60pt; color: rgba(251, 191, 36, 0.08); font-weight: 900;
    pointer-events: none; z-index: -1; white-space: nowrap;
  }
  .section { margin-bottom: 24px; page-break-inside: avoid; }
  .section h2 {
    font-size: 13pt; font-weight: 600; color: #334155;
    border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px;
  }
  .section p, .section li { color: #334155; margin-bottom: 6px; }
  .section ul { padding-left: 20px; }
  .section li { margin-bottom: 4px; }
  .signature-box {
    margin-top: 40px; padding: 20px; border: 1px dashed #cbd5e1; border-radius: 8px;
  }
  .signature-box h2 { border-bottom: none; margin-bottom: 16px; }
  .sig-field { margin-bottom: 14px; }
  .sig-field label { font-size: 9pt; color: #64748b; display: block; margin-bottom: 4px; }
  .sig-field .line { border-bottom: 1px solid #94a3b8; height: 24px; }
  .footer {
    position: fixed; bottom: 30px; left: 50px; right: 50px;
    font-size: 8pt; color: #94a3b8;
    border-top: 1px solid #e2e8f0; padding-top: 8px;
    display: flex; justify-content: space-between;
  }
  .page-break { page-break-before: always; }
`

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function buildHeader(data: BriefData): string {
  const { loop, mode } = data
  const badgeClass = mode === 'validated' ? 'badge-validated' : 'badge-hypothesis'
  const badgeLabel = mode === 'validated' ? 'Brief Validado' : 'Brief de Hipótesis — pendiente de validación operacional'
  const watermark = mode === 'hypothesis'
    ? '<div class="watermark">HIPÓTESIS</div>'
    : ''

  return `
    ${watermark}
    <div class="header">
      <h1>${escapeHtml(loop.title)}</h1>
      <div class="meta">
        Generado el ${fmtDate(new Date().toISOString())} &middot;
        Loop creado el ${fmtDate(loop.created_at)} &middot;
        Snapshot al ${fmtDate(new Date().toISOString())}
      </div>
      <div class="badge ${badgeClass}">${badgeLabel}</div>
    </div>`
}

// ── Project Brief template ────────────────────────────────────────────────────

export function buildProjectBriefHtml(data: BriefData): string {
  const { loop, signals, attestation, mode, contextText } = data

  const contextHtml = generateContextSection(loop, signals)
  const evidenceHtml = generateEvidenceSection(loop, signals, mode, attestation)
  const stateHtml = generateCurrentStateSection(signals)
  const opportunityHtml = generateOpportunitySection(loop, mode)
  const sensitivityHtml = generateSensitivitySection()
  const nextStepsHtml = generateNextStepsSection(mode)

  const hypothesisSections = mode === 'hypothesis' && attestation
    ? `
    <div class="section">
      <h2>Supuestos críticos a validar</h2>
      <p>El siguiente caso de negocio se sostiene sobre los supuestos articulados abajo. Cada supuesto debe refutarse o validarse antes de comprometer recursos de implementación.</p>
      <ul>${generateCriticalAssumptionsSection(attestation.critical_assumptions)}</ul>
    </div>`
    : ''

  const contextNote = contextText
    ? `<div class="section"><h2>Nota de contexto</h2><p>${escapeHtml(contextText)}</p></div>`
    : ''

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Project Brief — ${escapeHtml(loop.title)}</title><style>${PDF_CSS}</style></head>
<body>
  ${buildHeader(data)}
  ${contextNote}
  <div class="section">
    <h2>Contexto operativo</h2>
    <p>${contextHtml}</p>
  </div>
  <div class="section">
    <h2>Evidencia cuantitativa</h2>
    <ul>${evidenceHtml}</ul>
  </div>
  <div class="section">
    <h2>Estado actual</h2>
    <p>${stateHtml}</p>
  </div>
  <div class="section">
    <h2>Oportunidad de formalización</h2>
    <p>${opportunityHtml}</p>
  </div>
  ${hypothesisSections}
  <div class="section">
    <h2>Evaluación preliminar de sensibilidad</h2>
    <ul>${sensitivityHtml}</ul>
  </div>
  <div class="section">
    <h2>Próximos pasos sugeridos</h2>
    <ol>${nextStepsHtml}</ol>
  </div>
  <div class="footer">
    <span>Loopy OSS — Generador de Briefs v1.0</span>
    <span>Snapshot al ${fmtDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`
}

// ── Endoso de Jefatura template ──────────────────────────────────────────────

export function buildEndosoJefaturaHtml(data: BriefData): string {
  const { loop, signals, attestation, mode } = data

  const evidenceHtml = generateEvidenceSection(loop, signals, mode, attestation)

  const impactSummary = loop.ipl_projected_minutes > loop.ipl_minutes
    ? `Actualmente libera ${(loop.ipl_minutes / 60).toFixed(1)} horas/año con apoyo de IA. Con integración nativa completa, se proyecta liberar ${(loop.ipl_projected_minutes / 60).toFixed(1)} horas/año.`
    : `Actualmente libera ${(loop.ipl_minutes / 60).toFixed(1)} horas/año con apoyo de IA.`

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Endoso de Jefatura — ${escapeHtml(loop.title)}</title><style>${PDF_CSS}</style></head>
<body>
  ${buildHeader(data)}
  <div class="section">
    <h2>Resumen ejecutivo</h2>
    <p><strong>Loop:</strong> ${escapeHtml(loop.title)}</p>
    <p><strong>Impacto:</strong> ${impactSummary}</p>
    <p><strong>Qué se solicita:</strong> Revisión y endoso del jefe directo para escalar este caso a TI o al equipo de proyectos para su evaluación formal.</p>
  </div>
  <div class="section">
    <h2>Evidencia clave</h2>
    <ul>${evidenceHtml}</ul>
  </div>
  <div class="signature-box">
    <h2>Endoso de jefatura</h2>
    <div class="sig-field">
      <label>Nombre del jefe directo</label>
      <div class="line"></div>
    </div>
    <div class="sig-field">
      <label>Fecha</label>
      <div class="line"></div>
    </div>
    <div class="sig-field">
      <label>Comentarios</label>
      <div class="line" style="height: 48px;"></div>
    </div>
    <div class="sig-field">
      <label>Firma</label>
      <div class="line"></div>
    </div>
  </div>
  <div class="footer">
    <span>Loopy OSS — Generador de Briefs v1.0</span>
    <span>Snapshot al ${fmtDate(new Date().toISOString())}</span>
  </div>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
