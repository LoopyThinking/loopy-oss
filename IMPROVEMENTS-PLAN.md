# Loopy OSS — Plan de mejoras (v0.2)

**Autor:** Jaime Villatoro · **Fecha:** 2026-04-23 · **Estado:** Plan aprobado — listo para convertir en issues

## 0. Decisiones tomadas

- **Multi-org desde v0.2.** No se difiere a v0.3. El modelo tendrá `users`, `organizations`, `org_members` con roles, y una noción de "org actual" en cada request.
- **IPL híbrido.** Heurística por defecto (pesos por tipo × source) con override opcional vía `estimated_human_minutes` en la señal.
- **Pesos IPL iniciales:** los propuestos en §4. Se recalibran con data real en v0.3.
- **Docs = referencia del framework Loopy.** NO documentación del software (no Mintlify, no /docs del API). Contenido conceptual tomado del framework del libro, servido estático desde la web app. Formato Q&A es válido.
- **Panel ejecutivo: austero pero útil.** Cuatro KPI cards, una gráfica de actividad, dos tablas — sin sobrediseñar.

Este documento evalúa la viabilidad y los requisitos técnicos de las cuatro mejoras solicitadas para Loopy OSS, y propone un plan por fases alineado con la hoja de ruta actual (ver `PROJECT-OSS.md`).

---

## 1. Punto de partida — qué hay hoy

Resumen rápido del repo (`loopy-oss` @ AGPL v3) para anclar el resto del documento:

**Base de datos** (`packages/db/migrations/`): solo tres tablas — `loops`, `work_signals`, `agent_registry`. No existe aún catálogo de skills, tools, organizaciones ni métricas agregadas.

**API** (`apps/api`, Hono + Node): rutas `/health`, `/loops`, `/signals`, `/agents`. El confidence index se calcula con una fórmula determinista simple por suma ponderada de tipos de señal. No hay endpoints de agregación ni administrativos.

**SDK** (`packages/sdk`): expone `LoopyBridge` (get/list/create/closeLoop), `LoopyMapper`, `LoopySignals`. No expone registro de agentes ni catálogo de capacidades.

**Web** (`apps/web`, React + Vite + Tailwind): cuatro páginas — `Login`, `Dashboard` (lista personal de loops abiertos/cerrados), `NewLoop`, `LoopDetail`. Sin navegación lateral, sin docs embebidos, sin vistas agregadas.

Lo que esto implica: las cuatro mejoras propuestas son **aditivas** — no requieren romper el modelo actual ni la API pública del SDK. Todas caben en una versión `0.2.x` sin comprometer el lanzamiento del SDK `v0.1.0-beta` previsto para la Semana 3.

---

## 2. Mejora #1 — Auto-registro vía Skills (loops, agentes, skills, tools)

### Qué se pide

Que los skills que el usuario instala en Claude Code / Cowork puedan registrar automáticamente en la instancia Loopy OSS:

- **Loops** que el usuario crea al trabajar (ya posible — existe `createLoop`).
- **Agentes** (ya posible — existe `POST /agents`, aunque no expuesto en SDK).
- **Skills** — qué skills tiene instalado cada agente, versión, descripción. **Nuevo.**
- **Tools** — qué herramientas (MCP, conectores) están disponibles al agente. **Nuevo.**

### Viabilidad

**Alta.** El patrón ya existe para `agent_registry`; se replica para Skills y Tools. El mayor trabajo es decidir el modelo relacional y exponer endpoints idempotentes (upsert) para que los skills puedan reportar su estado sin duplicar registros en cada activación.

### Cambios requeridos

**DB** — nueva migración `005_create_capabilities.sql`:

```
agent_skills        (id, agent_id → agent_registry, skill_name, version,
                     description, source, metadata, registered_at, last_seen_at)
agent_tools         (id, agent_id → agent_registry, tool_name, tool_type,
                     provider, description, metadata, registered_at, last_seen_at)
```

Con `UNIQUE (agent_id, skill_name)` y `UNIQUE (agent_id, tool_name)` para soportar upserts. `source` en skills distingue built-in / user / plugin. `tool_type` en tools distingue `mcp` / `connector` / `function`.

**API** — nuevas rutas bajo `/agents/:id/`:

- `POST /agents/:id/skills` — upsert de un skill (idempotente).
- `POST /agents/:id/skills/batch` — registro masivo al arrancar sesión.
- `GET  /agents/:id/skills` — listar skills registrados.
- Equivalentes para `/tools`.

Autenticación: el Bearer token del agente ya existe; basta validar que `agent_id` en la ruta coincide con el token.

**SDK** — nuevas clases que se documentan para uso desde skills:

```ts
new LoopyBridge({ token }).registerSkill({ name, version, description, source })
new LoopyBridge({ token }).registerTool({ name, type, provider, description })
new LoopyBridge({ token }).registerBatch({ skills: [...], tools: [...] })
```

**Skills helper** — en `packages/skills/` (o el paquete equivalente — hoy no existe como carpeta, habría que crearla), una utilidad `registerCapabilities()` que lea `SKILL.md` y `.mcp.json` del agente y publique todo de una vez. Esto es lo que convierte "el usuario instala y ya" en una experiencia real.

### Esfuerzo estimado

2–3 días: 1 día DB + API, 1 día SDK + tests, 0.5–1 día helper de skills y docs.

### Riesgos / decisiones abiertas

- **Unicidad por agente vs. por usuario.** Si dos agentes del mismo usuario registran el mismo skill, ¿es una entrada o dos? Recomendación: una entrada por `(agent_id, skill_name)` — los agentes son el actor principal.
- **PII en metadata.** Los skills pueden reportar descripciones largas. Acotar `description` a ~500 chars y `metadata` JSONB a 8 KB.
- **Retención.** Un skill desinstalado no debería persistir infinito. Propongo columna `last_seen_at` y un job opcional que marque como `inactive` a los >30 días.

---

## 3. Mejora #2 — Panel ejecutivo

### Qué se pide

Una vista agregada que sirva como dashboard de gestión — no la vista personal del usuario, sino una mirada organizacional.

### Viabilidad

**Media-alta.** Requiere dos cosas nuevas: (a) concepto de organización / visibilidad cross-user, y (b) consultas agregadas. La parte UI es mecánica (Recharts); la parte de modelo de permisos es la que merece diseño.

### Cambios requeridos

**Modelo multi-org (decidido).** Se introducen tres tablas nuevas y se migran las existentes:

```
users           (id, email, display_name, created_at)  -- hoy user_id vive "flotante"
organizations   (id, name, slug, created_at)
org_members     (user_id, org_id, role, joined_at)
                 role IN ('viewer', 'member', 'admin', 'owner')
```

Y se añade `org_id` NOT NULL a `loops`, `work_signals`, `agent_registry`, con índices compuestos `(org_id, ...)` para las queries del panel.

Cada request llevará una "org actual": la forma más limpia es un header `X-Org-Id` que el middleware de auth valida contra `org_members`. El web app tendrá un selector de org en el header cuando el user tenga más de una membresía.

Migración de datos existentes: para quien ya corrió `v0.1.0-beta`, el script de upgrade crea una org por usuario (`"{email}'s workspace"`) y asocia todo su contenido a ella. Sin pérdida de datos.

**API** — nuevas rutas `/admin/*` (solo rol `admin`):

- `GET /admin/overview` — KPIs globales (total loops, loops activos, señales último 30d, confidence promedio, IPL total).
- `GET /admin/loops?groupBy=scope|status|owner` — agregaciones.
- `GET /admin/agents` — lista de agentes activos con su última señal.
- `GET /admin/activity?window=7d|30d|90d` — serie de tiempo de señales.

**Web** — nueva página `/admin` con diseño austero:

- Cuatro tarjetas KPI arriba (loops activos, cerrados 30d, confidence promedio, IPL acumulado en horas).
- Una gráfica de señales por día de los últimos 30 días (Recharts — hay que añadirla como dep).
- Tabla de loops ordenable por confidence, edad, señales.
- Tabla de agentes con columna "última actividad".

Nada más. Sin pestañas, sin filtros avanzados, sin heatmaps — el margen para elaboración queda para el panel Cloud.

### Esfuerzo estimado

6–7 días con multi-org desde el inicio: 2.5 días modelo users/orgs/members + migración de datos + tests de aislamiento, 1 día middleware y selector de org, 1 día endpoints admin, 2 días UI con charts.

### Riesgos / decisiones abiertas

- **Privacidad.** Un admin NO debe ver el `content` de señales de loops personales de otros miembros — solo métricas agregadas. Se refuerza en las queries: detalles completos solo cuando `scope IN ('team','organizational')`; el agregado global usa solo counts.
- **Invitaciones.** Multi-org necesita un flujo de "invitar a la org". Para v0.2 basta un endpoint `POST /orgs/:id/invites` que genera un link de aceptación con token — sin email transaccional (eso queda para v0.3 o lo cubre el operador).

---

## 4. Mejora #3 — IPL simplificado por loop

### Qué se pide

Medir el Índice de Productividad Liberada de cada loop — cuántas horas de trabajo humano "ejecutó" el agente — en una versión liviana apta para self-hosting (la versión Cloud usa un modelo más sofisticado que no queremos exponer).

### Viabilidad

**Alta, con una decisión de diseño importante:** ¿cómo se infiere "horas liberadas" sin IA? La versión Cloud usa un clasificador. La versión OSS tiene dos caminos honestos:

1. **IPL declarativo** — el agente reporta `estimated_human_minutes` al emitir cada señal. Es explícito, trivial de implementar y auditable.
2. **IPL por heurística** — tabla de pesos por tipo de señal × source (agente vs. humano). Ej: un `decision` del agente = 15 min liberados; un `action` = 8 min. No requiere input extra.

**Recomiendo ambos:** la heurística por defecto, sobreescribible con `metadata.estimated_human_minutes` cuando el skill lo reporte. Así la curva de adopción es suave y los skills maduros pueden afinar.

### Cambios requeridos

**DB** — migración `006_add_ipl.sql`:

```
ALTER TABLE loops ADD COLUMN ipl_minutes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE work_signals
  ADD COLUMN estimated_human_minutes INTEGER
  CHECK (estimated_human_minutes >= 0 AND estimated_human_minutes <= 480);
```

**API** — lógica de recálculo en `routes/loops.ts`, espejo de `recalculateConfidence`:

```ts
const IPL_WEIGHTS_AGENT = { perception: 3, interpretation: 8, decision: 15,
                             action: 10, reflection: 6 }
// Humano no suma IPL — el IPL mide aporte del agente.
function recalculateIpl(loopId): number // suma agente signals con weight o metadata override
```

Exponer en `GET /loops/:id` el campo `ipl_minutes` y `ipl_hours` (derivado).

**Web** — componente `<IPLBadge minutes={...} />` junto al `<ConfidenceBadge>` en `LoopCard` y `LoopDetail`. En el panel ejecutivo, suma total de IPL en tarjeta KPI.

**SDK** — tipo `WorkSignal` gana campo opcional `estimatedHumanMinutes` que se envía en metadata.

### Esfuerzo estimado

2 días: 0.5 día migración + lógica API, 0.5 día tests con casos dorados, 1 día UI.

### Riesgos / decisiones abiertas

- **Pesos por defecto.** Los que propongo son tentativos. Recomiendo calibrarlos contra 3–5 loops reales antes de congelarlos en la migración.
- **Manipulabilidad.** Un agente malicioso podría inflar `estimated_human_minutes`. Para OSS esto es problema del operador; en Cloud lo recortaríamos. Documentar claramente.
- **Reversibilidad.** La fórmula vive en código — cualquier fork puede cambiarla. Perfecto para AGPL, pero hace inútil comparar IPL entre instancias distintas. Decir esto explícito en los docs.

---

## 5. Mejora #4 — Referencia del framework y navegación

### Qué se pide

Dos cosas distintas bajo un mismo paraguas:

1. **Navegación básica** en la web app para que el usuario no quede perdido (sidebar, breadcrumbs, menú de usuario).
2. **Contenido de referencia del framework Loopy** — conceptos del libro expuestos como respaldo estático dentro de la app. NO es documentación del software. Formato Q&A es válido.

### Viabilidad

**Alta.** El contenido ya existe en el libro/framework; el trabajo es curarlo, no redactar desde cero. Técnicamente es lo más liviano del plan.

### Cambios requeridos

**Navegación.** Hoy `App.tsx` solo tiene un header con logo y "Sign out". Se añaden:

- Sidebar fija con íconos (Lucide): Dashboard, Loops, Agentes, Admin (visible solo si rol admin), Framework, Ajustes.
- Selector de org en el header (cuando el user pertenezca a >1 org).
- Breadcrumbs en páginas anidadas (`/loops/:id` → "Dashboard › Loop: …").
- Menú de usuario en header con "Mi perfil", "Mi token de agente", "Salir".

**Página `/framework` — referencia del libro.** Contenido estático bundled con la web app, sin backend ni Mintlify. Implementación:

- Fuente en `apps/web/src/content/framework/` como `.md` o `.mdx`, cargados con `vite-plugin-mdx` al build.
- Un layout tipo "libro abierto": TOC a la izquierda, contenido al centro, máx 720px de ancho para lectura cómoda.
- Formato mezclado: secciones expositivas + bloques Q&A colapsables.

**Contenido inicial a cubrir** (versión mínima, expandible):

- *El ciclo cognitivo del loop* — Perceive → Interpret → Decide → Act → Reflect, con ejemplo.
- *Qué es una Work Signal* — taxonomía de los cinco tipos y cuándo usar cada uno.
- *Confidence Index* — qué significa estar "confiado", por qué es una herramienta de gobernanza y no un score de vanidad.
- *IPL* — qué mide (horas humanas liberadas), qué NO mide (calidad, outcome), fórmula de la versión OSS.
- *Scope de un loop* — personal / team / organizational y cuándo corresponde cada uno.
- *Q&A frecuentes* — "¿Cuándo cierro un loop?", "¿Puede un loop quedarse abierto indefinidamente?", "¿Qué pasa si la hipótesis cambia?", "¿Un loop puede tener sub-loops?", "¿Cómo sé si una señal va o no va?".

**Tooltips contextuales.** En `ConfidenceBadge` y `IPLBadge`, hover con definición corta y link a la sección correspondiente de `/framework`.

### Esfuerzo estimado

3 días: 1 día sidebar + selector de org + breadcrumbs, 0.5 día pipeline MDX y layout, 1.5 días curar contenido del framework (lo más importante que esté bien escrito).

### Riesgos / decisiones abiertas

- **Idioma.** Recomiendo empezar solo en español — es tu audiencia inicial y te ahorra mantener dos versiones mientras el contenido todavía evoluciona. El README del repo queda en inglés (alcance GitHub).
- **Versionado del framework.** Si el libro evoluciona, el contenido embebido queda obsoleto. Sugiero un pie de página en `/framework` que indique "Basado en el framework Loopy vX.Y — [libro]" para que sea trazable.

---

## 6. Plan por fases sugerido

Encaja las cuatro mejoras como un bloque `v0.2.x` posterior al `v0.1.0-beta` del SDK. Respeta las fases actuales del PROJECT-OSS.

| Fase | Semanas | Entregable | Incluye |
|------|---------|-----------|---------|
| **v0.1.0-beta** | 1–3 (hasta 2026-05-11) | SDK + self-host básico | Lo ya planificado. **No tocar.** |
| **v0.2.0** | 4–6 (2026-05-12 a 2026-06-01) | Auto-registro + IPL | Mejoras #1 y #3 — cambios de schema aditivos + SDK extendido. Se libera con la misma ventana de Docker/Mintlify. |
| **v0.2.1** | 7–9 (2026-06-02 a 2026-06-23) | Multi-org + panel + nav + framework | Mejoras #2 y #4 — incluye el trabajo extra de multi-org (users, orgs, members, migración). Lo que da la cara visual del lanzamiento HN/PH. |
| **v0.3.0** | 10–11 | Hardening | Afinar pesos IPL con data real, flujo de invitaciones a org, pulir onboarding de self-host. |

### Orden de ataque propuesto

1. **Migración 005 (capabilities).** Base de la mejora 1. No bloquea nada.
2. **SDK + endpoints skills/tools.** Desbloquea el registro desde skills externos — cuanto antes, mejor, porque necesita tiempo de prueba con los skills reales.
3. **Migración 006 (IPL) + fórmula.** Aditiva; mientras esté en `0.2.0-rc` los pesos pueden cambiar sin romper nada.
4. **Modelo org + endpoints admin.** Aquí se concentra el riesgo — hacerlo con tests de aislamiento.
5. **Sidebar + panel ejecutivo UI + docs embebidos.** Última capa; se beneficia de que todo lo de abajo ya estabilice.

---

## 7. Lo que NO incluye este plan (para que no quede ambigüedad)

- MCP server `loopy-mcp` — sigue siendo Phase 4 (julio 2026).
- Clasificación de señales con IA — se queda en Cloud.
- Billing / pricing / limits — no pertenecen a la OSS.
- A2A / coordinación entre agentes — existe en Cloud, no se porta todavía.
- Auditoría SOC2 / logs inmutables — si un operador lo necesita, lo construye por encima.
- Email transaccional para invitaciones a org — el endpoint genera un link, el operador elige cómo entregarlo.
- Documentación del software (API reference, SDK docs) — vive en Mintlify (Cloud). La `/framework` embebida es solo contenido conceptual del libro.

---

**Próximo paso sugerido:** convertir los cuatro bloques en issues de GitHub con checklist. Si quieres, te preparo las plantillas listas para pegar en `loopy-thinking/loopy-oss`.
