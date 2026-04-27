import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { loopy, type LoopyClientConfig } from '../client.js'

export const definition: Tool = {
  name: 'close_loop',
  description:
    'Close an open Loopy loop with a resolution statement. ' +
    'A resolution captures what was learned or decided — it is the conclusion of the hypothesis. ' +
    'Closing a loop does not mean success: a loop can be closed with a negative result ' +
    '("Hypothesis was wrong — the issue was X, not Y") and that is still valuable. ' +
    'Once closed, a loop is immutable.',
  inputSchema: {
    type: 'object',
    properties: {
      loop_id: {
        type: 'string',
        description: 'UUID of the loop to close.',
      },
      resolution: {
        type: 'string',
        description: 'What was decided or learned. Be honest and specific. ' +
          'Examples: ' +
          '"Hypothesis confirmed. The regex change in matcher.ts caused the drop. Fix deployed." ' +
          '"Hypothesis incorrect. Root cause was a misconfigured environment variable, not the deploy." ' +
          '"Closed as stale — context changed, original hypothesis no longer relevant."',
        maxLength: 2000,
      },
    },
    required: ['loop_id'],
  },
}

export async function handler(
  args: Record<string, unknown>,
  cfg: LoopyClientConfig
): Promise<string> {
  const loopId     = String(args.loop_id ?? '').trim()
  const resolution = args.resolution ? String(args.resolution).trim() : undefined

  if (!loopId) return 'Error: loop_id is required'

  const loop = await loopy.closeLoop(cfg, loopId, resolution)

  return [
    `✅ Loop closed`,
    `ID: ${loop.id}`,
    `Title: ${loop.title}`,
    `Final Confidence Index: ${loop.confidence_index}/100`,
    `IPL: ${loop.ipl_hours}h (${loop.ipl_minutes} min)`,
    resolution ? `Resolution: ${resolution.slice(0, 200)}${resolution.length > 200 ? '…' : ''}` : '',
  ].filter(Boolean).join('\n')
}
