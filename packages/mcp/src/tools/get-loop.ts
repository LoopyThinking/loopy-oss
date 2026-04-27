import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { loopy, type LoopyClientConfig, type WorkSignal } from '../client.js'

export const definition: Tool = {
  name: 'get_loop',
  description:
    'Retrieve the full details of a Loopy loop, including its current Confidence Index, ' +
    'IPL value, and the complete signal timeline. ' +
    'Use this to understand what evidence has been accumulated and whether the loop ' +
    'is ready to close.',
  inputSchema: {
    type: 'object',
    properties: {
      loop_id: {
        type: 'string',
        description: 'UUID of the loop to retrieve.',
      },
    },
    required: ['loop_id'],
  },
}

function formatSignal(s: WorkSignal, index: number): string {
  const date = new Date(s.created_at).toLocaleDateString('en', {
    month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
  const icon = {
    perception:     '👁️',
    interpretation: '🧠',
    decision:       '⚡',
    action:         '🔧',
    reflection:     '🔄',
  }[s.type] ?? '•'

  return `  ${index + 1}. [${s.type.padEnd(14)}] ${icon} ${s.content.slice(0, 100)}${s.content.length > 100 ? '…' : ''} — ${s.source} (${date})`
}

export async function handler(
  args: Record<string, unknown>,
  cfg: LoopyClientConfig
): Promise<string> {
  const loopId = String(args.loop_id ?? '').trim()
  if (!loopId) return 'Error: loop_id is required'

  const loop = await loopy.getLoop(cfg, loopId)

  const signalBlock = loop.signals?.length
    ? loop.signals.map((s, i) => formatSignal(s, i)).join('\n')
    : '  (no signals yet)'

  const confidenceBar = (() => {
    const filled = Math.round(loop.confidence_index / 10)
    return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${loop.confidence_index}/100`
  })()

  return [
    `📋 Loop: ${loop.title}`,
    `ID: ${loop.id}`,
    `Status: ${loop.status}  |  Scope: ${loop.scope}`,
    loop.hypothesis ? `Hypothesis: ${loop.hypothesis}` : '',
    ``,
    `Confidence: ${confidenceBar}`,
    `IPL: ${loop.ipl_hours}h (${loop.ipl_minutes} min of agent work)`,
    ``,
    `Signal timeline (${loop.signals?.length ?? 0} signals):`,
    signalBlock,
    loop.closed_at ? `\nClosed: ${new Date(loop.closed_at).toLocaleDateString('en')}` : '',
    loop.resolution ? `Resolution: ${loop.resolution}` : '',
  ].filter(s => s !== null && s !== undefined).join('\n')
}
