import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { loopy, type LoopyClientConfig, type Loop } from '../client.js'

export const definition: Tool = {
  name: 'list_active_loops',
  description:
    'List all currently open Loopy loops for the authenticated user. ' +
    'Returns loop IDs, titles, hypotheses, Confidence Index values, and IPL. ' +
    'Use this to find a loop ID before calling emit_signal, map_signal, close_loop, or get_loop.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
}

function formatLoop(loop: Loop, index: number): string {
  const confidenceBar = '█'.repeat(Math.round(loop.confidence_index / 10)) +
    '░'.repeat(10 - Math.round(loop.confidence_index / 10))
  const age = Math.floor((Date.now() - new Date(loop.created_at).getTime()) / 86_400_000)
  const ageStr = age === 0 ? 'today' : age === 1 ? '1 day ago' : `${age} days ago`

  return [
    `${index + 1}. ${loop.title}`,
    `   ID: ${loop.id}`,
    loop.hypothesis ? `   Hypothesis: ${loop.hypothesis.slice(0, 80)}${loop.hypothesis.length > 80 ? '…' : ''}` : '',
    `   Confidence: ${confidenceBar} ${loop.confidence_index}/100  |  IPL: ${loop.ipl_hours}h  |  Scope: ${loop.scope}  |  Created: ${ageStr}`,
  ].filter(Boolean).join('\n')
}

export async function handler(
  _args: Record<string, unknown>,
  cfg: LoopyClientConfig
): Promise<string> {
  const loops = await loopy.listActiveLoops(cfg)

  if (!loops.length) {
    return 'No active loops found.\nUse create_loop to start a new one.'
  }

  const lines = [
    `📂 Active loops (${loops.length}):`,
    '',
    ...loops.map((l, i) => formatLoop(l, i)),
  ]

  return lines.join('\n')
}
