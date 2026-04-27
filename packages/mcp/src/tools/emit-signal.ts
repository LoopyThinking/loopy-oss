import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { loopy, type LoopyClientConfig } from '../client.js'

export const definition: Tool = {
  name: 'emit_signal',
  description:
    'Emit a Work Signal to an existing Loopy loop. ' +
    'Signals are the atomic evidence units inside a loop. ' +
    'Each signal has a cognitive type that reflects the kind of work it represents: ' +
    'perception (noticing), interpretation (analysing), decision (choosing), ' +
    'action (executing), or reflection (reviewing). ' +
    'Use map_signal instead if you want Loopy to classify the type automatically.',
  inputSchema: {
    type: 'object',
    properties: {
      loop_id: {
        type: 'string',
        description: 'UUID of the target loop. Get it from create_loop or list_active_loops.',
      },
      type: {
        type: 'string',
        enum: ['perception', 'interpretation', 'decision', 'action', 'reflection'],
        description:
          'Cognitive layer of the signal:\n' +
          '- perception: noticed something, received data, observed a state\n' +
          '- interpretation: analysed, understood what data means\n' +
          '- decision: chose a course of action\n' +
          '- action: executed a task, deployed, wrote, fixed\n' +
          '- reflection: reviewed outcome, extracted learning',
      },
      content: {
        type: 'string',
        description: 'Description of what happened. Be specific and factual. ' +
          'Example: "Reviewed 47 commits, found breaking regex change in matcher.ts on 2026-04-22"',
        maxLength: 2000,
      },
      source: {
        type: 'string',
        enum: ['agent', 'human'],
        description: 'Who emitted this signal. Use "agent" when the AI did the work. ' +
          'Agent signals contribute to IPL (productivity metric). Default: "agent".',
        default: 'agent',
      },
      estimated_human_minutes: {
        type: 'number',
        description: 'Optional override for the IPL heuristic. ' +
          'If set, this is the number of minutes of human work the agent replaced for this signal. ' +
          'Valid range: 0–480. Leave unset to use the default weight for the signal type.',
        minimum: 0,
        maximum: 480,
      },
    },
    required: ['loop_id', 'type', 'content'],
  },
}

export async function handler(
  args: Record<string, unknown>,
  cfg: LoopyClientConfig
): Promise<string> {
  const loopId  = String(args.loop_id ?? '').trim()
  const type    = args.type as 'perception' | 'interpretation' | 'decision' | 'action' | 'reflection'
  const content = String(args.content ?? '').trim()
  const source  = (args.source as 'agent' | 'human') ?? 'agent'
  const estimatedHumanMinutes = args.estimated_human_minutes != null
    ? Number(args.estimated_human_minutes)
    : undefined

  if (!loopId)  return 'Error: loop_id is required'
  if (!type)    return 'Error: type is required'
  if (!content) return 'Error: content is required'

  const signal = await loopy.emitSignal(cfg, {
    loopId,
    type,
    content,
    source,
    estimatedHumanMinutes,
  })

  return [
    `✅ Signal emitted`,
    `Signal ID: ${signal.id}`,
    `Type: ${type}  |  Source: ${source}`,
    `Content: ${content.slice(0, 120)}${content.length > 120 ? '…' : ''}`,
    estimatedHumanMinutes != null ? `IPL override: ${estimatedHumanMinutes} min` : '',
  ].filter(Boolean).join('\n')
}
