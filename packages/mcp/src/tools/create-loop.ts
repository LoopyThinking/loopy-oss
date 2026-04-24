import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { loopy, type LoopyClientConfig } from '../client.js'

export const definition: Tool = {
  name: 'create_loop',
  description:
    'Create a new Loopy loop — a hypothesis-driven container for tracking a unit of work. ' +
    'A loop holds a hypothesis and accumulates Work Signals as evidence until it is closed. ' +
    'Returns the loop ID needed for emit_signal and close_loop.',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'A short, descriptive title for the loop (max 200 chars). ' +
          'Example: "Investigate drop in skill activation rate"',
        maxLength: 200,
      },
      hypothesis: {
        type: 'string',
        description: 'The working hypothesis the loop will test or resolve. ' +
          'Example: "Likely caused by the regex change in Tuesday\'s deploy"',
        maxLength: 1000,
      },
      scope: {
        type: 'string',
        enum: ['personal', 'team', 'organizational'],
        description:
          'Visibility scope. ' +
          '"personal" — only you; ' +
          '"team" — visible to org members; ' +
          '"organizational" — appears in the executive panel.',
        default: 'personal',
      },
    },
    required: ['title'],
  },
}

export async function handler(
  args: Record<string, unknown>,
  cfg: LoopyClientConfig
): Promise<string> {
  const title      = String(args.title ?? '').trim()
  const hypothesis = args.hypothesis ? String(args.hypothesis).trim() : undefined
  const scope      = (args.scope as 'personal' | 'team' | 'organizational') ?? 'personal'

  if (!title) return 'Error: title is required'

  const loop = await loopy.createLoop(cfg, { title, hypothesis, scope })

  return [
    `✅ Loop created`,
    `ID: ${loop.id}`,
    `Title: ${loop.title}`,
    hypothesis ? `Hypothesis: ${loop.hypothesis}` : '',
    `Scope: ${loop.scope}`,
    `Confidence: ${loop.confidence_index}/100`,
    ``,
    `Use emit_signal or map_signal to add Work Signals to this loop.`,
  ].filter(Boolean).join('\n')
}
