import type { CognitiveLayer, LoopyConfig, WorkSignal } from './types'
import { LoopySignals } from './signals'

type WorkActivity = {
  description: string
  source?: 'human' | 'agent'
  metadata?: Record<string, unknown>
}

/**
 * LoopyMapper — classifies a work activity into a cognitive layer
 * and emits it as a signal to a loop.
 *
 * @example
 * await LoopyMapper.map('loop-id', {
 *   description: 'Analyzed error logs and identified root cause',
 *   source: 'agent',
 * }, config)
 */
export class LoopyMapper {
  private static classify(description: string): CognitiveLayer {
    const lower = description.toLowerCase()

    if (
      lower.includes('analyz') ||
      lower.includes('observ') ||
      lower.includes('detect') ||
      lower.includes('scan') ||
      lower.includes('read')
    ) {
      return 'perception'
    }

    if (
      lower.includes('interpret') ||
      lower.includes('evaluat') ||
      lower.includes('assess') ||
      lower.includes('review') ||
      lower.includes('understand')
    ) {
      return 'interpretation'
    }

    if (
      lower.includes('decid') ||
      lower.includes('choos') ||
      lower.includes('select') ||
      lower.includes('priorit') ||
      lower.includes('approv')
    ) {
      return 'decision'
    }

    if (
      lower.includes('reflect') ||
      lower.includes('learn') ||
      lower.includes('retrospect') ||
      lower.includes('conclusion')
    ) {
      return 'reflection'
    }

    // Default: action
    return 'action'
  }

  static async map(
    loopId: string,
    activity: WorkActivity,
    config: LoopyConfig
  ): Promise<WorkSignal> {
    const layer = LoopyMapper.classify(activity.description)

    return LoopySignals.emit(
      {
        loopId,
        type: layer,
        content: activity.description,
        source: activity.source ?? 'agent',
        metadata: activity.metadata,
      },
      config
    )
  }
}
