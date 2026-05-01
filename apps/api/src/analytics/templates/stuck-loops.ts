import type { AnalysisTemplate } from './index.js'
import { getStuckLoopsInputs } from '../../services/analytics-data.js'

export const template: AnalysisTemplate = {
  key: 'stuck_loops',
  name: 'Loops Bloqueados',
  description: 'Identifica loops abiertos sin actividad reciente (+14 días), analiza patrones comunes de bloqueo y sugiere intervenciones específicas para destrabarlos.',
  category: 'risk',
  defaultPeriod: 'last_30d',
  loadInputs: async (orgId) => {
    const inputs = await getStuckLoopsInputs(orgId)
    return inputs as unknown as Record<string, unknown>
  },
  defaultPrompt: `Eres un facilitador de productividad. Revisa los loops bloqueados en {{org_name}}.

Loops bloqueados (sin actividad en +14 días):
{{stuck_loops_table}}

Total de loops bloqueados: {{total_stuck}}

Genera un análisis estructurado:
1. stuck_loops: lista de loops bloqueados con análisis individual
2. common_pattern: patrón común identificado entre los loops bloqueados
3. suggested_intervention: intervención sugerida para destrabarlos
4. narrative_md: narración en markdown explicando la situación y recomendaciones`,
  outputSchema: {
    type: 'object',
    properties: {
      stuck_loops: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            loop_title: { type: 'string', description: 'Título del loop' },
            days_idle: { type: 'number', description: 'Días sin actividad' },
            likely_blocker: { type: 'string', description: 'Posible causa del bloqueo' },
          },
          required: ['loop_title', 'days_idle', 'likely_blocker'],
        },
        description: 'Lista de loops bloqueados con análisis',
      },
      common_pattern: { type: 'string', description: 'Patrón común entre loops bloqueados' },
      suggested_intervention: { type: 'string', description: 'Intervención sugerida' },
      narrative_md: { type: 'string', maxLength: 700, description: 'Narración en markdown' },
    },
    required: ['stuck_loops', 'common_pattern', 'suggested_intervention', 'narrative_md'],
  },
}
