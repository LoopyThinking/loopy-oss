// Template registry — holds all 5 standard analysis templates.
// Each template defines inputs, default prompt, and output schema.
// Org-level prompt overrides are stored in the analysis_templates table.

import type { Period } from '../../services/analytics-data.js'

export interface AnalysisTemplate {
  key: string
  name: string
  description: string
  category: 'roi' | 'adoption' | 'optimization' | 'people' | 'risk'
  defaultPeriod: Period['key']
  loadInputs(orgId: string, period: Period): Promise<Record<string, unknown>>
  defaultPrompt: string
  outputSchema: Record<string, unknown>
}

const templates = new Map<string, AnalysisTemplate>()

export function registerTemplate(t: AnalysisTemplate) {
  templates.set(t.key, t)
}

export function getTemplate(key: string): AnalysisTemplate | undefined {
  return templates.get(key)
}

export function listTemplates(): AnalysisTemplate[] {
  return Array.from(templates.values())
}

// Import and register all templates
import { template as roiSnapshot } from './roi-snapshot.js'
import { template as adoptionCurve } from './adoption-curve.js'
import { template as agentToolOptimization } from './agent-tool-optimization.js'
import { template as stuckLoops } from './stuck-loops.js'
import { template as teamIplSegmentation } from './team-ipl-segmentation.js'

registerTemplate(roiSnapshot)
registerTemplate(adoptionCurve)
registerTemplate(agentToolOptimization)
registerTemplate(stuckLoops)
registerTemplate(teamIplSegmentation)
