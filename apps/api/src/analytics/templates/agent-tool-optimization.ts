import type { AnalysisTemplate } from './index.js'
import { getAgentOptimizationInputs, resolvePeriod } from '../../services/analytics-data.js'

export const template: AnalysisTemplate = {
  key: 'agent_tool_optimization',
  name: 'Optimización de Agentes',
  description: 'Detecta solapamiento de skills entre agentes, identifica al agente más efectivo por área y sugiere consolidaciones para reducir redundancia.',
  category: 'optimization',
  defaultPeriod: 'last_30d',
  loadInputs: async (orgId, period) => {
    const inputs = await getAgentOptimizationInputs(orgId, period ?? resolvePeriod('last_30d'))
    return inputs as unknown as Record<string, unknown>
  },
  defaultPrompt: `Eres un consultor de eficiencia operativa. Analiza el rendimiento de agentes de Loopy en {{org_name}} durante {{period_label}}.

Agentes registrados:
{{agents_table}}

Genera un análisis estructurado:
1. consolidation_opportunities: oportunidades de consolidación (agentes duplicados que podrían unificarse)
2. champion_agent_per_skill: el mejor agente por cada skill/área detectada
3. narrative_md: narración en markdown (máx 700 caracteres)`,
  outputSchema: {
    type: 'object',
    properties: {
      consolidation_opportunities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            skill_area: { type: 'string', description: 'Área de skill donde hay solapamiento' },
            recommended_agent_name: { type: 'string', description: 'Agente recomendado' },
            replaced_agents: {
              type: 'array',
              items: { type: 'string' },
              description: 'Agentes que podrían reemplazarse',
            },
            expected_uplift_pct: { type: 'number', description: 'Porcentaje de mejora esperado' },
          },
          required: ['skill_area', 'recommended_agent_name', 'replaced_agents', 'expected_uplift_pct'],
        },
        description: 'Oportunidades de consolidación',
      },
      champion_agent_per_skill: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            skill_area: { type: 'string' },
            agent_name: { type: 'string' },
          },
          required: ['skill_area', 'agent_name'],
        },
        description: 'Mejor agente por skill',
      },
      narrative_md: { type: 'string', maxLength: 700, description: 'Narración en markdown' },
    },
    required: ['consolidation_opportunities', 'champion_agent_per_skill', 'narrative_md'],
  },
}
