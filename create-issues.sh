#!/usr/bin/env bash
# =============================================================================
# Loopy OSS — Crear issues de GitHub (v0.2.x improvements)
# Ejecutar desde la raíz del repo con `gh` autenticado:
#   chmod +x create-issues.sh && ./create-issues.sh
# =============================================================================

REPO="LoopyThinking/loopy-oss"

echo "▶ Creando labels..."
gh label create "v0.2.0"   --repo $REPO --description "Target release v0.2.0" --color "e4e669" 2>/dev/null || true
gh label create "v0.2.1"   --repo $REPO --description "Target release v0.2.1" --color "d4c5f9" 2>/dev/null || true
gh label create "backend"  --repo $REPO --description "API, DB, lógica de negocio" --color "0052cc" 2>/dev/null || true
gh label create "frontend" --repo $REPO --description "Web app, UI" --color "f9d0c4" 2>/dev/null || true
gh label create "sdk"      --repo $REPO --description "SDK changes" --color "c2e0c6" 2>/dev/null || true
gh label create "database" --repo $REPO --description "Schema migrations" --color "bfd4f2" 2>/dev/null || true

M1_TITLE="v0.2.0 — Auto-registro + IPL"
M2_TITLE="v0.2.1 — Multi-org + Panel + Nav + Framework"

echo "▶ Creando milestones..."
gh api repos/$REPO/milestones --method POST \
  -f title="$M1_TITLE" \
  -f description="Semanas 4–6 (2026-05-12 a 2026-06-01)" \
  -f due_on="2026-06-01T07:00:00Z" \
  -f state="open" > /dev/null 2>/dev/null || true

gh api repos/$REPO/milestones --method POST \
  -f title="$M2_TITLE" \
  -f description="Semanas 7–9 (2026-06-02 a 2026-06-23)" \
  -f due_on="2026-06-23T07:00:00Z" \
  -f state="open" > /dev/null 2>/dev/null || true

echo "  Milestone '$M1_TITLE' — listo"
echo "  Milestone '$M2_TITLE' — listo"

# =============================================================================
# ISSUE #1 — Auto-registro vía Skills (capabilities: skills + tools)
# =============================================================================
echo "▶ Creando Issue #1 — Auto-registro vía Skills..."
gh issue create \
  --repo $REPO \
  --milestone "$M1_TITLE" \
  --label "enhancement,backend,sdk,database,v0.2.0" \
  --title "feat: Auto-registro de skills y tools desde agentes externos" \
  --body "$(cat <<'BODY'
## Contexto

Hoy el agente puede crear loops y registrar su identidad (`POST /agents`), pero no puede declarar qué skills ni qué tools tiene disponibles. Esto impide que Loopy muestre el *mapa de capacidades* de cada agente y que los skills externos (Claude Code / Cowork) reporten su estado al arrancar sesión.

## Objetivo

Permitir que cualquier skill que use `LoopyBridge` registre de forma idempotente (upsert) sus skills y tools instalados contra la instancia Loopy OSS.

---

## Checklist — DB

- [ ] Migración `005_create_capabilities.sql`
  - [ ] Tabla `agent_skills` (`id`, `agent_id` → `agent_registry`, `skill_name`, `version`, `description`, `source`, `metadata` JSONB, `registered_at`, `last_seen_at`)
  - [ ] Tabla `agent_tools` (`id`, `agent_id` → `agent_registry`, `tool_name`, `tool_type`, `provider`, `description`, `metadata` JSONB, `registered_at`, `last_seen_at`)
  - [ ] `UNIQUE (agent_id, skill_name)` y `UNIQUE (agent_id, tool_name)` para soportar upserts
  - [ ] `source` en skills: `built-in | user | plugin`
  - [ ] `tool_type` en tools: `mcp | connector | function`
  - [ ] Check `description` ≤ 500 chars, `metadata` JSONB ≤ 8 KB

## Checklist — API (`apps/api`)

- [ ] `POST /agents/:id/skills` — upsert de un skill (idempotente vía `ON CONFLICT`)
- [ ] `POST /agents/:id/skills/batch` — registro masivo al arrancar sesión
- [ ] `GET  /agents/:id/skills` — listar skills del agente
- [ ] `POST /agents/:id/tools` — upsert de un tool
- [ ] `POST /agents/:id/tools/batch` — registro masivo
- [ ] `GET  /agents/:id/tools` — listar tools del agente
- [ ] Validar que el `agent_id` del token coincide con el `:id` de la ruta
- [ ] Tests de integración: upsert idempotente no duplica; `last_seen_at` se actualiza

## Checklist — SDK (`packages/sdk`)

- [ ] `LoopyBridge.registerSkill({ name, version, description, source })`
- [ ] `LoopyBridge.registerTool({ name, type, provider, description })`
- [ ] `LoopyBridge.registerBatch({ skills: [...], tools: [...] })`
- [ ] Tipos TypeScript exportados: `AgentSkill`, `AgentTool`, `RegisterBatchPayload`
- [ ] Tests unitarios con mock de API

## Checklist — Skills helper (`packages/skills/`)

- [ ] Crear carpeta `packages/skills/` si no existe
- [ ] Utilidad `registerCapabilities()` que lee `SKILL.md` + `.mcp.json` del agente
- [ ] Publica todo de una vez via `registerBatch`
- [ ] Documentar uso en README del paquete

## Decisiones de diseño

- **Unicidad:** una entrada por `(agent_id, skill_name)` — no por usuario.
- **Retención:** columna `last_seen_at`; job opcional que marca `inactive` a los >30 días sin actividad.
- **PII:** `description` acotado, `metadata` limitado a 8 KB.

## Estimación

~2–3 días: 1 día DB + API, 1 día SDK + tests, 0.5–1 día helper + docs.

## Referencias

Ver `improvements-plan.md` §2 para análisis completo de viabilidad y riesgos.
BODY
)"

# =============================================================================
# ISSUE #2 — Panel ejecutivo (multi-org)
# =============================================================================
echo "▶ Creando Issue #2 — Panel ejecutivo + multi-org..."
gh issue create \
  --repo $REPO \
  --milestone "$M2_TITLE" \
  --label "enhancement,backend,frontend,database,v0.2.1" \
  --title "feat: Panel ejecutivo con modelo multi-org" \
  --body "$(cat <<'BODY'
## Contexto

La web app actual tiene solo una vista personal de loops. No existe concepto de organización ni forma de ver métricas agregadas del equipo. Para que Loopy OSS sea útil como herramienta de gestión (no solo personal), necesitamos una capa de organización y un dashboard ejecutivo austero.

## Objetivo

Introducir el modelo multi-org y una vista `/admin` con KPIs globales, gráfica de actividad y tablas de loops/agentes — sin sobrediseñar.

---

## Checklist — DB: modelo multi-org

- [ ] Migración `007_multi_org.sql`
  - [ ] Tabla `users` (`id`, `email`, `display_name`, `created_at`)
  - [ ] Tabla `organizations` (`id`, `name`, `slug`, `created_at`)
  - [ ] Tabla `org_members` (`user_id`, `org_id`, `role`, `joined_at`) — `role IN ('viewer','member','admin','owner')`
  - [ ] Añadir `org_id NOT NULL` a `loops`, `work_signals`, `agent_registry`
  - [ ] Índices compuestos `(org_id, ...)` para queries del panel
- [ ] Script de migración de datos existentes (`v0.1.0-beta → v0.2.1`)
  - [ ] Crear una org por usuario existente (`"{email}'s workspace"`)
  - [ ] Asociar todos sus loops/signals/agents a la nueva org
  - [ ] Sin pérdida de datos — verificar con test de integridad

## Checklist — API

- [ ] Middleware de auth: extraer `X-Org-Id` header y validar contra `org_members`
- [ ] `GET /admin/overview` — KPIs: loops activos, cerrados 30d, confidence promedio, IPL total
- [ ] `GET /admin/loops?groupBy=scope|status|owner` — agregaciones
- [ ] `GET /admin/agents` — lista de agentes con última señal
- [ ] `GET /admin/activity?window=7d|30d|90d` — serie de tiempo de señales por día
- [ ] `POST /orgs/:id/invites` — genera link de aceptación con token (sin email transaccional)
- [ ] Guard: rol `admin` requerido para rutas `/admin/*`
- [ ] Tests de aislamiento: org A no puede ver datos de org B

## Checklist — Web (`apps/web`)

- [ ] Nueva página `/admin` (solo visible para rol `admin`)
  - [ ] 4 tarjetas KPI: loops activos, loops cerrados 30d, confidence promedio, IPL acumulado en horas
  - [ ] Gráfica Recharts: señales por día (últimos 30 días)
  - [ ] Tabla de loops ordenable por confidence / edad / señales
  - [ ] Tabla de agentes con columna "última actividad"
- [ ] Añadir `recharts` como dependencia
- [ ] Selector de org en el header (cuando user pertenece a >1 org)

## Decisiones de diseño

- **Privacidad:** admin NO ve `content` de señales de loops personales — solo métricas agregadas. Detalles completos solo en `scope IN ('team','organizational')`.
- **Panel austero:** sin pestañas, sin filtros avanzados, sin heatmaps — eso queda para Cloud.
- **Invitaciones v0.2:** solo link de aceptación; email transaccional queda para v0.3.

## Estimación

~6–7 días: 2.5d modelo + migración + tests, 1d middleware + selector org, 1d endpoints admin, 2d UI charts.

## Referencias

Ver `improvements-plan.md` §3 para análisis completo y decisiones de privacidad.
BODY
)"

# =============================================================================
# ISSUE #3 — IPL simplificado por loop
# =============================================================================
echo "▶ Creando Issue #3 — IPL simplificado..."
gh issue create \
  --repo $REPO \
  --milestone "$M1_TITLE" \
  --label "enhancement,backend,frontend,sdk,database,v0.2.0" \
  --title "feat: IPL (Índice de Productividad Liberada) por loop" \
  --body "$(cat <<'BODY'
## Contexto

Loopy OSS no mide cuántas horas de trabajo humano "ejecutó" el agente. La versión Cloud usa un clasificador ML que no se puede portar a OSS. Para self-hosting necesitamos un cálculo honesto, auditable y calibrable.

## Objetivo

Añadir el campo `ipl_minutes` a cada loop, calculado automáticamente por una heurística de pesos por tipo de señal (sobreescribible con `estimated_human_minutes` cuando el skill lo declare explícitamente).

---

## Checklist — DB

- [ ] Migración `006_add_ipl.sql`
  - [ ] `ALTER TABLE loops ADD COLUMN ipl_minutes INTEGER NOT NULL DEFAULT 0`
  - [ ] `ALTER TABLE work_signals ADD COLUMN estimated_human_minutes INTEGER CHECK (estimated_human_minutes >= 0 AND estimated_human_minutes <= 480)`

## Checklist — API (`apps/api`)

- [ ] Constante `IPL_WEIGHTS_AGENT` en `lib/ipl.ts`:
  ```ts
  { perception: 3, interpretation: 8, decision: 15, action: 10, reflection: 6 }
  ```
  _(solo señales de agente suman IPL — humano no cuenta)_
- [ ] Función `recalculateIpl(loopId): Promise<number>` — suma señales del agente con peso o `estimated_human_minutes` si está presente (override)
- [ ] Llamar a `recalculateIpl` en `POST /signals` (igual que `recalculateConfidence`)
- [ ] `GET /loops/:id` expone `ipl_minutes` e `ipl_hours` (derivado: `ipl_minutes / 60`, 2 decimales)
- [ ] Tests con "casos dorados": verificar que override > 0 prevalece sobre heurística; verificar que señales humanas no suman
- [ ] Documentar `IPL_WEIGHTS_AGENT` como calibrable en `README` del package

## Checklist — SDK (`packages/sdk`)

- [ ] Tipo `WorkSignal` gana campo opcional `estimatedHumanMinutes?: number`
- [ ] Se envía en `metadata.estimated_human_minutes` al emitir señal

## Checklist — Web (`apps/web`)

- [ ] Componente `<IPLBadge minutes={number} />` (junto a `<ConfidenceBadge>`)
- [ ] Mostrar en `LoopCard` y `LoopDetail`
- [ ] Tooltip con definición corta + link a `/framework#ipl`
- [ ] En panel ejecutivo (`/admin`): tarjeta KPI "IPL acumulado" con suma total de org

## Decisiones de diseño

- **Híbrido:** heurística por defecto + override con `estimated_human_minutes`.
- **Pesos iniciales:** los propuestos son tentativos — calibrar contra 3–5 loops reales antes de congelarlos.
- **Manipulabilidad:** documentar que en OSS la validación es responsabilidad del operador.
- **Reversibilidad:** la fórmula vive en código — cualquier fork puede cambiarla. Documentar que IPL no es comparable entre instancias distintas.

## Estimación

~2 días: 0.5d migración + lógica API, 0.5d tests, 1d UI (badge + panel).

## Referencias

Ver `improvements-plan.md` §4 para análisis completo y tabla de pesos propuestos.
BODY
)"

# =============================================================================
# ISSUE #4 — Navegación + Referencia del framework
# =============================================================================
echo "▶ Creando Issue #4 — Navegación + framework docs..."
gh issue create \
  --repo $REPO \
  --milestone "$M2_TITLE" \
  --label "enhancement,frontend,v0.2.1" \
  --title "feat: Sidebar de navegación + página /framework (referencia del libro)" \
  --body "$(cat <<'BODY'
## Contexto

La web app tiene solo un header con logo y "Sign out". El usuario queda desorientado al navegar y no hay forma de entender qué es un loop, una señal, el Confidence Index o el IPL sin salir de la app. La referencia conceptual es el activo más valioso del framework Loopy — merece tener un lugar dentro de la app.

## Objetivo

1. **Navegación completa:** sidebar fija, breadcrumbs, menú de usuario, selector de org.
2. **Página `/framework`:** referencia estática del framework Loopy, curada del libro, servida como contenido bundled (sin backend, sin Mintlify).

---

## Checklist — Navegación (`apps/web`)

- [ ] Sidebar fija con iconos Lucide:
  - [ ] Dashboard (`/`)
  - [ ] Loops (`/loops`)
  - [ ] Agentes (`/agents`)
  - [ ] Admin (`/admin`) — visible solo si rol `admin`
  - [ ] Framework (`/framework`)
  - [ ] Ajustes (`/settings`)
- [ ] Selector de org en el header (visible cuando user pertenece a >1 org)
- [ ] Breadcrumbs en páginas anidadas (ej. `Dashboard › Loop: [título]`)
- [ ] Menú de usuario en header:
  - [ ] "Mi perfil"
  - [ ] "Mi token de agente" (copiable al portapapeles)
  - [ ] "Salir"
- [ ] Layout responsive: sidebar colapsable en pantallas < 768px

## Checklist — Pipeline MDX

- [ ] Añadir `vite-plugin-mdx` (o `@mdx-js/rollup`) como dependencia de `apps/web`
- [ ] Carpeta `apps/web/src/content/framework/` para archivos `.md` / `.mdx`
- [ ] Layout `/framework`: TOC a la izquierda, contenido al centro (máx 720px), legible

## Checklist — Contenido del framework (en español)

- [ ] `ciclo-cognitivo.mdx` — El ciclo Perceive → Interpret → Decide → Act → Reflect con ejemplo concreto
- [ ] `work-signals.mdx` — Taxonomía de los 5 tipos de señal y cuándo usar cada uno
- [ ] `confidence-index.mdx` — Qué significa el índice, por qué es herramienta de gobernanza (no vanity score)
- [ ] `ipl.mdx` — Qué mide el IPL, qué NO mide, fórmula de la versión OSS
- [ ] `scope-loop.mdx` — Personal / Team / Organizational: cuándo corresponde cada uno
- [ ] `faq.mdx` — Q&A frecuentes:
  - [ ] "¿Cuándo cierro un loop?"
  - [ ] "¿Puede un loop quedarse abierto indefinidamente?"
  - [ ] "¿Qué pasa si la hipótesis cambia?"
  - [ ] "¿Un loop puede tener sub-loops?"
  - [ ] "¿Cómo sé si una señal va o no va?"
- [ ] Pie de página en `/framework`: "Basado en el framework Loopy vX.Y" con referencia al libro

## Checklist — Tooltips contextuales

- [ ] `<ConfidenceBadge>`: hover con definición corta + link a `/framework#confidence-index`
- [ ] `<IPLBadge>`: hover con definición corta + link a `/framework#ipl`

## Decisiones de diseño

- **Idioma:** solo español en v0.2.1 — audiencia inicial hispanohablante; inglés diferido a v0.3.
- **Sin backend:** contenido bundled en el build, sin API de docs.
- **Formato mixto:** secciones expositivas + bloques Q&A colapsables.
- **Versionado:** pie de página trazable al libro para detectar desfases futuros.

## Estimación

~3 días: 1d sidebar + selector org + breadcrumbs, 0.5d pipeline MDX + layout, 1.5d curar contenido del framework.

## Referencias

Ver `improvements-plan.md` §5 para análisis completo y lista de contenido propuesta.
BODY
)"

echo ""
echo "✅ Listo. Cuatro issues creados en https://github.com/$REPO/issues"
