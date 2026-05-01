// Cron worker for scheduled analytics runs.
// Polls every 15 minutes for due schedules and executes them.
// Guard with LOOPY_DISABLE_CRON=1 to disable in tests.

import sql from './db/client.js'

export function startCron() {
  if (process.env.LOOPY_DISABLE_CRON === '1') {
    console.log('[cron] Disabled via LOOPY_DISABLE_CRON=1')
    return
  }

  console.log('[cron] Starting scheduled analytics worker (every 15 min)')
  runDueSchedules()
  setInterval(runDueSchedules, 15 * 60 * 1000)
}

async function runDueSchedules() {
  try {
    const schedules: Array<{
      id: string; org_id: string; template_key: string; period: string
      llm_config_id: string | null; cadence: string
    }> = await sql`
      SELECT id, org_id, template_key, period, llm_config_id, cadence
      FROM analysis_schedules
      WHERE is_active = TRUE AND next_run_at <= now()
      FOR UPDATE SKIP LOCKED
    `

    for (const schedule of schedules) {
      try {
        await sql`
          INSERT INTO analyses (org_id, template_key, period_label, prompt_used, data_inputs, llm_config_id, status, scheduled)
          VALUES (${schedule.org_id}, ${schedule.template_key}, ${schedule.period}, '', '{}'::jsonb, ${schedule.llm_config_id}, 'pending', TRUE)
        `

        await sql`
          UPDATE analysis_schedules
          SET last_run_at = now(),
              next_run_at = CASE WHEN cadence = 'weekly' THEN now() + interval '1 week' ELSE now() + interval '1 month' END
          WHERE id = ${schedule.id}
        `
      } catch (err) {
        console.error(`[cron] Failed to execute schedule ${schedule.id}:`, err)
        await sql`
          UPDATE analysis_schedules SET next_run_at = now() + interval '1 hour' WHERE id = ${schedule.id}
        `
      }
    }

    if (schedules.length > 0) {
      console.log(`[cron] Executed ${schedules.length} scheduled analysis(es)`)
    }
  } catch (err) {
    console.error('[cron] Error checking schedules:', err)
  }
}
