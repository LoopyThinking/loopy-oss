import type { AnalysisTemplate } from './index.js'
import { getRoiInputs, resolvePeriod } from '../../services/analytics-data.js'

export const template: AnalysisTemplate = {
  key: 'roi_snapshot',
  name: 'ROI Snapshot',
  description: 'Calcula el ahorro estimado en horas/hombre, compara con el coste del Loopy (tarifa horaria configurada) y muestra los agentes con mayor impacto.',
  category: 'roi',
  defaultPeriod: 'last_30d',
  loadInputs: async (orgId, period) => {
    const inputs = await getRoiInputs(orgId, period ?? resolvePeriod('last_30d'))
    return inputs as unknown as Record<string, unknown>
  },
  defaultPrompt: [
    'Eres un analista de productividad. Analiza estos datos de ROI de Loopy para la organización {{org_name}} en el período {{period_label}}.',
    '',
    'Datos:',
    '- Horas IPL totales: {{ipl_hours}}',
    '- Tarifa horaria: ${{hourly_rate}}/h',
    '- Ahorro estimado: ${{savings_usd}}',
    '- Loops cerrados: {{loops_closed}}',
    '- Usuarios activos: {{active_users}}',
    '- Top agentes:',
    '{{top_agents_md}}',
    '',
    'Genera un análisis estructurado con:',
    '1. headline_summary: resumen ejecutivo de una línea (máx 200 caracteres)',
    '2. savings_estimate_usd: el ahorro estimado en USD',
    '3. key_drivers: los 2-3 factores principales que impulsan el ROI',
    '4. recommendations: 2-3 recomendaciones accionables',
    '5. narrative_md: narración en markdown (máx 800 caracteres)',
  ].join('\n'),
  outputSchema: {
    type: 'object',
    properties: {
      headline_summary: { type: 'string', maxLength: 200, description: 'Resumen ejecutivo de una línea' },
      savings_estimate_usd: { type: 'number', description: 'Ahorro estimado en USD' },
      key_drivers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            driver: { type: 'string' },
            contribution_pct: { type: 'number' },
          },
          required: ['driver', 'contribution_pct'],
        },
        description: 'Factores principales que impulsan el ROI',
      },
      recommendations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            rationale: { type: 'string' },
          },
          required: ['title', 'rationale'],
        },
        maxItems: 3,
        description: 'Recomendaciones accionables',
      },
      narrative_md: { type: 'string', maxLength: 800, description: 'Narración en markdown' },
    },
    required: ['headline_summary', 'savings_estimate_usd', 'key_drivers', 'recommendations', 'narrative_md'],
  },
}
