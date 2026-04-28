import type { AnalysisTemplate } from './index.js'
import { getTeamSegmentationInputs, resolvePeriod } from '../../services/analytics-data.js'

export const template: AnalysisTemplate = {
  key: 'team_ipl_segmentation',
  name: 'Segmentación del Equipo',
  description: 'Analiza la productividad por usuario (IPL total, loops cerrados, ratio). Destaca a los champions y ofrece sugerencias de mejora para quienes están por debajo del promedio.',
  category: 'people',
  defaultPeriod: 'last_30d',
  loadInputs: async (orgId, period) => {
    const inputs = await getTeamSegmentationInputs(orgId, period ?? resolvePeriod('last_30d'))
    return inputs as unknown as Record<string, unknown>
  },
  defaultPrompt: `Eres un coach de productividad de equipos. Analiza la segmentación de productividad IPL en {{org_name}} durante {{period_label}}.

Miembros del equipo y su productividad:
{{members_table}}

Total miembros analizados: {{total_members}}

IMPORTANTE: Para los miembros "en riesgo", NUNCA uses lenguaje punitivo o crítico. Enmarca las observaciones como oportunidades de desarrollo: "podría beneficiarse de aprender el agente X usado por el champion Y".

Genera un análisis estructurado:
1. champions: hasta 3 miembros destacados (qué hacen bien)
2. at_risk: hasta 3 miembros que podrían beneficiarse de apoyo (NUNCA crítico, siempre constructivo)
3. opportunities: oportunidades de mejora para el equipo
4. narrative_md: narración en markdown (máx 700 caracteres)`,
  outputSchema: {
    type: 'object',
    properties: {
      champions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            display_name: { type: 'string' },
            ipl_minutes: { type: 'number' },
            what_they_do_right: { type: 'string', description: 'Qué hace bien este miembro' },
          },
          required: ['display_name', 'ipl_minutes', 'what_they_do_right'],
        },
        maxItems: 3,
        description: 'Miembros destacados del equipo',
      },
      at_risk: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            display_name: { type: 'string' },
            signal: { type: 'string', description: 'Señal constructiva, NUNCA crítica. Ej: "podría beneficiarse de..."' },
          },
          required: ['display_name', 'signal'],
        },
        maxItems: 3,
        description: 'Miembros que podrían beneficiarse de apoyo (lenguaje constructivo siempre)',
      },
      opportunities: {
        type: 'array',
        items: { type: 'string' },
        description: 'Oportunidades de mejora para el equipo',
      },
      narrative_md: { type: 'string', maxLength: 700, description: 'Narración en markdown' },
    },
    required: ['champions', 'at_risk', 'opportunities', 'narrative_md'],
  },
}
