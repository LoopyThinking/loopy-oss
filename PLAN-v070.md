# Loopy OSS — Plan v0.7.0

**Autor:** Jaime Villatoro · **Fecha:** 2026-05-04 · **Última revisión:** 2026-05-04 · **Estado:** Borrador — listo para convertir en issues

---

## 0. Contexto y punto de partida

### Estado actual: v0.6.0

| Área | Estado |
|---|---|
| Invitaciones | Link-based manual. Admin genera token en `/admin/team`, copia la URL, la comparte por WhatsApp/email/Slack. **No se envía email automático.** Confirmado en `apps/api/src/routes/orgs.ts`: `// No email is sent — the operator decides how to deliver the link.` |
| Onboarding | No existe wizard. El usuario nuevo acepta el invite en `/invites/accept/:token`, hace login y aterriza directamente en el Dashboard sin guía. |
| Flujo OSS de skills | El plugin (`packages/cowork-plugin/`) se conecta **exclusivamente a la instancia self-hosted del operador** vía `LOOPY_BASE_URL`. No hay conexión con loopythinking.ai. |

### Flujo real del plugin OSS (v0.6.0)

Para que un usuario no técnico empiece a enviar señales, hoy necesita:

1. Tener Claude desktop instalado.
2. Instalar el archivo `.plugin` (el admin lo comparte).
3. Asegurarse de que `LOOPY_BASE_URL` apunta a la instancia de la organización (ej. `https://loopy.miempresa.com`). Este valor viene preconfigurado en el plugin por el operador.
4. La primera vez que el usuario dice "setup loopy", el skill `loopy-oss-bridge` se activa y detecta que `LOOPY_AGENT_TOKEN` está vacío.
5. El skill solicita el `USER_JWT` del usuario (obtenido desde la sesión en la app web de Loopy).
6. Con ese JWT llama `POST {LOOPY_BASE_URL}/agents` → recibe un `loopy_agent_...` token.
7. El skill le pide al usuario que guarde ese token como `LOOPY_AGENT_TOKEN` en la configuración del plugin.
8. A partir de ahí, todos los skills (`loop-mapper`, `signal-emit`, `collab-bridge`, `ipl-tracker`) funcionan con ese token.

**Fricción principal:** El paso 5 (obtener el `USER_JWT` desde la app web) es opaco para un usuario no técnico. El wizard de v0.7.0 elimina esta fricción generando el token directamente desde la UI.

---

## 1. Alcance de v0.7.0

Bloques independientes que pueden desarrollarse en paralelo:

| Bloque | Qué resuelve |
|---|---|
| **A — Email Invite** | Elimina el paso manual de copiar y pegar el link de invitación |
| **B — Onboarding Wizard** | Guía al usuario nuevo desde que acepta la invitación hasta que está emitiendo señales en Loopy |
| **C — Delete Closed Loops** | El usuario puede eliminar sus propios loops una vez que están cerrados |
| **D — Skills & Tools: visibilidad para admin** | El usuario puede desactivar sus skills/tools; los admins los ven con badge "Deactivated" + fecha |
| **E — Crear organización desde la UI** | Formulario en Settings para crear una nueva organización sin necesidad de llamar a la API directamente |
| **F — Artefactos** | Vista centralizada de señales por capa cognitiva: 5 páginas nombradas, cards en Dashboard, emisión inline |

---

## 2. Bloque A — Email Invite

### 2.1 Diseño

El endpoint `POST /orgs/:id/invites` acepta un campo opcional `email`. Si se incluye, el sistema envía el link de invitación al destinatario automáticamente. Si no se incluye, el comportamiento actual (devolver solo el token/URL) se preserva — compatibilidad total con v0.6.0.

Se implementa un **adaptador de email pluggable**: el operador configura el proveedor a través de variables de entorno. El adaptador soporta tres backends:

- **SMTP** (cualquier servidor: Gmail, SES SMTP, Postfix propio)
- **Resend** (API key)
- **SendGrid** (API key)

Si ningún proveedor está configurado y se pasa `email` en el request, la API devuelve `501 Not Implemented` con un mensaje claro.

### 2.2 Nuevas variables de entorno

```bash
# Selección de proveedor (smtp | resend | sendgrid). Omitir = email deshabilitado.
LOOPY_EMAIL_PROVIDER=smtp

# Remitente en todos los casos
LOOPY_EMAIL_FROM="Loopy <noreply@miempresa.com>"

# SMTP
LOOPY_SMTP_HOST=smtp.gmail.com
LOOPY_SMTP_PORT=587
LOOPY_SMTP_USER=noreply@miempresa.com
LOOPY_SMTP_PASS=xxxx
LOOPY_SMTP_SECURE=false          # true para puerto 465

# Resend
LOOPY_RESEND_API_KEY=re_xxxx

# SendGrid
LOOPY_SENDGRID_API_KEY=SG.xxxx
```

### 2.3 Cambios en DB

**Migración 013** — additive:

```sql
-- Registro del email al que se envió la invitación (opcional, solo auditoría)
ALTER TABLE org_invites ADD COLUMN IF NOT EXISTS invited_email TEXT;
ALTER TABLE org_invites ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
```

### 2.4 Cambios en API

**`apps/api/src/services/email.ts`** — nuevo servicio:

```typescript
export interface EmailAdapter {
  send(to: string, subject: string, html: string, text: string): Promise<void>
}

export function getEmailAdapter(): EmailAdapter | null
// Retorna el adaptador según LOOPY_EMAIL_PROVIDER, o null si no está configurado.
```

**`apps/api/src/email/templates/invite.ts`** — template HTML + texto plano:

- Asunto: `You've been invited to join {orgName} on Loopy`
- Cuerpo: saludo, nombre de la org, rol asignado, botón CTA con el link, expiración.

**`POST /orgs/:id/invites`** — cambio en el handler:

```typescript
// body nuevo
{ role?: string; expires_in_days?: number; email?: string }

// lógica adicional al final del handler:
if (body.email) {
  const adapter = getEmailAdapter()
  if (!adapter) return c.json({ error: 'Not Implemented', message: 'Email provider not configured. Set LOOPY_EMAIL_PROVIDER.' }, 501)
  await adapter.send(body.email, ...)
  await sql`UPDATE org_invites SET invited_email=${body.email}, email_sent_at=now() WHERE id=${inviteId}`
}
```

### 2.5 Cambios en Web (`apps/web`)

**`Team.tsx`** — en el formulario de invitación:

- Nuevo campo de input: `Email (optional)` — tipo `email`, placeholder `colleague@company.com`.
- Si se completa, se pasa `email` al POST. La UI muestra "Invitation sent by email ✓" en lugar de la URL copiable.
- Si está vacío, el comportamiento actual (mostrar URL copiable) se preserva.
- Detecta el 501 y muestra un aviso: "Email sending is not configured on this instance. Copy the link manually."

### 2.6 Archivos a crear/modificar

```
apps/api/src/services/email.ts          ← nuevo
apps/api/src/email/templates/invite.ts  ← nuevo
apps/api/src/routes/orgs.ts             ← modificar POST /orgs/:id/invites
apps/api/src/index.ts                   ← registrar instancia del adaptador al arranque
packages/db/migrations/013_v070.sql     ← nueva migración (comparte migración con Bloque B)
apps/web/src/pages/Team.tsx             ← añadir campo email al formulario
apps/web/src/lib/api.ts                 ← actualizar tipo OrgInvitePayload
docker/.env.example                     ← documentar nuevas vars
```

---

## 3. Bloque B — Onboarding Wizard

### 3.1 Diseño

El wizard se activa **una sola vez** para cada usuario nuevo que llega vía invite link. Una vez completado (o saltado), nunca vuelve a aparecer. El estado se persiste en `users.onboarded_at`.

El wizard se presenta como un modal de pasos sobre la pantalla de Dashboard, inmediatamente después de aceptar la invitación y hacer login. No interrumpe el flow de usuarios existentes.

### 3.2 Pasos del wizard

```
Paso 1 — Bienvenida
  "Welcome to {orgName}, {displayName}! Let's get you set up in 3 minutes."
  Muestra: nombre del org, rol asignado.
  CTA: "Let's start →"

Paso 2 — Instalar Claude
  "Install Claude for Desktop"
  Instrucción breve + link a https://claude.ai/download
  Toggle: "I already have Claude installed" → salta al paso 3.
  CTA: "I've installed Claude →"

Paso 3 — Instalar el plugin
  "Install the Loopy plugin for Claude"
  Botón de descarga del .plugin file (descarga el archivo desde /api/download/plugin).
  Instrucción de 2 líneas: arrastrar al ícono de Claude / Settings → Plugins → Install.
  CTA: "Plugin installed →"

Paso 4 — Generar tu token de agente
  "Connect Claude to your Loopy workspace"
  El wizard llama automáticamente a POST /me/agent-token → obtiene el token.
  Muestra el token en un input read-only con botón "Copy token".
  Instrucción: "Open Claude, and when asked for your agent token, paste this value."
  Nota: "This token is specific to you. Keep it private."
  CTA: "Token copied, continue →"

Paso 5 — ¡Listo!
  "You're all set."
  "Try saying 'setup loopy' in Claude to confirm the connection."
  Muestra 3 ejemplos de frases de activación de skills:
    → "Create a loop for this project"
    → "Emit a signal to my loop"
    → "Calculate my IPL this month"
  CTA: "Go to Dashboard →" (marca onboarded_at, cierra wizard)
```

### 3.3 Nuevo endpoint: `POST /me/agent-token`

Crea (o reutiliza) un agente `claude-cowork-agent` para el usuario autenticado y devuelve el token. Es idempotente: si ya existe un agente activo para ese usuario en esa org, devuelve el token existente.

```typescript
// POST /me/agent-token
// Auth: Bearer {USER_JWT_OR_SESSION_TOKEN}
// Headers: X-Org-Id required

// Response 200 (agente existente):
{ "token": "loopy_agent_...", "agent_id": "...", "created": false }

// Response 201 (agente nuevo):
{ "token": "loopy_agent_...", "agent_id": "...", "created": true }
```

Este endpoint resuelve el problema central del flujo actual: **el usuario nunca tiene que entender qué es un JWT ni cómo obtenerlo**. El wizard maneja todo.

### 3.4 Endpoint de descarga del plugin: `GET /download/plugin`

Sirve el archivo `.plugin` precompilado del `packages/cowork-plugin/`. El archivo se incluye en el build de la API como asset estático.

```
GET /download/plugin
→ 200  Content-Type: application/octet-stream
       Content-Disposition: attachment; filename="loopy-oss.plugin"
```

El `LOOPY_BASE_URL` se inyecta en el `.plugin` al momento de servirlo, de modo que el archivo descargado ya viene preconfigurado con la URL correcta de la instancia. Esto elimina completamente el paso de configuración manual de `LOOPY_BASE_URL` para el usuario final.

### 3.5 Cambios en DB

**Migración 013** (compartida con Bloque A):

```sql
-- Wizard state
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;
```

### 3.6 Cambios en API

```
apps/api/src/routes/me.ts          ← añadir POST /me/agent-token
apps/api/src/routes/download.ts    ← nuevo: GET /download/plugin
apps/api/src/index.ts              ← registrar ruta /download
```

### 3.7 Cambios en Web

```
apps/web/src/components/OnboardingWizard.tsx  ← nuevo componente modal multi-step
apps/web/src/App.tsx (o Router)               ← mostrar wizard si !currentUser.onboarded_at
apps/web/src/lib/api.ts                       ← añadir api.me.agentToken()
```

El wizard se inyecta como overlay en el layout raíz. Condición de activación:

```typescript
const showWizard = user && !user.onboarded_at && user.joinedViaInvite
```

`joinedViaInvite` se deriva de que el usuario tiene `accepted_at` en `org_invites` y `onboarded_at` es null.

---

---

## 4. Bloque C — Delete Closed Loops

### 4.1 Estado actual

No existe endpoint `DELETE /loops/:id`. La tabla `loops` no tiene columna `deleted_at`. El único mecanismo de ciclo de vida es `POST /loops/:id/close` (cambia `status = 'closed'`). En la UI (LoopDetail.tsx) solo aparece el botón "Close" para el owner; no hay botón de eliminación.

### 4.2 Reglas de negocio

- Solo el **owner del loop** puede eliminarlo.
- Solo se pueden eliminar loops con `status = 'closed'`. Un loop abierto no puede eliminarse directamente — debe cerrarse primero.
- El borrado es **soft-delete**: se añade `deleted_at` a la tabla. Los loops eliminados desaparecen de todas las vistas del usuario, pero quedan en la base de datos para auditoría.
- Los **admins** nunca ven loops eliminados por defecto. Si en el futuro se necesita una vista de auditoría para admins, se construye aparte.
- Los `work_signals` asociados al loop NO se eliminan — se preservan para integridad del IPL histórico.

### 4.3 Cambios en DB

**Migración 013** (se añade a la existente):

```sql
-- Bloque C: soft-delete de loops
ALTER TABLE loops ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Índice para excluir loops eliminados eficientemente
CREATE INDEX IF NOT EXISTS idx_loops_deleted_at
  ON loops (deleted_at)
  WHERE deleted_at IS NULL;
```

Todos los `SELECT` existentes en `loops.ts` ya filtran por `user_id` — se actualiza cada query para añadir `AND deleted_at IS NULL`.

### 4.4 Cambios en API

**Nuevo endpoint `DELETE /loops/:id`** en `apps/api/src/routes/loops.ts`:

```typescript
// DELETE /loops/:id — soft-delete (solo loops cerrados, solo el owner)
loops.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const { id } = c.req.param()

  const [existing] = await sql<Loop[]>`
    SELECT * FROM loops
    WHERE id = ${id} AND user_id = ${userId} AND deleted_at IS NULL
  `

  if (!existing) {
    return c.json({ error: 'Not Found', message: 'Loop not found' }, 404)
  }

  if (existing.status !== 'closed') {
    return c.json(
      { error: 'Bad Request', message: 'Only closed loops can be deleted. Close the loop first.' },
      400
    )
  }

  await sql`
    UPDATE loops SET deleted_at = now() WHERE id = ${id}
  `

  return c.body(null, 204)
})
```

**Todos los GET existentes** se actualizan para excluir loops eliminados:

```sql
-- Antes
WHERE user_id = ${userId}

-- Después
WHERE user_id = ${userId} AND deleted_at IS NULL
```

### 4.5 Cambios en Web

**`LoopDetail.tsx`** — añadir botón "Delete loop" condicional:

```
Condición de visibilidad:
  loop.status === 'closed'
  AND loop.user_id === currentUserId
  AND loop.deleted_at == null

Posición: junto al botón "Close" en el header de acciones, con estilo destructivo (rojo).

Flujo al hacer click:
  1. Mostrar diálogo de confirmación: "Delete this loop? This action cannot be undone."
  2. Confirmar → llamar DELETE /loops/:id
  3. En 204 → navegar a /loops
  4. En error → mostrar mensaje inline
```

**`Loops.tsx`** — la lista ya filtra por `deleted_at IS NULL` a nivel de API, no hay cambio en el frontend.

**`apps/web/src/lib/api.ts`** — añadir:

```typescript
deleteLoop: (loopId: string) =>
  apiFetch(`/loops/${loopId}`, { method: 'DELETE' })
```

---

## 5. Bloque D — Skills & Tools: visibilidad diferenciada para admin

### 5.1 Estado actual

El soft-delete ya funciona en la API: `DELETE /agents/:agentId/skills/:skillId` y `/tools/:toolId` hacen `SET is_active = false`. En `AgentDetail.tsx`, los items inactivos se renderizan con `opacity-40` y el label `"inactive"` para **todos los usuarios** (owner e admin por igual). Las líneas 332–333 calculan `activeSkills` y `activeTools` pero solo se usan para conteos — la tabla renderiza todos.

### 5.2 Comportamiento deseado

| Rol | Ve skills/tools activos | Ve skills/tools desactivados |
|---|---|---|
| Owner del agente | ✅ Con botón "Deactivate" | ❌ No los ve — desaparecen |
| Admin / Owner de la org | ✅ | ✅ Con badge "Deactivated" + fecha |
| Viewer / Member | ✅ (solo lectura) | ❌ No los ve |

### 5.3 Cambios en DB

La columna `is_active` ya existe en `agent_skills` y `agent_tools`. Se añade `deactivated_at` para mostrar la fecha en el badge del admin:

**Migración 013** (se añade):

```sql
-- Bloque D: timestamp de desactivación para skills y tools
ALTER TABLE agent_skills ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
ALTER TABLE agent_tools  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
```

### 5.4 Cambios en API

**`DELETE /agents/:agentId/skills/:skillId`** — actualizar para poblar `deactivated_at`:

```typescript
await sql`
  UPDATE agent_skills
  SET is_active = false, deactivated_at = now()
  WHERE id = ${skillId} AND agent_id = ${agentId}
`
```

Mismo cambio para `agent_tools`.

**`GET /agents/:agentId/skills`** y `GET /agents/:agentId/tools`** — el filtro depende del rol del solicitante:

```typescript
// Si el solicitante es admin/owner de la org → devuelve todos (activos + inactivos)
// Si es el owner del agente o member → devuelve solo is_active = true
const isOrgAdmin = orgRole === 'admin' || orgRole === 'owner'
const rows = isOrgAdmin
  ? await sql`SELECT * FROM agent_skills WHERE agent_id = ${agentId} ORDER BY registered_at DESC`
  : await sql`SELECT * FROM agent_skills WHERE agent_id = ${agentId} AND is_active = true ORDER BY registered_at DESC`
```

### 5.5 Cambios en Web

**`AgentDetail.tsx`** — cambios en la tabla de skills y tools:

```tsx
// Badge para admins en lugar del genérico "inactive"
{!s.is_active && isOrgAdmin && (
  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
    Deactivated {s.deactivated_at ? fmtDate(s.deactivated_at) : ''}
  </span>
)}

// El owner del agente directamente no ve los inactivos (se filtran en el GET)
// El botón "Deactivate" solo aparece si is_active = true Y el usuario es dueño del agente
{s.is_active && isAgentOwner && (
  <button onClick={() => handleDeactivateSkill(s.id)} ...>Deactivate</button>
)}
```

El label genérico `"inactive"` (línea 189 actual) se reemplaza por el badge condicional de arriba.

**`apps/web/src/lib/api.ts`** — `isOrgAdmin` se deriva del profile/org context ya disponible en el componente.

---

## 6. Bloque E — Crear organización desde la UI

### 6.1 Estado actual

`POST /orgs` existe y funciona: recibe `{ name, slug? }`, crea la org y asigna al creador como `owner`. El slug se auto-genera si no se provee. En `Settings.tsx`, la sección "My organizations" solo lista las orgs existentes — no hay botón ni formulario para crear una nueva.

### 6.2 Diseño

Se añade un formulario inline colapsable en la sección "My organizations" de Settings, visible para **cualquier usuario autenticado** (cualquiera puede crear una org; el endpoint ya lo permite). El slug se muestra como campo opcional con preview en tiempo real del auto-generado.

```
[ + Create organization ]   ← botón que despliega el formulario

Formulario:
  Name *          [ Mi Equipo de Producto         ]
  Slug (optional) [ mi-equipo-de-producto  ] ← auto-generado desde name, editable
                    "Your org URL: https://loopy.example.com/org/mi-equipo-de-producto"
  [ Cancel ]  [ Create organization → ]
```

Flujo al crear:
1. `POST /orgs` con `{ name, slug }`.
2. En 201 → refrescar lista de orgs en la sección, seleccionar la nueva org como activa (`setCurrentOrgId`), mostrar toast "Organization created".
3. En 409 (slug duplicado) → mostrar error inline bajo el campo slug: "This slug is already taken. Try a different one."

### 6.3 Cambios en Web

**`Settings.tsx`** — dentro de la sección "My organizations":

```tsx
// Estado local
const [showCreateForm, setShowCreateForm] = useState(false)
const [newOrgName, setNewOrgName]         = useState('')
const [newOrgSlug, setNewOrgSlug]         = useState('')
const [creating, setCreating]             = useState(false)
const [createError, setCreateError]       = useState<string | null>(null)

// Auto-generar slug desde name
useEffect(() => {
  setNewOrgSlug(newOrgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60))
}, [newOrgName])

// Handler
async function handleCreateOrg() {
  setCreating(true)
  setCreateError(null)
  try {
    const org = await api.orgs.create({ name: newOrgName, slug: newOrgSlug || undefined })
    setCurrentOrgId(org.id)
    await loadProfile() // refrescar lista
    setShowCreateForm(false)
    setNewOrgName('')
  } catch (err: any) {
    setCreateError(err.message ?? 'Error creating organization')
  } finally {
    setCreating(false)
  }
}
```

**`apps/web/src/lib/api.ts`** — ya existe `api.orgs.create` parcialmente. Verificar y completar:

```typescript
orgs: {
  create: (data: { name: string; slug?: string }) =>
    apiFetch('/orgs', { method: 'POST', body: JSON.stringify(data) }),
  // ... resto de métodos existentes
}
```

### 6.4 Sin cambios en API

`POST /orgs` ya existe y está completo. No requiere modificaciones.

---

## 7. Bloque F — Artefactos

### 7.1 Análisis de viabilidad

**Veredicto: Alta — sin cambios en la base de datos.**

Todo lo necesario ya existe: `work_signals.type` tiene exactamente los 5 valores de capa cognitiva (`perception`, `interpretation`, `decision`, `action`, `reflection`), y `loops` tiene `title`, `hypothesis`, `status`, `user_id` y `org_id`. El endpoint `POST /signals` ya funciona y valida permisos. Artefactos es una nueva capa de presentación sobre datos existentes.

### 7.2 Mapa de artefactos

| Capa (`type`) | Nombre del artefacto | Ruta web |
|---|---|---|
| `perception` | Catálogo de señales | `/artifacts/perception` |
| `interpretation` | Registro de hipótesis | `/artifacts/interpretation` |
| `decision` | Bitácora de decisiones | `/artifacts/decision` |
| `action` | Playbook | `/artifacts/action` |
| `reflection` | Libro de aprendizajes | `/artifacts/reflection` |

### 7.3 Reglas de visibilidad

| Rol | Ve sus propias señales | Ve señales de otros |
|---|---|---|
| `viewer` / `member` | ✅ | ❌ |
| `admin` / `owner` | ✅ | ✅ (toda la org) |

Dentro de cada página, un miembro ve únicamente los loops que le pertenecen y que tienen al menos una señal de esa capa. Un admin ve todos los loops de la org con señales de esa capa, agrupados por usuario.

### 7.4 Nuevos endpoints en API

**`apps/api/src/routes/artifacts.ts`** — nuevo archivo:

```typescript
// GET /artifacts/summary
// Devuelve el conteo de loops (con ≥1 señal) por capa, para las cards del Dashboard.
// Admin ve toda la org; member/viewer solo los suyos.
→ {
    perception:     number,
    interpretation: number,
    decision:       number,
    action:         number,
    reflection:     number
  }

// GET /artifacts/:layer
// layer: perception | interpretation | decision | action | reflection
// Devuelve loops que tienen ≥1 señal de ese tipo, con las señales embebidas.
// Admin + X-Org-Id → todos los loops de la org.
// Member/Viewer → solo sus propios loops.
→ [
    {
      loop_id:    string,
      title:      string,
      hypothesis: string | null,
      status:     'open' | 'closed' | 'blocked',
      scope:      string,
      created_at: string,
      owner: {                      // solo en vista admin
        display_name: string | null,
        email: string
      } | null,
      signal_count: number,
      signals: [
        {
          id:         string,
          content:    string,
          source:     'human' | 'agent',
          created_at: string
        }
      ]
    }
  ]
```

**Query SQL para `GET /artifacts/:layer`** (vista de member):

```sql
SELECT
  l.id        AS loop_id,
  l.title,
  l.hypothesis,
  l.status,
  l.scope,
  l.created_at,
  COUNT(s.id) AS signal_count,
  json_agg(
    json_build_object(
      'id',         s.id,
      'content',    s.content,
      'source',     s.source,
      'created_at', s.created_at
    ) ORDER BY s.created_at ASC
  ) AS signals
FROM loops l
JOIN work_signals s ON s.loop_id = l.id AND s.type = ${layer}
WHERE l.user_id = ${userId}           -- admin: l.org_id = ${orgId}
  AND l.deleted_at IS NULL
GROUP BY l.id
HAVING COUNT(s.id) > 0
ORDER BY MAX(s.created_at) DESC
```

**Para vista admin:** se reemplaza `WHERE l.user_id = ${userId}` por `WHERE l.org_id = ${orgId}` y se añade el JOIN a `users` para devolver `owner.display_name` y `owner.email`.

**Registro en `apps/api/src/index.ts`:**
```typescript
import artifacts from './routes/artifacts.js'
app.use('/artifacts/*', authMiddleware)
app.route('/artifacts', artifacts)
```

**Sin cambios en `POST /signals`** — el endpoint existente ya maneja la emisión con todas las validaciones necesarias.

### 7.5 Cards en Dashboard

Se añade una sección "Artifacts" en `Dashboard.tsx`, visible para todos los roles, entre el banner de Analytics (admin) y la lista de loops:

```
┌─────────────────────────────────────────────────────────────┐
│  ARTIFACTS                                                  │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ 👁 Catálogo│ │ 💡 Registro│ │ ✓ Bitácora│ │ ⚡ Playbook│ │ 📖 Libro │ │
│  │ de señales│ │ hipótesis │ │ decisiones│ │          │ │ aprend.  │ │
│  │    12     │ │     8     │ │     5     │ │    15    │ │    3     │ │
│  │  loops    │ │  loops    │ │  loops    │ │  loops   │ │  loops   │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

Cada card muestra: icono, nombre del artefacto, conteo de loops con señales de esa capa, y es un link a `/artifacts/:layer`. El conteo viene de `GET /artifacts/summary`.

### 7.6 Páginas de artefacto (`/artifacts/:layer`)

**`apps/web/src/pages/Artifacts.tsx`** — componente único parametrizado por `layer`:

Estructura de cada página:

```
[ ← Dashboard ]   Catálogo de señales           [ capa: Percepción ]

  ┌─────────────────────────────────────────────────────┐
  │  🔵 "Análisis de competidores Q2"     [open]        │
  │  owner: Jaime  ·  3 señales  ·  hace 2 días         │
  │                                               [ ∨ ] │
  ├─────────────────────────────────────────────────────│
  │  • Revisé el pricing de Notion y Linear...  (agent) │
  │  • El usuario B reporta que...              (human) │
  │  • Encontré este patrón en 3 competidores…  (agent) │
  │                                                     │
  │  [ + Agregar señal ]                                │
  └─────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────┐
  │  🟡 "Investigación de onboarding"     [closed]      │
  │  owner: Jaime  ·  1 señal  ·  hace 5 días           │
  │                                               [ ∨ ] │
  └─────────────────────────────────────────────────────┘
```

**Detalles de UX:**
- Loop cards expandibles con `useState` — colapsadas por defecto.
- Las señales dentro muestran `source` con un badge: `agent` (indigo) / `human` (gray).
- El botón **"+ Agregar señal"** aparece solo si: `loop.status === 'open'` AND `loop.user_id === currentUser.id`. Abre un modal/inline con un `<textarea>` para el `content`. El `type` viene fijo del artefacto actual; `loopId` viene del loop seleccionado.
- En la vista admin, los loops están agrupados por usuario — un separador con `display_name` encabeza cada grupo.
- Loops con `status === 'closed'` se muestran con un tono más apagado pero siguen siendo visibles (las señales ya emitidas persisten).

### 7.7 Emisión inline de señal

Al hacer click en "**+ Agregar señal**":

```tsx
// Modal/inline form
<form onSubmit={handleEmitSignal}>
  <p className="text-sm text-muted mb-2">
    Adding a <strong>perception</strong> signal to "{loop.title}"
  </p>
  <textarea
    value={content}
    onChange={e => setContent(e.target.value)}
    placeholder="What did you observe or capture?"
    rows={3}
  />
  <div className="flex gap-2 mt-3">
    <button type="button" onClick={onClose}>Cancel</button>
    <button type="submit" disabled={!content.trim() || submitting}>
      {submitting ? 'Saving…' : 'Add signal'}
    </button>
  </div>
</form>
```

Llama a `POST /signals` con `{ loopId: loop.loop_id, type: layer, content, source: 'human' }`. En 201: actualiza la lista de señales del loop en el estado local (sin recargar la página).

### 7.8 Sidebar y routing

**`Layout.tsx`** — añadir entrada en `navItems`:

```typescript
{ to: '/artifacts', icon: BookOpen, label: 'Artifacts', minRole: null },
// posición: entre 'Loops' y 'Agents'
```

`/artifacts` redirige a `/artifacts/perception` (primer artefacto).

**`App.tsx` (router):**

```typescript
<Route path="/artifacts"            element={<Navigate to="/artifacts/perception" />} />
<Route path="/artifacts/:layer"     element={<Artifacts />} />
```

**`apps/web/src/lib/api.ts`** — añadir:

```typescript
artifacts: {
  summary: () =>
    apiFetch('/artifacts/summary'),
  list: (layer: string) =>
    apiFetch(`/artifacts/${layer}`),
}
```

### 7.9 Archivos a crear/modificar

```
apps/api/src/routes/artifacts.ts          ← nuevo
apps/api/src/index.ts                     ← registrar /artifacts
apps/web/src/pages/Artifacts.tsx          ← nuevo (componente único, parametrizado por layer)
apps/web/src/App.tsx                      ← añadir rutas /artifacts y /artifacts/:layer
apps/web/src/components/Layout.tsx        ← añadir nav item "Artifacts"
apps/web/src/pages/Dashboard.tsx          ← añadir sección con 5 artifact cards
apps/web/src/lib/api.ts                   ← añadir api.artifacts.summary() y .list()
```

**Sin migración de base de datos.** Toda la información ya existe en `loops` y `work_signals`.

---

## 8. Migración 013 completa (todos los bloques)

> ⚠️ **Corrección importante:** Las migraciones del repo ya van hasta `012_agent_catalog.sql`. La migración de v0.7.0 es **`013_v070.sql`**. El Bloque F (Artefactos) **no requiere migración** — usa tablas existentes.

**`packages/db/migrations/013_v070.sql`**

```sql
-- v0.7.0: email invites + onboarding wizard + delete loops + skills/tools deactivation
-- Nota: Artefactos (Bloque F) no requiere cambios en DB.

-- Bloque A: registro de email en invitaciones
ALTER TABLE org_invites ADD COLUMN IF NOT EXISTS invited_email TEXT;
ALTER TABLE org_invites ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Bloque B: estado de onboarding por usuario
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_users_onboarded_at
  ON users (onboarded_at)
  WHERE onboarded_at IS NULL;

-- Bloque C: soft-delete de loops
ALTER TABLE loops ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_loops_deleted_at
  ON loops (deleted_at)
  WHERE deleted_at IS NULL;

-- Bloque D: timestamp de desactivación para skills y tools
ALTER TABLE agent_skills ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
ALTER TABLE agent_tools  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
```

La migración es 100% aditiva e idempotente (`IF NOT EXISTS`). No rompe instancias en v0.6.0.

---

## 9. Nuevas dependencias npm (Bloque A — email)

| Paquete | Dónde | Para qué |
|---|---|---|
| `nodemailer` | `apps/api` | Adaptador SMTP |
| `resend` | `apps/api` | Adaptador Resend |
| `@sendgrid/mail` | `apps/api` | Adaptador SendGrid |

Las tres son optionales en runtime: se importan dinámicamente según `LOOPY_EMAIL_PROVIDER`. Solo se instala la que el operador configure.

---

## 10. Actualización del SDK (`packages/sdk`)

**`@loopythinking/sdk@0.7.0`** — añadir:

```typescript
// Nuevo método en LoopyBridge
async getOrCreateAgentToken(orgId: string): Promise<{ token: string; agentId: string; created: boolean }>

// Nuevo helper para verificar si el wizard aplica
async getOnboardingStatus(): Promise<{ onboarded: boolean; onboardedAt: string | null }>
```

---

## 11. Actualización del Cowork Plugin (`packages/cowork-plugin`)

### `loopy-oss-bridge` SKILL.md — cambio en el flujo de registro

**Antes (v0.6.0):** El skill pedía al usuario su `USER_JWT` para llamar `POST /agents`.

**Después (v0.7.0):** El skill llama `POST /me/agent-token` directamente usando el token de sesión del usuario (que ya está disponible una vez que el usuario ha hecho login en la instancia Loopy). Si el usuario viene del wizard, el token ya está configurado y el skill solo verifica conectividad.

```markdown
### 2. Agent token (only when LOOPY_AGENT_TOKEN is empty)

Option A — User completed the onboarding wizard:
  The token was generated in Step 4 of the wizard. Ask the user to paste it here.
  Store it as LOOPY_AGENT_TOKEN.

Option B — Manual setup:
  Direct the user to {LOOPY_BASE_URL}/settings → "Agent Token" to generate one.
  (The Settings page calls POST /me/agent-token and displays the result.)
```

### Settings page — nuevo panel "Agent Token"

En `apps/web/src/pages/Settings.tsx`, añadir una sección "Agent Token" bajo la configuración personal:

- Muestra el token actual (si existe) en formato `loopy_agent_...` parcialmente enmascarado.
- Botón "Generate new token" → llama `POST /me/agent-token` → muestra el nuevo token una sola vez.
- Nota: "Use this token to configure the Loopy plugin in Claude."

Esto permite a los usuarios regenerar su token en cualquier momento sin pasar de nuevo por el wizard.

---

## 12. Secuencia de implementación

```
Sprint 1 (paralelo)
  ├── Bloque A: email adapter + migración + Team.tsx update
  ├── Bloque B: migración + POST /me/agent-token + GET /download/plugin
  ├── Bloque C: DELETE /loops/:id + deleted_at en todos los GET
  └── Bloque D: deactivated_at en capabilities + lógica de visibilidad por rol

Sprint 2
  ├── Bloque A: template HTML de email + QA con SMTP y Resend
  ├── Bloque B: OnboardingWizard.tsx (pasos 1-5) + integración en App.tsx
  ├── Bloque C: botón "Delete" en LoopDetail.tsx con diálogo de confirmación
  ├── Bloque D: badge "Deactivated" en AgentDetail.tsx con fecha
  └── Bloque E: formulario "Create organization" en Settings.tsx

Sprint 3
  ├── Bloque F: GET /artifacts/summary + GET /artifacts/:layer (API)
  └── Bloque F: Artifacts.tsx + cards en Dashboard + nav item

Sprint 4 (cierre)
  ├── Settings.tsx — panel Agent Token
  ├── Plugin update: loopy-oss-bridge SKILL.md v0.7.0
  ├── SDK bump a 0.7.0
  ├── Migración 013 validada end-to-end
  └── CHANGELOG + GitHub Release v0.7.0
```

---

## 13. Checklist de QA

**Bloque A — Email Invite**
- [ ] Invite sin email → comportamiento v0.6.0 preservado (URL copiable en UI)
- [ ] Invite con email → email recibido con los tres proveedores (SMTP, Resend, SendGrid)
- [ ] Invite con email sin proveedor configurado → 501 con aviso claro en Team.tsx
- [ ] `org_invites.invited_email` y `email_sent_at` correctamente poblados en DB

**Bloque B — Onboarding Wizard**
- [ ] Usuario nuevo vía invite → wizard aparece al hacer login
- [ ] Usuario existente (`onboarded_at` no null) → nunca ve el wizard
- [ ] Paso 4 del wizard → `POST /me/agent-token` devuelve token funcional
- [ ] `GET /download/plugin` → descarga `.plugin` con `LOOPY_BASE_URL` preconfigurado
- [ ] `users.onboarded_at` se actualiza al completar Y al saltar el wizard
- [ ] Settings → panel "Agent Token" genera token y lo muestra correctamente

**Bloque C — Delete Closed Loops**
- [ ] Loop abierto → botón "Delete" no aparece
- [ ] Loop cerrado (owner) → botón "Delete" aparece con diálogo de confirmación
- [ ] Confirmar delete → `DELETE /loops/:id` devuelve 204, redirige a /loops
- [ ] Loop cerrado de otro usuario → `DELETE /loops/:id` devuelve 404
- [ ] Loop abierto via API → `DELETE /loops/:id` devuelve 400 con mensaje claro
- [ ] `GET /loops` y `GET /loops/:id` no devuelven loops con `deleted_at` no null
- [ ] `work_signals` del loop eliminado persisten en DB (no se borran)

**Bloque D — Skills & Tools**
- [ ] Owner del agente: al eliminar un skill, desaparece de su vista inmediatamente
- [ ] Admin: ve el skill eliminado con badge "Deactivated + fecha"
- [ ] Member/Viewer: no ve skills desactivados
- [ ] `agent_skills.deactivated_at` y `agent_tools.deactivated_at` poblados al desactivar
- [ ] Botón "Deactivate" no aparece para skills ya inactivos

**Bloque E — Crear Organización**
- [ ] Formulario en Settings → `POST /orgs` crea org, usuario queda como `owner`
- [ ] Slug auto-generado en tiempo real refleja el nombre
- [ ] Slug duplicado → error 409 mostrado inline bajo el campo
- [ ] Nueva org aparece en la lista de "My organizations" sin recargar página
- [ ] Nueva org se selecciona como activa automáticamente (`setCurrentOrgId`)

**Bloque F — Artefactos**
- [ ] `GET /artifacts/summary` devuelve conteos correctos (member: solo propios; admin: toda la org)
- [ ] `GET /artifacts/:layer` devuelve loops con señales embebidas correctamente filtradas por rol
- [ ] Dashboard: 5 cards de artefactos visibles para todos los roles
- [ ] Cada card lleva a `/artifacts/:layer` correctamente
- [ ] Páginas de artefacto: loops colapsados por defecto, expandibles al click
- [ ] Señales muestran badge `agent` / `human` correcto
- [ ] Vista admin: loops agrupados por usuario con separador de nombre
- [ ] Botón "+ Agregar señal" aparece solo en loops abiertos del propio usuario
- [ ] Emisión inline exitosa → señal aparece en el loop sin recargar la página
- [ ] Loops cerrados visibles pero sin botón de emisión
- [ ] `GET /artifacts/:layer` con layer inválido → 400 con mensaje claro

**General**
- [ ] `loopy-oss-bridge` skill conecta sin pedir USER_JWT si token ya existe
- [ ] Migración 013 es idempotente en instancia con v0.6.0 existente (`IF NOT EXISTS`)

---

## 14. Pendientes de v0.6.0 que siguen vigentes

Del plan anterior, estos ítems no pertenecen a v0.7.0 pero deben mantenerse en el backlog:

- Publicar `@loopythinking/sdk@0.6.0` a npm (aún en 0.3.0 publicado)
- GitHub Release v0.5.0 y v0.6.0 con CHANGELOG
- Abrir good-first-issues en GitHub para v0.7.0
- IPL weight calibration (v0.8.0)
- Real-time SSE para señales (v0.8.0)
