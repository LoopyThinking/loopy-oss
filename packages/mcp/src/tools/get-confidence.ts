import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { loopy, type LoopyClientConfig } from '../client.js'

export const definition: Tool = {
  name: 'get_confidence',
  description:
    'Get the current Confidence Index (0–100) and IPL for a Loopy loop, ' +
    'along with a plain-language interpretation of what the score means. ' +
    'The Confidence Index is a governance metric, not a success score: ' +
    'it reflects how much evidence has accumulated in the loop, not whether the hypothesis is correct. ' +
    'Use this to decide whether a loop is ready to close.',
  inputSchema: {
    type: 'object',
    properties: {
      loop_id: {
        type: 'string',
        description: 'UUID of the loop to check.',
      },
    },
    required: ['loop_id'],
  },
}

function interpretConfidence(score: number): string {
  if (score >= 80) return 'High — strong evidence base. Loop is likely ready to close.'
  if (score >= 60) return 'Medium-high — good progress. Consider one more reflection signal before closing.'
  if (score >= 40) return 'Medium — hypothesis partially supported. More signals needed.'
  if (score >= 20) return 'Low — early stage. Keep working on the loop.'
  return 'Very low — just started. Emit more signals to build evidence.'
}

function interpretIpl(minutes: number): string {
  if (minutes === 0) return 'No agent work recorded yet.'
  const hours = (minutes / 60).toFixed(1)
  return `The agent has contributed the equivalent of ${hours}h of human work to this loop.`
}

export async function handler(
  args: Record<string, unknown>,
  cfg: LoopyClientConfig
): Promise<string> {
  const loopId = String(args.loop_id ?? '').trim()
  if (!loopId) return 'Error: loop_id is required'

  const loop = await loopy.getLoop(cfg, loopId)

  const bar = '█'.repeat(Math.round(loop.confidence_index / 10)) +
    '░'.repeat(10 - Math.round(loop.confidence_index / 10))

  return [
    `📊 Confidence for: ${loop.title}`,
    ``,
    `Confidence Index: ${bar} ${loop.confidence_index}/100`,
    `Interpretation:   ${interpretConfidence(loop.confidence_index)}`,
    ``,
    `IPL (agent productivity):`,
    `  ${loop.ipl_hours}h / ${loop.ipl_minutes} min`,
    `  ${interpretIpl(loop.ipl_minutes)}`,
    ``,
    `Status: ${loop.status}  |  Signals: ${loop.signals?.length ?? '?'}`,
  ].join('\n')
}
