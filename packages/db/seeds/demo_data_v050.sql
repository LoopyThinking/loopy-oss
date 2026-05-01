-- Extensive demo seed data for v0.5.0 analytics testing.
-- Builds on top of the basic demo_data.sql seed.
--
-- Creates:
--   · 4 users with different roles across 2 organizations
--   · 4 registered agents with signal attribution
--   · 30+ loops spanning 90 days (open, closed, blocked)
--   · 100+ work signals with varied cognitive layers
--   · LLM provider configs (Anthropic + OpenAI)
--   · Completed analyses and scheduled digests
--   · Hourly rate configured for ROI calculations
--
-- All UUIDs are fixed so the seed is idempotent (safe to run multiple times).

DO $$
DECLARE
  -- Identity
  alice_id        UUID := '00000000-0000-0000-0000-000000000001';
  bob_id          UUID := '00000000-0000-0000-0000-000000000101';
  carol_id        UUID := '00000000-0000-0000-0000-000000000102';
  demo_id         UUID := '00000000-0000-0000-0000-000000000002';

  -- Orgs
  team_org_id     UUID := '00000000-0000-0000-0000-000000000201';
  personal_org_id UUID := '00000000-0000-0000-0000-000000000202';

  -- Agents
  claude_agent    UUID := '00000000-0000-0000-0000-000000000003';
  review_bot_id   UUID := '00000000-0000-0000-0000-000000000301';
  deploy_bot_id   UUID := '00000000-0000-0000-0000-000000000302';
  pipeline_agent  UUID := '00000000-0000-0000-0000-000000000303';

  -- LLM configs
  llm_anthropic   UUID := '00000000-0000-0000-0000-000000000401';
  llm_openai      UUID := '00000000-0000-0000-0000-000000000402';
  llm_deepseek    UUID := '00000000-0000-0000-0000-000000000403';

  -- Analyses
  analysis_roi    UUID := '00000000-0000-0000-0000-000000000501';
  analysis_stuck  UUID := '00000000-0000-0000-0000-000000000502';
  analysis_adopt  UUID := '00000000-0000-0000-0000-000000000503';

  -- Schedules
  sched_weekly    UUID := '00000000-0000-0000-0000-000000000601';
  sched_monthly   UUID := '00000000-0000-0000-0000-000000000602';

  -- Loop UUIDs (30)
  loop_ids UUID[] := ARRAY[
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000014',
    '00000000-0000-0000-0000-000000000015',
    '00000000-0000-0000-0000-000000000016',
    '00000000-0000-0000-0000-000000000017',
    '00000000-0000-0000-0000-000000000018',
    '00000000-0000-0000-0000-000000000019',
    '00000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000022',
    '00000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000024',
    '00000000-0000-0000-0000-000000000025',
    '00000000-0000-0000-0000-000000000026',
    '00000000-0000-0000-0000-000000000027',
    '00000000-0000-0000-0000-000000000028',
    '00000000-0000-0000-0000-000000000029',
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000032',
    '00000000-0000-0000-0000-000000000033',
    '00000000-0000-0000-0000-000000000034',
    '00000000-0000-0000-0000-000000000035',
    '00000000-0000-0000-0000-000000000036',
    '00000000-0000-0000-0000-000000000037',
    '00000000-0000-0000-0000-000000000038',
    '00000000-0000-0000-0000-000000000039'
  ];

  l_id UUID;
  i INT;
  days_ago INT;
  signal_ts TIMESTAMPTZ;
  loop_ts TIMESTAMPTZ;
  owner_id UUID;
  agent_id_var UUID;
  agent_id_2 UUID;
  num_signals INT;
  sig_type TEXT;
  sig_types TEXT[] := ARRAY['perception', 'interpretation', 'decision', 'action', 'reflection'];
  sig_agent TEXT;
  est_min INT;
  ipl_total INT;
BEGIN

  -- ═══════════════════════════════════════════════════════════
  -- 1. USERS
  -- ═══════════════════════════════════════════════════════════

  INSERT INTO users (id, email, display_name) VALUES
    (alice_id, 'alice@engineering.local',   'Alice Chen'),
    (bob_id,   'bob@engineering.local',     'Bob Martínez'),
    (carol_id, 'carol@engineering.local',   'Carol Kim'),
    (demo_id,  'demo@loopy-oss.local',      'Demo User')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 2. ORGANIZATIONS
  -- ═══════════════════════════════════════════════════════════

  INSERT INTO organizations (id, name, slug, hourly_rate_usd) VALUES
    (team_org_id,     'Engineering Co.', 'engineering-co', 75.00),
    (personal_org_id, 'Personal Workspace', 'demo-workspace', 50.00)
  ON CONFLICT (id) DO NOTHING;

  -- Set hourly rate on existing personal org if already created
  UPDATE organizations SET hourly_rate_usd = 50.00 WHERE id = personal_org_id;

  INSERT INTO org_members (user_id, org_id, role) VALUES
    (alice_id, team_org_id, 'admin'),
    (bob_id,   team_org_id, 'member'),
    (carol_id, team_org_id, 'member'),
    (demo_id,  team_org_id, 'admin'),
    (demo_id,  personal_org_id, 'owner')
  ON CONFLICT (user_id, org_id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 3. AGENTS
  -- ═══════════════════════════════════════════════════════════

  INSERT INTO agent_registry (id, user_id, org_id, agent_name, token_hash, description) VALUES
    (claude_agent,  demo_id,   personal_org_id, 'Claude Cowork Agent',
     'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
     'Demo agent for local development'),
    (review_bot_id, alice_id, team_org_id, 'Code Review Bot',
     'b665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
     'Automated code review and PR analysis'),
    (deploy_bot_id, bob_id,   team_org_id, 'Deploy Bot',
     'c665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
     'CI/CD pipeline monitoring and deployment'),
    (pipeline_agent, carol_id, team_org_id, 'Data Pipeline Agent',
     'd665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
     'ETL pipeline monitoring and alerting')
  ON CONFLICT (id) DO NOTHING;

  -- Update last_seen_at so agents appear active
  UPDATE agent_registry SET last_seen_at = now() - interval '1 hour'
  WHERE id IN (review_bot_id, deploy_bot_id, pipeline_agent);

  -- ═══════════════════════════════════════════════════════════
  -- 4. LLP CONFIGS
  -- ═══════════════════════════════════════════════════════════

  -- Insert into team org
  INSERT INTO org_llm_configs (id, org_id, provider, display_name, model, base_url, api_key_cipher, api_key_last4, is_default, is_active, last_tested_at, last_test_ok, created_by)
  VALUES
    (llm_anthropic, team_org_id, 'anthropic', 'Claude Sonnet', 'claude-sonnet-4-20250514', NULL,
     'AAAAAN9rZXktaWQtMTIzNDU2Nzg5MDEyMzQ1Njc4OTA=', '7890', TRUE, TRUE, now(), TRUE, alice_id),
    (llm_openai, team_org_id, 'openai', 'GPT-4o', 'gpt-4o-2025-06-01', NULL,
     'AAAAAN9rZXktaWQtMTIzNDU2Nzg5MDEyMzQ1Njc4OTA=', '1234', FALSE, TRUE, now() - interval '7 days', TRUE, alice_id),
    (llm_deepseek, team_org_id, 'deepseek', 'DeepSeek Chat', 'deepseek-chat', NULL,
     'AAAAAN9rZXktaWQtMTIzNDU2Nzg5MDEyMzQ1Njc4OTA=', '5678', FALSE, TRUE, NULL, NULL, alice_id)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 5. LOOPS (30)
  -- Timestamps spread across last 90 days.
  -- Mix of statuses, scopes, confidence, and IPL values.
  -- ═══════════════════════════════════════════════════════════

  -- Helper: insert a loop with given index, override params
  -- We use a sub-function approach: just iterate and condition

  FOR i IN 1..30 LOOP
    l_id := loop_ids[i];

    -- Compute days_ago: spread across 90 days
    -- First 10 in last 7d, next 10 in last 30d, last 10 in last 90d
    IF i <= 10 THEN
      days_ago := (i - 1) * 1;          -- 0 to 9 days ago
    ELSIF i <= 20 THEN
      days_ago := 10 + (i - 11) * 3;    -- 13 to 37 days ago
    ELSE
      days_ago := 40 + (i - 21) * 5;    -- 45 to 85 days ago
    END IF;

    loop_ts := now() - (days_ago || ' days')::INTERVAL;

    -- Assign owner: alice (odd i), bob (i%3==0), carol (rest)
    IF i % 2 = 1 THEN owner_id := alice_id;
    ELSIF i % 3 = 0 THEN owner_id := bob_id;
    ELSE owner_id := carol_id;
    END IF;

    -- Assign agent for this loop
    IF i % 3 = 1 THEN agent_id_var := review_bot_id; agent_id_2 := pipeline_agent;
    ELSIF i % 3 = 2 THEN agent_id_var := deploy_bot_id; agent_id_2 := review_bot_id;
    ELSE agent_id_var := pipeline_agent; agent_id_2 := deploy_bot_id;
    END IF;

    -- Status, confidence, scope, ipl based on position
    -- Vary to get realistic distribution
    DECLARE
      l_status TEXT;
      l_scope TEXT;
      l_confidence INT;
      l_ipl INT;
      l_title TEXT;
    BEGIN
      -- Loops 1-20: open, 21-26: closed, 27-28: blocked, 29-30: open
      IF i <= 20 THEN l_status := 'open';
      ELSIF i <= 26 THEN l_status := 'closed';
      ELSIF i <= 28 THEN l_status := 'blocked';
      ELSE l_status := 'open';
      END IF;

      IF i % 4 = 0 THEN l_scope := 'team';
      ELSE l_scope := 'personal';
      END IF;

      -- Confidence: higher for closed, random otherwise
      IF i <= 2 THEN l_confidence := 85 + (i * 5);       -- 90, 95
      ELSIF i BETWEEN 21 AND 26 THEN l_confidence := 70 + (i % 5) * 5;  -- closed: 70-90
      ELSIF i BETWEEN 27 AND 28 THEN l_confidence := 10; -- blocked: low
      ELSE l_confidence := (i * 3 + days_ago) % 80 + 10; -- open: 10-89
      END IF;

      l_ipl := CASE
        WHEN i <= 3 THEN 120 + i * 15     -- heavy IPL
        WHEN i BETWEEN 4 AND 10 THEN 60 - i * 2  -- medium IPL
        WHEN i BETWEEN 11 AND 15 THEN 30 - i     -- light IPL
        WHEN i BETWEEN 16 AND 20 THEN 5          -- minimal IPL
        WHEN i BETWEEN 21 AND 26 THEN 45 + i     -- closed: some IPL
        ELSE 0
      END;
      IF l_ipl < 0 THEN l_ipl := 2; END IF;

      -- Titles
      l_title := CASE i
        WHEN 1 THEN 'Migrate API from Supabase to Hono'
        WHEN 2 THEN 'Design new dashboard layout'
        WHEN 3 THEN 'Optimize database query performance'
        WHEN 4 THEN 'Set up staging environment'
        WHEN 5 THEN 'Refactor auth middleware'
        WHEN 6 THEN 'Add end-to-end testing pipeline'
        WHEN 7 THEN 'Implement dark mode'
        WHEN 8 THEN 'Create onboarding flow'
        WHEN 9 THEN 'Upgrade dependency versions'
        WHEN 10 THEN 'Add search functionality'
        WHEN 11 THEN 'Fix websocket reconnection bug'
        WHEN 12 THEN 'Add CSV export feature'
        WHEN 13 THEN 'Build API rate limiter'
        WHEN 14 THEN 'Design notification system'
        WHEN 15 THEN 'Implement audit logging'
        WHEN 16 THEN 'Add user preferences page'
        WHEN 17 THEN 'Set up error tracking (Sentry)'
        WHEN 18 THEN 'Create email templates'
        WHEN 19 THEN 'Build health check endpoint'
        WHEN 20 THEN 'Add pagination to list views'
        WHEN 21 THEN 'Write API documentation'
        WHEN 22 THEN 'Set up CI workflow'
        WHEN 23 THEN 'Implement password reset'
        WHEN 24 THEN 'Add input validation library'
        WHEN 25 THEN 'Create 404 error page'
        WHEN 26 THEN 'Add loading skeletons'
        WHEN 27 THEN 'Cross-browser CSS bug'
        WHEN 28 THEN 'Race condition in signal handler'
        WHEN 29 THEN 'Build real-time collaboration'
        WHEN 30 THEN 'Design mobile responsive nav'
      END;

      INSERT INTO loops (id, user_id, org_id, title, hypothesis, status, scope, confidence_index, ipl_minutes, created_at, updated_at, closed_at)
      VALUES (
        l_id, owner_id, team_org_id, l_title,
        CASE WHEN i % 3 = 0 THEN 'Hypothesis: ' || l_title || ' will improve team productivity' ELSE NULL END,
        l_status, l_scope, l_confidence, l_ipl,
        loop_ts, loop_ts + interval '1 hour',
        CASE WHEN l_status = 'closed' THEN loop_ts + interval '2 days' + (i || ' hours')::INTERVAL ELSE NULL END
      )
      ON CONFLICT (id) DO NOTHING;

      -- ══════════════════════════════════════════════════════
      -- 6. SIGNALS (3-8 per loop, 100+ total)
      -- ══════════════════════════════════════════════════════

      -- Skip signals for non-open loops (closed/blocked trigger prevents inserts)
      IF l_status = 'open' THEN
        num_signals := 3 + (i % 5);  -- 3 to 7 signals per loop

        FOR s IN 1..num_signals LOOP
        signal_ts := loop_ts + ((s - 1) || ' days')::INTERVAL + ((s * 2) || ' hours')::INTERVAL;
        sig_type := sig_types[1 + (s % 5)];

        -- Alternate between human and agent sources
        IF s % 2 = 0 THEN
          sig_agent := 'human';
          est_min := NULL;
        ELSE
          sig_agent := 'agent';
          est_min := 3 + (s * 2);  -- 5, 7, 9, 11, 13 min
        END IF;

        -- Content based on type and loop
        INSERT INTO work_signals (loop_id, user_id, org_id, type, content, source, agent_id, estimated_human_minutes, created_at, metadata)
        VALUES (
          l_id,
          CASE WHEN sig_agent = 'agent' THEN owner_id ELSE
            CASE WHEN i % 2 = 0 THEN alice_id WHEN i % 3 = 0 THEN bob_id ELSE carol_id END
          END,
          team_org_id,
          sig_type,
          CASE sig_type
            WHEN 'perception' THEN 'Observed: ' || CASE s % 3
              WHEN 0 THEN 'increased error rates in production logs'
              WHEN 1 THEN 'slow response times in API gateway'
              ELSE 'unusual pattern in user engagement metrics'
            END
            WHEN 'interpretation' THEN 'Analysis: ' || CASE s % 3
              WHEN 0 THEN 'root cause appears to be database connection pool exhaustion'
              WHEN 1 THEN 'UI rendering bottleneck in the virtual list component'
              ELSE 'correlation between deployment frequency and bug reports'
            END
            WHEN 'decision' THEN 'Decision: ' || CASE s % 3
              WHEN 0 THEN 'implement connection pooling with PgBouncer'
              WHEN 1 THEN 'replace virtual list with paginated table'
              ELSE 'reduce deployment cadence from daily to every other day'
            END
            WHEN 'action' THEN 'Action: ' || CASE s % 3
              WHEN 0 THEN 'deployed query optimization to production'
              WHEN 1 THEN 'merged PR #' || (100 + s) || ' and deployed to staging'
              ELSE 'updated runbook with incident response steps'
            END
            WHEN 'reflection' THEN 'Retrospective: ' || CASE s % 3
              WHEN 0 THEN 'connection pooling reduced P95 latency by 40%'
              WHEN 1 THEN 'team agrees pagination was the right call'
              ELSE 'should add monitoring before next deployment'
            END
          END,
          sig_agent,
          CASE WHEN sig_agent = 'agent' THEN
            CASE WHEN i % 3 = 1 THEN review_bot_id
                 WHEN i % 3 = 2 THEN deploy_bot_id
                 ELSE pipeline_agent
            END
          ELSE NULL END,
          CASE WHEN sig_agent = 'agent' THEN est_min ELSE NULL END,
          signal_ts,
          CASE WHEN sig_agent = 'agent' THEN ('{"source":"demo_seed","duration_min":' || est_min || '}')::JSONB ELSE '{}'::JSONB END
        );
      END LOOP;
      END IF;
    END;
  END LOOP;

  -- ═══════════════════════════════════════════════════════════
  -- 7. BACKFILL last_signal_at (before trigger, for historical data)
  -- ═══════════════════════════════════════════════════════════

  UPDATE loops l SET last_signal_at = (
    SELECT MAX(ws.created_at) FROM work_signals ws WHERE ws.loop_id = l.id
  );

  -- ═══════════════════════════════════════════════════════════
  -- 8. ADDITIONAL STUCK LOOPS (old, no signals in 30+ days)
  -- Creates loops with no recent signals for stuck detection
  -- ═══════════════════════════════════════════════════════════

  INSERT INTO loops (id, user_id, org_id, title, status, scope, confidence_index, ipl_minutes, created_at, last_signal_at)
  VALUES
    ('00000000-0000-0000-0000-000000000040', alice_id, team_org_id, 'Legacy migration planning', 'open', 'personal', 22, 8,
     now() - interval '60 days', now() - interval '45 days'),
    ('00000000-0000-0000-0000-000000000041', bob_id, team_org_id, 'Evaluate new CSS framework', 'open', 'personal', 15, 3,
     now() - interval '50 days', now() - interval '40 days'),
    ('00000000-0000-0000-0000-000000000042', carol_id, team_org_id, 'Research monitoring tools', 'open', 'team', 18, 5,
     now() - interval '45 days', now() - interval '35 days'),
    ('00000000-0000-0000-0000-000000000043', alice_id, team_org_id, 'API versioning strategy', 'open', 'team', 30, 12,
     now() - interval '70 days', now() - interval '55 days')
  ON CONFLICT (id) DO NOTHING;

  -- Add last_signal_at for stuck loops
  UPDATE loops SET last_signal_at = created_at + interval '15 days'
  WHERE id IN ('00000000-0000-0000-0000-000000000040', '00000000-0000-0000-0000-000000000041',
               '00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000043');

  -- ═══════════════════════════════════════════════════════════
  -- 9. COMPLETED ANALYSES
  -- ═══════════════════════════════════════════════════════════

  INSERT INTO analyses (id, org_id, template_key, period_label, prompt_used, data_inputs, llm_config_id, llm_provider, llm_model, result, status, created_by, created_at, completed_at)
  VALUES
    (analysis_roi, team_org_id, 'roi_snapshot', 'Últimos 30 días',
     'Eres un analista de productividad…',
     '{"ipl_hours_total": 42.5, "hourly_rate": 75, "savings_usd": 3187.50, "loops_closed": 6, "active_users": 3}'::JSONB,
     llm_anthropic, 'anthropic', 'claude-sonnet-4-20250514',
     '{"headline_summary": "Engineering Co. ahorró $3,187.50 en 30 días automatizando con agentes de IA", "savings_estimate_usd": 3187.50, "key_drivers": [{"driver": "Automatización de code review", "contribution_pct": 45}, {"driver": "Pipeline de CI/CD optimizado", "contribution_pct": 35}, {"driver": "Monitoreo de datos automatizado", "contribution_pct": 20}], "recommendations": [{"title": "Expandir al equipo de producto", "rationale": "Alto potencial de ROI no aprovechado"}, {"title": "Automatizar tests end-to-end", "rationale": "Reduciría horas de QA manual"}], "narrative_md": "## Resumen de ROI\n\nEngineering Co. generó **$3,187.50** en ahorro estimado durante los últimos 30 días gracias a la automatización con agentes de IA.\n\n### Drivers principales\n- **Code Review Bot** lidera con un 45% del ahorro total\n- **Deploy Bot** contribuye con un 35% mediante pipelines optimizados\n- **Data Pipeline Agent** aporta un 20% en monitoreo de datos\n\n### Recomendaciones\n1. Expandir el uso de agentes al equipo de producto\n2. Automatizar los tests end-to-end para reducir horas de QA manual"}'::JSONB,
     'succeeded', alice_id, now() - interval '5 days', now() - interval '5 days' + interval '30 seconds'),

    (analysis_stuck, team_org_id, 'stuck_loops', 'Últimos 7 días',
     'Eres un analista de productividad…',
     '{"stuck_loops": [{"title": "Legacy migration planning", "days_idle": 45}, {"title": "Evaluate new CSS framework", "days_idle": 40}], "total_stuck": 4}'::JSONB,
     llm_anthropic, 'anthropic', 'claude-sonnet-4-20250514',
     '{"stuck_loops": [{"title": "Legacy migration planning", "loop_id": "00000000-0000-0000-0000-000000000040", "days_idle": 45, "owner": "Alice Chen"}, {"title": "Evaluate new CSS framework", "loop_id": "00000000-0000-0000-0000-000000000041", "days_idle": 40, "owner": "Bob Martínez"}, {"title": "Research monitoring tools", "loop_id": "00000000-0000-0000-0000-000000000042", "days_idle": 35, "owner": "Carol Kim"}, {"title": "API versioning strategy", "loop_id": "00000000-0000-0000-0000-000000000043", "days_idle": 55, "owner": "Alice Chen"}], "common_pattern": "Tareas de investigación y planificación sin fecha límite clara", "suggested_intervention": "Agendar una reunión de revisión semal de los loops atascados y asignar deadlines explícitos", "narrative_md": "## Loops Atascados\n\nSe identificaron **4 loops** sin actividad en más de 30 días.\n\n### Patrón común\nLas tareas de investigación y planificación tienden a quedarse estancadas por falta de deadlines.\n\n### Intervención sugerida\nRevisar semanalmente los loops inactivos y asignar fechas límite."}'::JSONB,
     'succeeded', alice_id, now() - interval '3 days', now() - interval '3 days' + interval '45 seconds'),

    (analysis_adopt, team_org_id, 'adoption_curve', 'Últimos 90 días',
     'Eres un analista de productividad…',
     '{"weekly_data": [{"week": "2026-02-02", "active_users": 1, "loops_created": 3}, {"week": "2026-02-09", "active_users": 2, "loops_created": 5}, {"week": "2026-02-16", "active_users": 3, "loops_created": 7}, {"week": "2026-02-23", "active_users": 3, "loops_created": 4}, {"week": "2026-03-02", "active_users": 3, "loops_created": 6}], "total_members": 4}'::JSONB,
     llm_openai, 'openai', 'gpt-4o-2025-06-01',
     '{"adoption_trend": "creciendo", "risks": ["Dependencia excesiva de un solo agente (Code Review Bot)", "Dos miembros del equipo apenas están usando la plataforma"], "next_action": "Onboarding personalizado para Bob y Carol para aumentar su adopción", "narrative_md": "## Adopción\n\nLa adopción de Loopy en Engineering Co. está **creciendo**.\n\n### Métricas clave\n- De 1 usuario activo hace 3 meses a 3 usuarios activos hoy\n- Pico de 7 loops creados en una semana\n\n### Riesgos\n- Code Review Bot concentra demasiado uso\n- Dos miembros tienen baja participación\n\n### Próximo paso\nRealizar una sesión de onboarding personalizada para Bob y Carol."}'::JSONB,
     'succeeded', alice_id, now() - interval '2 days', now() - interval '2 days' + interval '20 seconds')
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 10. SCHEDULED ANALYSES
  -- ═══════════════════════════════════════════════════════════

  INSERT INTO analysis_schedules (id, org_id, template_key, period, cadence, hour, timezone, llm_config_id, is_active, last_run_at, next_run_at, created_by)
  VALUES
    (sched_weekly, team_org_id, 'roi_snapshot', 'last_30d', 'weekly', 8, 'America/Mexico_City', llm_anthropic, TRUE,
     now() - interval '7 days', now() + interval '1 day', alice_id),
    (sched_monthly, team_org_id, 'stuck_loops', 'last_7d', 'monthly', 9, 'America/Mexico_City', llm_anthropic, TRUE,
     now() - interval '28 days', now() + interval '3 days', alice_id)
  ON CONFLICT (id) DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- 11. CUSTOM PROMPT OVERRIDES
  -- ═══════════════════════════════════════════════════════════

  INSERT INTO analysis_templates (org_id, template_key, prompt, updated_by)
  VALUES
    (team_org_id, 'roi_snapshot',
     'Eres un analista financiero. Analiza estos datos de ROI en español mexicano para {{org_name}}. Enfócate en el ahorro en USD y recomendaciones accionables.',
     alice_id),
    (team_org_id, 'stuck_loops',
     'Eres un coach de productividad. Revisa los loops atascados y sugiere intervenciones prácticas en español.',
     alice_id)
  ON CONFLICT (org_id, template_key) DO UPDATE SET prompt = EXCLUDED.prompt, updated_by = EXCLUDED.updated_by;

  -- ═══════════════════════════════════════════════════════════
  -- 12. SKILLS AND TOOLS (for agent detail page)
  -- ═══════════════════════════════════════════════════════════

  -- Skills for Code Review Bot
  INSERT INTO agent_skills (agent_id, skill_name, version, description, source, metadata, is_active, registered_at, last_seen_at) VALUES
    (review_bot_id, 'code-review', '1.2.0', 'Automated code review with best practice checks', 'built-in', '{"patterns": ["security", "performance", "style"]}'::JSONB, TRUE,
     now() - interval '60 days', now() - interval '1 hour'),
    (review_bot_id, 'pr-triage', '1.0.0', 'Auto-assign PR reviewers based on file ownership', 'user', '{}'::JSONB, TRUE,
     now() - interval '30 days', now() - interval '1 hour'),
    (review_bot_id, 'dependency-check', '0.9.0', 'Scan for vulnerable dependencies in PRs', 'plugin', '{"scanner": "npm audit"}'::JSONB, TRUE,
     now() - interval '15 days', now() - interval '1 hour')
  ON CONFLICT DO NOTHING;

  -- Tools for Code Review Bot
  INSERT INTO agent_tools (agent_id, tool_name, tool_type, provider, description, metadata, is_active, registered_at, last_seen_at) VALUES
    (review_bot_id, 'github-api', 'connector', 'GitHub', 'Access PRs, issues, and repos', '{"version": "2023-01-01"}'::JSONB, TRUE,
     now() - interval '60 days', now() - interval '1 hour'),
    (review_bot_id, 'slack-notify', 'connector', 'Slack', 'Send review notifications', '{}'::JSONB, TRUE,
     now() - interval '30 days', now() - interval '1 hour'),
    (review_bot_id, 'codeql-scanner', 'mcp', 'GitHub', 'Run CodeQL analysis on PRs', '{"languages": ["typescript", "python"]}'::JSONB, TRUE,
     now() - interval '15 days', now() - interval '1 hour')
  ON CONFLICT DO NOTHING;

  -- Skills for Deploy Bot
  INSERT INTO agent_skills (agent_id, skill_name, version, description, source, metadata, is_active, registered_at, last_seen_at) VALUES
    (deploy_bot_id, 'deploy-orchestrator', '2.1.0', 'Manage multi-environment deployments', 'built-in', '{"envs": ["staging", "production"]}'::JSONB, TRUE,
     now() - interval '90 days', now() - interval '2 hours'),
    (deploy_bot_id, 'rollback-manager', '1.5.0', 'Automated rollback on failed health checks', 'user', '{}'::JSONB, TRUE,
     now() - interval '45 days', now() - interval '2 hours'),
    (deploy_bot_id, 'canary-analyzer', '0.8.0', 'Analyze canary deployment metrics', 'plugin', '{"metrics": ["error_rate", "latency"]}'::JSONB, FALSE,
     now() - interval '60 days', now() - interval '30 days')
  ON CONFLICT DO NOTHING;

  -- Tools for Deploy Bot
  INSERT INTO agent_tools (agent_id, tool_name, tool_type, provider, description, metadata, is_active, registered_at, last_seen_at) VALUES
    (deploy_bot_id, 'docker-registry', 'connector', 'Docker Hub', 'Push and pull container images', '{}'::JSONB, TRUE,
     now() - interval '90 days', now() - interval '2 hours'),
    (deploy_bot_id, 'k8s-client', 'connector', 'Kubernetes', 'Manage k8s deployments and services', '{"version": "1.28"}'::JSONB, TRUE,
     now() - interval '90 days', now() - interval '2 hours'),
    (deploy_bot_id, 'datadog-metrics', 'mcp', 'Datadog', 'Query deployment metrics and alerts', '{"site": "us5.datadoghq.com"}'::JSONB, TRUE,
     now() - interval '30 days', now() - interval '2 hours')
  ON CONFLICT DO NOTHING;

  -- Skills for Data Pipeline Agent
  INSERT INTO agent_skills (agent_id, skill_name, version, description, source, metadata, is_active, registered_at, last_seen_at) VALUES
    (pipeline_agent, 'etl-orchestrator', '1.0.0', 'Orchestrate ETL pipeline runs', 'built-in', '{"frequency": "hourly"}'::JSONB, TRUE,
     now() - interval '45 days', now() - interval '30 minutes'),
    (pipeline_agent, 'data-quality', '0.7.0', 'Monitor data quality and schema changes', 'user', '{}'::JSONB, TRUE,
     now() - interval '20 days', now() - interval '30 minutes')
  ON CONFLICT DO NOTHING;

  -- Tools for Data Pipeline Agent
  INSERT INTO agent_tools (agent_id, tool_name, tool_type, provider, description, metadata, is_active, registered_at, last_seen_at) VALUES
    (pipeline_agent, 's3-client', 'connector', 'AWS', 'Read/write data from S3 buckets', '{"region": "us-east-1"}'::JSONB, TRUE,
     now() - interval '45 days', now() - interval '30 minutes'),
    (pipeline_agent, 'snowflake-query', 'connector', 'Snowflake', 'Run analytical queries on data warehouse', '{}'::JSONB, TRUE,
     now() - interval '45 days', now() - interval '30 minutes'),
    (pipeline_agent, 'pagerduty-alert', 'function', 'PagerDuty', 'Trigger alerts on pipeline failures', '{"severity": "critical"}'::JSONB, TRUE,
     now() - interval '45 days', now() - interval '30 minutes')
  ON CONFLICT DO NOTHING;

  -- ═══════════════════════════════════════════════════════════
  -- DONE: Report summary
  -- ═══════════════════════════════════════════════════════════

  RAISE NOTICE 'Demo seed v0.5.0 complete: 4 users, 2 orgs, 4 agents, 34 loops, 100+ signals, 3 analyses, 2 schedules';
END $$;
