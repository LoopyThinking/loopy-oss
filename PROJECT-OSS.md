# Loopy OSS — Plan Maestro de Construcción

**Inicio:** 16 de abril 2026  
**Última actualización:** 22 de abril 2026  
**Modelo:** Open Core (GitHub + npm SDK + Docker self-hosted + Cloud SaaS)  
**Licencia:** AGPL v3  
**Repo:** https://github.com/loopy-thinking/loopy-oss

---

## Filosofía del Proyecto

Loopy OSS es el **protocolo + runtime** de Loopy Thinking, no una copia recortada del producto pago.

El modelo mental central es:
> trabajo humano o de agente → Work Signal → Loop → Confidence Index → cierre con retrospectiva

El OSS entrega ese flujo completo, self-hosteable, con SDK publicado en npm. Las features de colaboración de equipos, governance avanzada, analytics con IA, y billing quedan en la versión Cloud paga.

### Frontera OSS / Cloud Pago

| Capacidad | OSS | Cloud Pago |
|-----------|-----|-----------|
| Loop lifecycle (create, signal, close) | ✅ | ✅ |
| Confidence Index básico | ✅ | ✅ |
| SDK `@loopythinking/sdk` | ✅ | ✅ |
| MCP Server `loopy-mcp` | ✅ | ✅ |
| Self-hosting con Docker | ✅ | — |
| Frontend mínimo (visualizar loops/signals) | ✅ | ✅ |
| Autenticación básica (email/password) | ✅ | ✅ |
| Governance policies avanzadas | — | ✅ |
| Collaboration (loops de equipo/org) | — | ✅ |
| IPL calculado con IA | — | ✅ |
| Analytics históricos | — | ✅ |
| SSO / SAML | — | ✅ |
| Soporte prioritario | — | ✅ |
| Billing / subscriptions | — | ✅ |

---

## Arquitectura y Stack

### Estructura del Monorepo

```
loopy-oss/
├── packages/
│   ├── sdk/              ← @loopythinking/sdk — cliente TypeScript (YA EXISTE, conservar)
│   ├── protocol/         ← JSON Schema + OpenAPI spec (CREAR)
│   ├── db/               ← Schema PostgreSQL + migrations limpias (RECONSTRUIR)
│   └── mcp/              ← loopy-mcp server (CREAR en Fase 4)
├── apps/
│   ├── api/              ← REST API con Hono (RECONSTRUIR desde cero)
│   └── web/              ← Frontend React mínimo (RECONSTRUIR desde cero)
├── docker/               ← docker-compose.yml + Dockerfiles (CREAR)
├── .github/
│   └── workflows/        ← CI/CD (CREAR)
├── turbo.json
├── package.json
├── LICENSE               ← AGPL v3
└── README.md
```

### Decisiones de Stack

| Capa | Tecnología | Razón |
|------|-----------|-------|
| Monorepo | Turborepo | Ya configurado |
| SDK | TypeScript puro | Agnóstico de framework |
| API | **Hono** | TypeScript nativo, funciona en Node + edge, liviano y legible |
| Frontend | **Vite + React + Tailwind + shadcn/ui** | Stack estándar, legible para contribuidores |
| Base de datos | **PostgreSQL** (via Supabase o directo) | Ya familiar, self-hosteable |
| Auth | Supabase Auth | Funciona en self-hosted Supabase |
| Docs | Mintlify | Ya planeado |

### Decisiones Arquitectónicas Clave

**`packages/sdk` → CONSERVAR tal cual**
El código existente (bridge.ts, signals.ts, mapper.ts, types.ts) es limpio y deliberado.
No tiene acoplamiento con Lovable. Solo se extiende, no se reescribe.

**`packages/db` → RECONSTRUIR con migrations limpias**
El schema en Supabase (versión paga) es la verdad de referencia, pero acumuló decisiones
rápidas de Lovable. Se escribe desde cero eligiendo conscientemente qué tablas son núcleo OSS.
NO hacer dump del schema actual — escribir migrations declarativas.

Tablas OSS núcleo: `loops`, `work_signals`, `agent_registry`
Tablas excluidas del OSS (quedan en Cloud): `agent_governance_policies`, billing tables,
features de collaboration avanzada.

**`apps/api` → RECONSTRUIR con Hono**
Las edge functions de Supabase/Lovable tienen acoplamiento fuerte con la plataforma.
El API OSS debe ser un servidor independiente, legible, con rutas explícitas.
MVP: 8 rutas (CRUD loops, emit signal, list signals, get confidence index, auth).

**`apps/web` → RECONSTRUIR, no exportar de Lovable**
El código generado por Lovable tiene deuda acumulada: componentes auto-generados, nombres
poco semánticos, lógica de UI mezclada con lógica de negocio. No es código que invite
a contribuidores externos.
Usar el frontend de Lovable solo como **referencia visual de diseño**, no como base de código.
Construir con Vite + React + shadcn/ui desde cero.

---

## Estado Actual del Monorepo

### `packages/sdk` ← Estado: ✅ Limpio y funcional

```
packages/sdk/src/
├── types.ts      ← WorkSignal, Loop, LoopyConfig, CognitiveLayer, SignalSource
├── bridge.ts     ← LoopyBridge (getLoop, listActiveLoops, createLoop, closeLoop)
├── signals.ts    ← LoopySignals.emit(), LoopySignals.listByLoop()
├── mapper.ts     ← LoopyMapper.map() — clasifica actividad → CognitiveLayer → signal
└── index.ts      ← exports públicos
```

API pública actual del SDK:
```typescript
// Instanciar cliente
const bridge = new LoopyBridge({ token: '...', baseUrl?: '...' })

// Loops
bridge.getLoop(id)
bridge.listActiveLoops()
bridge.createLoop({ title, hypothesis, scope? })
bridge.closeLoop(id, resolution?)

// Signals
LoopySignals.emit(signal, config)
LoopySignals.listByLoop(loopId, config)

// Mapper (clasifica automáticamente por texto)
LoopyMapper.map(loopId, { description, source?, metadata? }, config)
```

**Pendiente en SDK:**
- [ ] Agregar `packages/sdk/tsconfig.json` y script `build` con tsup
- [ ] Configurar exports en package.json para ESM + CJS
- [ ] Tests básicos con Vitest
- [ ] Publicar como `@loopythinking/sdk@0.1.0-beta` en npm

---

## FASE 1 — SDK Build + Scaffolding Base
**Período:** Semanas 1–3 (21 abril – 11 mayo 2026)  
**Entregable:** `@loopythinking/sdk` v0.1.0-beta publicado en npm + monorepo scaffold completo

### Semana 1: GitHub, Monorepo, SDK Build (en curso)

- [ ] Crear organización `loopy-thinking` en GitHub
  - Email: dev@loopy-thinking.com
  - Visibilidad pública

- [ ] Crear repositorio `loopy-oss`
  - Licencia: AGPL v3
  - Descripción: "The open-source core of Loopy Thinking — agent work signals, loops, and productivity metrics"

- [ ] Subir el monorepo actual a GitHub (push del código existente)

- [ ] Configurar build del SDK con `tsup`
  - `packages/sdk/package.json` → scripts: `build`, `dev`, `test`
  - `packages/sdk/tsconfig.json`
  - Configurar exports en package.json para ESM + CJS
  - Compilar: `npm run build` en sdk → genera `dist/`

- [ ] Configurar Turborepo pipeline
  - `turbo.json`: tasks `build`, `test`, `lint` con dependencias

### Semana 2: Protocol Package + Tests SDK

- [ ] Crear `packages/protocol/`
  - `schema/loop.json` — JSON Schema de Loop
  - `schema/work-signal.json` — JSON Schema de WorkSignal
  - `openapi.yaml` — spec OpenAPI 3.1 del API OSS
  - Este package es el contrato público del protocolo

- [ ] Tests del SDK con Vitest
  - Test de LoopyBridge (mock de fetch)
  - Test de LoopySignals.emit()
  - Test de LoopyMapper.classify() — verificar clasificación por keywords

- [ ] Verificar y completar JSDoc en todos los métodos públicos del SDK

### Semana 3: Publicación npm + CI/CD

- [ ] GitHub Actions: `.github/workflows/ci.yml`
  - Trigger: push a `main` y PRs
  - Steps: install → build → test → lint

- [ ] GitHub Actions: `.github/workflows/publish.yml`
  - Trigger: tag `v*`
  - Step: `npm publish --access public`

- [ ] Crear cuenta npm bajo org `@loopy`

- [ ] Publicar `@loopythinking/sdk@0.1.0-beta` en npm

- [ ] Actualizar README principal con instrucción de instalación

### Checklist Fase 1
- [ ] Org + repo GitHub creados y públicos
- [ ] SDK compila con `tsup` a `dist/` (ESM + CJS)
- [ ] `packages/protocol/` con JSON Schema + OpenAPI
- [ ] Tests Vitest pasando en CI
- [ ] CI/CD con GitHub Actions funcionando
- [ ] `@loopythinking/sdk@0.1.0-beta` publicado en npm

---

## FASE 2 — Database Schema + API con Hono
**Período:** Semanas 4–6 (12 mayo – 1 junio 2026)  
**Entregable:** API REST funcional self-hosteable + schema PostgreSQL documentado

### Semana 4: Schema PostgreSQL Limpio

Construir `packages/db/` con migrations declarativas. NO hacer dump del schema de Supabase
(versión paga) — escribir desde cero eligiendo conscientemente qué tablas son núcleo OSS.

**Tablas núcleo OSS:**

```sql
-- loops: unidad de trabajo con hipótesis y seguimiento
CREATE TABLE loops (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  title         TEXT NOT NULL,
  hypothesis    TEXT,
  status        TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'closed', 'blocked')),
  scope         TEXT NOT NULL DEFAULT 'personal'
                CHECK (scope IN ('personal', 'team', 'organizational')),
  confidence_index INTEGER DEFAULT 0 CHECK (confidence_index BETWEEN 0 AND 100),
  resolution    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  closed_at     TIMESTAMPTZ
);

-- work_signals: eventos de trabajo dentro de un loop
CREATE TABLE work_signals (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loop_id   UUID NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id),
  type      TEXT NOT NULL
            CHECK (type IN ('perception', 'interpretation', 'decision', 'action', 'reflection')),
  content   TEXT NOT NULL,
  source    TEXT NOT NULL DEFAULT 'human'
            CHECK (source IN ('human', 'agent')),
  metadata  JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- agent_registry: agentes autorizados para emitir signals via API token
CREATE TABLE agent_registry (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  agent_name  TEXT NOT NULL,
  token_hash  TEXT NOT NULL UNIQUE,  -- hash del Bearer token (nunca guardar el token en claro)
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);
```

**Archivos a crear:**
```
packages/db/
├── migrations/
│   ├── 001_create_loops.sql
│   ├── 002_create_work_signals.sql
│   ├── 003_create_agent_registry.sql
│   └── 004_indexes_and_rls.sql
├── seeds/
│   └── demo_data.sql    ← 2 loops, 5 signals de ejemplo
├── schema.sql           ← schema completo generado (solo referencia)
└── README.md            ← instrucciones para aplicar migrations
```

- [ ] Escribir las 4 migrations
- [ ] Escribir seeds de demo
- [ ] Documentar RLS policies (Supabase) o middleware de auth (Postgres directo)
- [ ] Probar migrations localmente

### Semana 5: API REST con Hono

Construir `apps/api/` desde cero con Hono.

**Estructura:**
```
apps/api/
├── src/
│   ├── index.ts          ← entry point, instancia Hono app
│   ├── middleware/
│   │   ├── auth.ts       ← valida Bearer token (JWT usuario o agent token)
│   │   └── cors.ts
│   ├── routes/
│   │   ├── loops.ts      ← GET /loops, POST /loops, GET /loops/:id, POST /loops/:id/close
│   │   ├── signals.ts    ← POST /signals, GET /loops/:id/signals
│   │   ├── agents.ts     ← POST /agents (registro, genera token)
│   │   └── health.ts     ← GET /health
│   ├── db/
│   │   └── client.ts     ← instancia postgres/supabase client
│   └── types.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

**8 endpoints MVP:**
```
GET    /health
GET    /loops                    ← lista loops del usuario autenticado
POST   /loops                    ← crear loop { title, hypothesis, scope }
GET    /loops/:id                ← detalle de loop + signals
POST   /loops/:id/close          ← cerrar loop { resolution }
GET    /loops/:id/signals        ← listar signals de un loop
POST   /signals                  ← emitir signal (usado por agentes con agent token)
POST   /agents                   ← registrar agente → devuelve token generado
```

- [ ] Configurar Hono con TypeScript
- [ ] Middleware de auth (JWT Supabase + Bearer token de agente)
- [ ] Implementar los 8 endpoints
- [ ] Conectar con `packages/db`
- [ ] Tests básicos del API (Vitest)

### Semana 6: Docker Compose + Variables de Entorno

```yaml
# docker/docker-compose.yml
version: '3.9'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: loopy
      POSTGRES_USER: loopy
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./packages/db/migrations:/docker-entrypoint-initdb.d

  api:
    build: ./apps/api
    environment:
      DATABASE_URL: postgresql://loopy:${POSTGRES_PASSWORD}@db:5432/loopy
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3001:3001"
    depends_on: [db]

  web:
    build: ./apps/web
    environment:
      VITE_API_URL: http://localhost:3001
    ports:
      - "3000:3000"
    depends_on: [api]

volumes:
  db_data:
```

- [ ] Crear `docker/docker-compose.yml`
- [ ] Dockerfile para `apps/api` (multi-stage, Node 20 alpine)
- [ ] Dockerfile para `apps/web` (multi-stage, Nginx)
- [ ] Crear `.env.example` con todas las variables necesarias
- [ ] Probar localmente: `docker-compose up` → loops funcionando end-to-end
- [ ] Documentar "Deploy en 10 minutos" en `docker/README.md`

### Checklist Fase 2
- [ ] `packages/db/migrations/` con 4 migrations limpias y probadas
- [ ] `apps/api/` con Hono — 8 rutas funcionando
- [ ] Auth middleware: JWT (usuarios) + Bearer token (agentes)
- [ ] `docker-compose.yml` funcional (test local end-to-end)
- [ ] `.env.example` completo
- [ ] Tests del API pasando en CI

---

## FASE 3 — Frontend React + Documentación + Lanzamiento
**Período:** Semanas 7–10 (2 junio – 30 junio 2026)  
**Entregable:** Interfaz web funcional + docs Mintlify + lanzamiento público

### Semana 7: Frontend React Mínimo

Construir `apps/web/` desde cero. **NO exportar código de Lovable** — usar el diseño
visual de Lovable como referencia, no el código.

**Stack:** Vite + React + TypeScript + Tailwind CSS + shadcn/ui

**4 vistas MVP:**
```
/login           ← autenticación básica
/dashboard       ← lista de loops activos del usuario
/loops/:id       ← detalle de loop + timeline de signals
/loops/new       ← crear loop (title, hypothesis, scope)
```

**Estructura:**
```
apps/web/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── LoopCard.tsx          ← card de loop en dashboard
│   │   ├── SignalTimeline.tsx     ← timeline de signals en detalle de loop
│   │   ├── ConfidenceBadge.tsx   ← indicador visual del confidence index
│   │   └── CreateLoopForm.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── LoopDetail.tsx
│   │   └── Login.tsx
│   ├── lib/
│   │   └── api.ts                ← cliente del API REST
│   └── hooks/
│       ├── useLoops.ts
│       └── useSignals.ts
├── package.json
├── vite.config.ts
└── Dockerfile
```

- [ ] Inicializar proyecto Vite + React + TypeScript
- [ ] Instalar Tailwind CSS + shadcn/ui
- [ ] Implementar las 4 vistas MVP
- [ ] Conectar al API vía `VITE_API_URL`
- [ ] Probar con Docker Compose end-to-end

### Semana 8: Documentación Mintlify

```
packages/docs/
├── mint.json
├── introduction.mdx        ← qué es Loopy, por qué importa
├── quickstart.mdx          ← self-hosting en 10 minutos (el más importante)
├── concepts/
│   ├── loops.mdx
│   ├── work-signals.mdx
│   └── confidence-index.mdx
├── sdk/
│   ├── installation.mdx
│   ├── bridge.mdx
│   ├── signals.mdx
│   └── mapper.mdx
├── api/
│   └── reference.mdx       ← generado desde packages/protocol/openapi.yaml
├── deployment/
│   ├── docker-compose.mdx
│   ├── railway.mdx
│   └── render.mdx
└── contribute.mdx
```

- [ ] Crear estructura Mintlify
- [ ] Escribir `quickstart.mdx` (debe funcionar en < 10 minutos reales)
- [ ] Escribir docs del SDK (bridge, signals, mapper)
- [ ] Generar referencia de API desde `openapi.yaml`
- [ ] Deploy en Mintlify Cloud (docs.loopythinking.dev)

### Semana 9: Preparar Lanzamiento

- [ ] Auditar repo: asegurar que no haya tokens, .env, ni secrets en el historial de git
- [ ] README visual: logo, "why Loopy", diagrama de arquitectura, quickstart, links
- [ ] CONTRIBUTING.md: fork workflow, código de conducta, cómo proponer cambios
- [ ] Crear 5+ issues "good-first-issue" (docs, ejemplos, tests)
- [ ] Escribir post de lanzamiento: "We're Opening Loopy Thinking — Here's Why" (1,000–1,500 palabras)
- [ ] Preparar assets para Product Hunt (screenshots, tagline, descripción corta)

### Semana 10: Lanzamiento y Comunidad

- [ ] Hacer repositorio público (si aún es privado)
- [ ] Show HN en Hacker News (martes-miércoles 9 AM EST)
- [ ] Product Hunt launch
- [ ] Posts en Discord: Supabase Community, Anthropic Claude Builders, AI/ML Builders
- [ ] Thread Twitter/X (5-7 tweets explicando Loopy OSS)
- [ ] Reddit: r/opensource, r/MachineLearning
- [ ] Responder activamente comentarios en HN y PH (crucial para ranking)
- [ ] Crear Discord de la comunidad Loopy OSS
- [ ] Configurar Stripe/Lemon Squeezy para Cloud tiers (Free, Pro, Team)

### Checklist Fase 3
- [ ] `apps/web/` funcional con 4 vistas MVP
- [ ] Docs Mintlify live en docs.loopythinking.dev
- [ ] Repo público, sin secrets, README atractivo con diagrama
- [ ] Lanzamiento ejecutado: HN + PH + Discord + Twitter + Reddit
- [ ] Discord comunitario creado
- [ ] 5+ issues "good-first-issue" abiertos
- [ ] Billing Cloud configurado

---

## FASE 4 — MCP Server Universal
**Período:** Semanas 11–14 (1 julio – 22 julio 2026)  
**Entregable:** `loopy-mcp` publicado en npm + integraciones documentadas

### Desarrollo del MCP Server

Crear `packages/mcp/` basado en el MCP SDK oficial de Anthropic.

**6 herramientas MCP:**
```
create_loop          ← crear nuevo loop
emit_signal          ← emitir signal a un loop existente
close_loop           ← cerrar loop con resolution
get_loop             ← obtener detalle de un loop
list_active_loops    ← listar loops activos del usuario
get_confidence       ← obtener confidence index de un loop
```

**Autenticación:** vía `LOOPY_AGENT_REGISTRY_TOKEN` (Bearer token del agent_registry)

**Publicar como:** `loopy-mcp@0.1.0` en npm

**Integraciones a documentar:**
- Claude Desktop (`claude_desktop_config.json`)
- Cursor (`.cursor/rules` o MCP settings)
- VS Code Copilot (`.vscode/settings.json`)

**Repo de ejemplos:** `loopy-mcp-examples/` con carpetas por integración

### Checklist Fase 4
- [ ] `packages/mcp/` con 6 herramientas MCP implementadas
- [ ] Auth via agent registry token
- [ ] `loopy-mcp@0.1.0` publicado en npm
- [ ] Documentación de integración para Claude Desktop, Cursor, VS Code
- [ ] Repo `loopy-mcp-examples` con ejemplos funcionales

---

## Métricas de Éxito a 90 Días (al 30 junio 2026)

- [ ] 500+ estrellas en GitHub
- [ ] 200+ descargas semanales de `@loopythinking/sdk` en npm
- [ ] 100+ miembros activos en Discord
- [ ] 3+ instancias self-hosted documentadas por usuarios externos
- [ ] 10+ clientes pagos Cloud provenientes del canal OSS
- [ ] 5+ PRs mergeados de contribuidores externos
- [ ] 0 bugs críticos abiertos

---

## Variables de Entorno (`.env.example`)

```bash
# Base de datos
DATABASE_URL=postgresql://loopy:password@localhost:5432/loopy
POSTGRES_PASSWORD=change_me_in_production

# Auth
JWT_SECRET=change_me_in_production

# Supabase (alternativa a PostgreSQL directo)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# API
PORT=3001

# Frontend
VITE_API_URL=http://localhost:3001
```

---

## Notas y Decisiones de Arquitectura

**Por qué Hono para el API**
TypeScript nativo, funciona en Node.js y en edge/serverless sin cambios, API limpia
y legible. Alternativa considerada: Express (más pesado, no TypeScript-first).

**Por qué reconstruir el frontend en lugar de exportar de Lovable**
El código generado por Lovable tiene deuda acumulada: componentes auto-generados,
lógica de UI mezclada con lógica de negocio, nombres poco semánticos. Para un proyecto
OSS que quiere atraer contribuidores, el código tiene que ser legible y deliberado.
El frontend de Lovable se usa solo como referencia visual de diseño, no como base de código.

**Por qué reconstruir el schema de DB en lugar de hacer dump**
El schema de Supabase (versión paga) acumuló decisiones rápidas y tablas de features
que no pertenecen al OSS. Escribir migrations declarativas fuerza a elegir conscientemente
qué es núcleo y qué no.

**Por qué AGPL v3**
Protege contra competidores que copien el SaaS sin contribuir de vuelta.
Permite flujo de ingresos via licencias comerciales.
Estándar en proyectos como n8n, Supabase, PostHog.

**Relación OSS ↔ Cloud Pago (Lovable)**
Los dos proyectos corren en paralelo sin dependencia directa de código.
La versión paga (Lovable) sigue siendo el laboratorio de experimentos.
Las ideas que maduran en la versión paga eventualmente "bajan" al OSS en forma
de features estables y bien diseñadas. No hay sincronización automática de código.
La separación es una fortaleza, no un workaround.

---

## Contacto y Recursos

- **Email OSS:** dev@loopy-thinking.com
- **GitHub:** https://github.com/loopy-thinking/loopy-oss
- **npm:** https://www.npmjs.com/package/@loopythinking/sdk
- **Docs:** docs.loopythinking.dev (disponible en Fase 3)
- **Discord:** por crear en Semana 9
