#!/usr/bin/env bash
# =============================================================================
# Loopy OSS — Commit + PR para feat/v0.2.0-capabilities-ipl
# Ejecutar desde la raíz del repo (ya en la rama feat/v0.2.0-capabilities-ipl)
# =============================================================================

set -e

REPO="LoopyThinking/loopy-oss"

echo "▶ Committing..."
git commit -m "$(cat <<'MSG'
feat(v0.2.0): auto-registro de capabilities (skills/tools) + IPL por loop

Implementa los Issues #1 y #3 del milestone v0.2.0.

## Issue #1 — Auto-registro de skills y tools (capabilities)

DB:
- Migración 005: tablas agent_skills y agent_tools con UNIQUE (agent_id, skill_name/tool_name)
  para upserts idempotentes; RLS espejada desde migration 004; docker/init mirror sin RLS.

API (apps/api):
- Nueva ruta capabilities.ts: POST/GET /agents/:id/skills, /skills/batch, /tools, /tools/batch
- resolveAgentOwnership() funciona con token de agente (must match) y JWT de usuario
- Validación: description ≤ 500 chars, metadata ≤ 8 KB, batch ≤ 100 items

SDK (packages/sdk):
- LoopyBridge.registerSkill(), registerTool(), registerBatch(), listSkills(), listTools()
- Tipos exportados: AgentSkill, AgentTool, RegisterSkillPayload, RegisterToolPayload, RegisterBatchPayload

## Issue #3 — IPL (Índice de Productividad Liberada) por loop

DB:
- Migración 006: columna ipl_minutes en loops, estimated_human_minutes (0–480) en work_signals
- Índice compuesto (loop_id, source) para el query de recálculo

API:
- lib/ipl.ts: IPL_WEIGHTS_AGENT { perception:3, interpretation:8, decision:15, action:10, reflection:6 }
  + recalculateIpl() — solo señales source='agent'; override por estimated_human_minutes si presente
- signals.ts: acepta estimatedHumanMinutes, dispara recalculateConfidence + recalculateIpl en Promise.all
- loops.ts: GET /loops/:id expone ipl_hours (derivado, 2 decimales)

Web (apps/web):
- IPLBadge.tsx: badge con ícono rayo, formato inteligente min→h, color violeta escalado,
  tooltip con definición + link a /framework#ipl
- LoopCard y LoopDetail muestran IPLBadge junto a ConfidenceBadge

Co-Authored-By: Claude Sonnet 4.6 (1M context) <noreply@anthropic.com>
MSG
)"

echo "▶ Pushing..."
git push -u origin feat/v0.2.0-capabilities-ipl

echo "▶ Creating PR..."
PR_BODY_FILE=$(mktemp /tmp/loopy-pr-body.XXXXXX.md)
cat > "$PR_BODY_FILE" << 'BODY'
## Resumen

Implementa los dos primeros issues del milestone **v0.2.0** ([Issues #1 y #3](https://github.com/LoopyThinking/loopy-oss/issues)).

### Issue #1 — Auto-registro de skills y tools desde agentes externos

Permite que cualquier skill/agente registre de forma **idempotente** qué capacidades tiene disponibles, construyendo un mapa de capacidades por agente en Loopy.

- **DB** — migraciones `005_create_capabilities.sql`: tablas `agent_skills` y `agent_tools` con `UNIQUE (agent_id, skill_name/tool_name)` + RLS + docker mirror
- **API** — `apps/api/src/routes/capabilities.ts`: 6 endpoints bajo `/agents/:id/skills` y `/agents/:id/tools` (upsert individual, batch, list). Ownership validation funciona con token de agente y JWT de usuario.
- **SDK** — `LoopyBridge.registerSkill()`, `.registerTool()`, `.registerBatch()`, `.listSkills()`, `.listTools()` + tipos TypeScript exportados

### Issue #3 — IPL (Índice de Productividad Liberada) por loop

Mide cuántas horas de trabajo humano ejecutó el agente en cada loop. Versión OSS usa heurística calibrable; los skills maduros pueden hacer override por señal.

- **DB** — migración `006_add_ipl.sql`: `ipl_minutes` en `loops`, `estimated_human_minutes` en `work_signals`
- **API** — `lib/ipl.ts` con `IPL_WEIGHTS_AGENT` + `recalculateIpl()`. `POST /signals` dispara recálculo en paralelo con confidence. `GET /loops/:id` expone `ipl_hours`.
- **Web** — componente `IPLBadge` con tooltip + link a `/framework#ipl`. Visible en `LoopCard` y `LoopDetail`.

## Archivos cambiados

| Área | Archivos |
|------|----------|
| DB migrations | `005_create_capabilities.sql`, `006_add_ipl.sql` (+ docker mirrors) |
| API | `routes/capabilities.ts` (new), `lib/ipl.ts` (new), `types.ts`, `routes/signals.ts`, `routes/loops.ts`, `index.ts` |
| SDK | `src/bridge.ts`, `src/types.ts`, `src/index.ts` |
| Web | `components/IPLBadge.tsx` (new), `components/LoopCard.tsx`, `pages/LoopDetail.tsx`, `lib/api.ts` |

## Test plan

- [ ] `docker-compose up` arranca sin errores con las nuevas migraciones
- [ ] `POST /agents/:id/skills` con el mismo `skillName` dos veces → un solo registro, `last_seen_at` actualizado
- [ ] `POST /signals` con `source: 'agent'` → `ipl_minutes` del loop aumenta
- [ ] `POST /signals` con `source: 'human'` → `ipl_minutes` NO cambia
- [ ] `POST /signals` con `estimatedHumanMinutes: 45` → `ipl_minutes` usa 45, no el peso por defecto
- [ ] `GET /loops/:id` devuelve `ipl_hours` correcto (e.g. 90 min → 1.5h)
- [ ] `IPLBadge` en LoopCard y LoopDetail: tooltip visible al hover, link a `/framework#ipl`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
BODY

gh pr create \
  --repo $REPO \
  --base main \
  --head feat/v0.2.0-capabilities-ipl \
  --title "feat(v0.2.0): auto-registro de capabilities + IPL por loop" \
  --body-file "$PR_BODY_FILE"

rm -f "$PR_BODY_FILE"

echo ""
echo "✅ PR creado. Revisa https://github.com/$REPO/pulls"
