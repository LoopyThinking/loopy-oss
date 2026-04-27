import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { loopy, classifySignal, type LoopyClientConfig } from '../client.js'

export const definition: Tool = {
  name: 'map_signal',
  description:
    'Classify a free-text description of work into the correct cognitive layer, ' +
    'then emit it as a Work Signal to the specified loop. ' +
    'Use this when you want Loopy to figure out the signal type automatically ' +
    'from the description (perception / interpretation / decision / action / reflection). ' +
    'Use emit_signal instead if you already know the type.',
  inputSchema: {
    type: 'object',
    properties: {
      loop_id: {
        type: 'string',
        description: 'UUID of the target loop.',
      },
      description: {
        type: 'string',
        description: 'What happened or what was done. Loopy will classify this into the appropriate ' +
          'cognitive layer. Be specific: "Reviewed 47 commits and identified a breaking change" ' +
          'is better than "did some work".',
        maxLength: 2000,
      },
      source: {
        type: 'string',
        enum: ['agent', 'human'],
        description: 'Who did this work. Default: "agent".',
        default: 'agent',
      },
      estimated_human_minutes: {
        type: 'number',
        description: 'Optional: minutes of human work replaced by the agent for this signal (0–480).',
        minimum: 0,
        maximum: 480,
      },
    },
    required: ['loop_id', 'description'],
  },
}

export async function handler(
  args: Record<string, unknown>,
  cfg: LoopyClientConfig
): Promise<string> {
  const loopId      = String(args.loop_id ?? '').trim()
  const description = String(args.description ?? '').trim()
  const source      = (args.source as 'agent' | 'human') ?? 'agent'
  const estimatedHumanMinutes = args.estimated_human_minutes != null
    ? Number(args.estimated_human_minutes)
    : undefined

  if (!loopId)      return 'Error: loop_id is required'
  if (!description) return 'Error: description is required'

  const type = classifySignal(description)

  const signal = await loopy.emitSignal(cfg, {
    loopId,
    type,
    content: description,
    source,
    estimatedHumanMinutes,
  })

  return [
    `✅ Signal mapped and emitted`,
    `Signal ID: ${signal.id}`,
    `Classified as: ${type}  |  Source: ${source}`,
    `Content: ${description.slice(0, 120)}${description.length > 120 ? '…' : ''}`,
    estimatedHumanMinutes != null ? `IPL override: ${estimatedHumanMinutes} min` : '',
  ].filter(Boolean).join('\n')
}
