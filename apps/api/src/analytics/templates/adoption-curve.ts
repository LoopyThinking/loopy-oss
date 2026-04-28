import type { AnalysisTemplate } from './index.js'
import { getAdoptionInputs, resolvePeriod } from '../../services/analytics-data.js'

export const template: AnalysisTemplate = {
  key: 'adoption_curve',
  name: 'Curva de Adopción',
  description: 'Muestra la evolución semanal de usuarios activos y loops creados. Identifica tendencias (crecimiento, meseta, declive) y sugiere acciones.',
  category: 'adoption',
  defaultPeriod: 'last_90d',
  loadInputs: async (orgId, period) => {
    const inputs = await getAdoptionInputs(orgId, period ?? resolvePeriod('last_90d'))
    return inputs as unknown as Record<string, unknown>
  },
  defaultPrompt: `Eres un analista de adopción de producto. Analiza la adopción de Loopy en {{org_name}} durante el período {{period_label}}.

Datos de adopción semanal (últimas {{num_weeks}} semanas):
{{weekly_table}}

Miembros totales de la organización: {{total_members}}

Genera un análisis estructurado con:
1. trend: la tendencia general ('rising' | 'flat' | 'declining')
2. narrative_md: narración en markdown sobre la evolución (máx 600 caracteres)
3. risks: lista de riesgos identificados
4. next_action: la acción más importante a tomar ahora`,
  outputSchema: {
    type: 'object',
    properties: {
      trend: {
        type: 'string',
        enum: ['rising', 'flat', 'declining'],
        description: 'Tendencia general de adopción',
      },
      narrative_md: { type: 'string', maxLength: 600, description: 'Narración en markdown' },
      risks: {
        type: 'array',
        items: { type: 'string' },
        description: 'Riesgos identificados en la adopción',
      },
      next_action: { type: 'string', description: 'Acción más importante a tomar ahora' },
    },
    required: ['trend', 'narrative_md', 'risks', 'next_action'],
  },
}
