# Loopy OSS — Plan v0.6.0

**Autor:** Jaime Villatoro · **Fecha:** 2026-04-30 · **Estado:** Listo para implementación

> Este documento es la spec completa para Claude Code. Implementar en el orden indicado.
> Base de partida: v0.5.0. Solo afecta `apps/web/` salvo los bumps de versión.

---

## Resumen ejecutivo

v0.6.0 es una release de **experiencia de usuario**. Cuatro cambios:

1. **Traducción al inglés** — toda la UI de `apps/web/`
2. **Menú lateral** — reorden + ocultar items según rol
3. **Dark mode** — toggle persistente con Tailwind `darkMode: 'class'`
4. **Footer del sidebar** — ícono Framework + toggle dark/light

Sin cambios de API, base de datos ni SDK.

---

## ✅ Ya implementado (no tocar)

Los siguientes cambios fueron aplicados el 2026-04-30 y están en el código:

- **`apps/web/src/components/AgentCard.tsx`** — Simplificado: lista plana, es un `<Link>` a `/registry/:agentKey`, sin lógica de árbol/expand.
- **`apps/web/src/pages/Agents.tsx`** — Lista plana directa de `catalog`, sin árbol. Eliminada la lógica de `rootEntries`/`childrenByParent`.
- **`apps/web/src/pages/RegistryDetail.tsx`** — Nueva página en `/registry/:agentKey` con: emoji, nombre, rol, vibe, sección "Reports to" (link al padre), Responsibilities (lista), Technical Specialization (tags), Strategic Priorities (tags), Subordinates (lista con links), sección Registro (meta).
- **`apps/web/src/App.tsx`** — Ruta `/registry/:agentKey` → `<RegistryDetail />` ya añadida.

---

## Orden de implementación

```
1. Traducción al inglés      (bases para todo lo demás)
2. Reorden del menú + roles  (mismo archivo que punto 1)
3. Dark mode                 (ThemeContext + clases dark:)
4. Footer del sidebar        (último, cuando dark mode está cableado)
5. Version bump + CHANGELOG
6. Commit + PR
```

---

## Bloque 1 — Traducción al inglés

**Principio:** Cambiar strings directamente en cada componente. Sin librerías i18n. El sitio es English-only.

### `apps/web/src/components/Layout.tsx`

Nav labels:
```
"Dashboard"       → "Dashboard"      (sin cambio)
"Loops"           → "Loops"          (sin cambio)
"Agentes"         → "Agents"
"Panel ejecutivo" → "Executive Panel"
"Analítica"       → "Analytics"
"Equipo"          → "Team"
"Ajustes"         → "Settings"
"Framework"       → "Framework"      (sin cambio)
```

### `apps/web/src/pages/Dashboard.tsx`
```
"Mis loops"          → "My loops"
"Del equipo"         → "Team"
"Loops activos"      → "Active loops"
"Cerrados"           → "Closed"
"+ Nuevo loop"       → "+ New loop"
"Sin loops abiertos" → "No open loops"
"h ago" / "d ago"    → mantener en inglés
Breadcrumb: "Dashboard" (sin cambio)
```

### `apps/web/src/pages/Loops.tsx`
```
Filtros y estados de loop al inglés: "Abierto" → "Open", "Cerrado" → "Closed", "Bloqueado" → "Blocked"
Scopes: "Personal" (sin cambio), "Equipo" → "Team", "Organizacional" → "Org"
Columnas de tabla al inglés
Mensajes vacíos al inglés
```

### `apps/web/src/pages/NewLoop.tsx`
```
Labels de formulario:
"Título" → "Title"
"Hipótesis" → "Hypothesis (optional)"
"Alcance" → "Scope"
"Crear loop" → "Create loop"
"Cancelar" → "Cancel"
```

### `apps/web/src/pages/LoopDetail.tsx`
```
Botones: "Cerrar loop" → "Close loop", "Añadir señal" → "Add signal"
Estados y capas cognitivas al inglés:
"percepción" → "perception", "interpretación" → "interpretation",
"decisión" → "decision", "acción" → "action", "reflexión" → "reflection"
Labels de sección al inglés
```

### `apps/web/src/pages/Agents.tsx`
```
"AI Registry" (sin cambio — ya es inglés)
"Registrar agente" → "Register agent"
"Todos" → "All"
"Flujos" → "Workflows"
Tabs: "All", "Agents", "Skills", "Tools", "Workflows"
"Mis agentes registrados (tokens)" → "My registered agents (tokens)"
"Registro automático desde Claude Cowork" → "Auto-registration from Claude Cowork"
Texto del hint al inglés
Formulario: labels, placeholders, botones al inglés
```

### `apps/web/src/pages/RegistryDetail.tsx`
```
"Reporta a" → "Reports to"
"Responsabilidades" → "Responsibilities"
"Especialización técnica" → "Technical specialization"
"Prioridades estratégicas" → "Strategic priorities"
"Subordinados" → "Subordinates"
"Registro" → "Registry info"
"Agent Key" (sin cambio)
"Registrado por" → "Registered by"
"Creado" → "Created"
"Último registro" → "Last seen"
Breadcrumb: "Agents" → ya apunta a /agents
```

### `apps/web/src/pages/AgentDetail.tsx`
```
Tabs: "Resumen" → "Overview", "Skills" (sin cambio), "Tools" (sin cambio)
"Revocar token" → "Revoke token"
Labels de la tabla Overview: "Nombre" → "Name", "Descripción" → "Description",
"Estado" → "Status", "Creado" → "Created", "Último uso" → "Last used"
"Activo" → "Active", "Revocado" → "Revoked"
"Todos los agentes" → "All agents"
Mensajes vacíos de Skills/Tools al inglés
```

### `apps/web/src/pages/Admin.tsx`
```
Título y breadcrumb: "Panel ejecutivo" → "Executive Panel"
KPI cards al inglés
Encabezados de tablas al inglés
Botones al inglés
```

### `apps/web/src/pages/Analytics.tsx`
```
Tabs: "Resumen" → "Overview", "Análisis" → "Analysis",
      "Historial" → "History", "Configuración" → "Configuration"
KPI cards: "IPL del mes" → "Monthly IPL", "Loops cerrados" → "Closed loops",
           "Usuarios activos" → "Active users", "Top agente" → "Top agent"
"Analíticas programadas" → "Scheduled analytics"
"Selecciona una plantilla…" → translate description
Modal: "Período" → "Period", "Proveedor LLM" → "LLM Provider",
       "Editar prompt" → "Edit prompt", "Ocultar prompt" → "Hide prompt",
       "Ejecutar análisis" → "Run analysis", "Cancelar" → "Cancel"
Tab Config: "Tarifa por hora para ROI" → "Hourly rate for ROI",
            "Guardar" → "Save",
            "Plantillas con prompt personalizado" → "Templates with custom prompt",
            "Restaurar predeterminado" → "Reset to default",
            "Analíticas programadas" → "Scheduled analytics",
            "Activa/Inactiva" → "Active/Inactive", "Activar/Desactivar" → "Enable/Disable"
PERIOD_OPTIONS en inglés:
  "Últimos 7 días" → "Last 7 days"
  "Últimos 30 días" → "Last 30 days"
  "Últimos 90 días" → "Last 90 days"
  "Mes actual" → "Current month"
  "Trimestre actual" → "Current quarter"
StatusBadge: "Completado" → "Completed", "Ejecutando" → "Running"
```

### `apps/web/src/pages/AnalyticsResult.tsx`
```
"Resultado" → "Result"
"Volver a Analítica" → "Back to Analytics"
"Período:" → "Period:"
"Completado" → "Completed", "Ejecutando" → "Running", "Pendiente" → "Pending"
"El análisis se está ejecutando…" → "Analysis is running…"
"Esto puede tardar…" → "This may take a few seconds. The page updates automatically."
"Error en el análisis" → "Analysis error"
"Creado:" → "Created:", "Completado:" → "Completed:"
Template-specific labels al inglés (champion, stuck loops, etc.)
```

### `apps/web/src/pages/Team.tsx`
```
"Miembros activos" → "Active members"
"Invitaciones pendientes" → "Pending invites"
"Invitar miembro" → "Invite member"
Roles: "owner", "admin", "member", "viewer" (ya en inglés)
"Revocar" → "Revoke", "Copiar enlace" → "Copy link"
Formulario de invitación al inglés
```

### `apps/web/src/pages/Settings.tsx`
```
Secciones: "Perfil" → "Profile", "Token de agente" → "Agent token",
"Organizaciones" → "Organizations", "Proveedores LLM" → "LLM Providers"
Todos los labels, placeholders y botones al inglés
```

### `apps/web/src/pages/Login.tsx`
```
"Iniciar sesión" → "Sign in" (o lo que haya en español)
Cualquier string visible al inglés
```

### `apps/web/src/pages/Framework.tsx`
```
Mantener contenido conceptual tal como está (es terminología de dominio).
Solo traducir labels de UI: botones, breadcrumbs, navegación.
```

### Componentes compartidos
```
apps/web/src/components/RegistrySummary.tsx  → labels al inglés
apps/web/src/components/LoopCard.tsx         → estados y labels al inglés
Cualquier otro componente con strings en español
```

---

## Bloque 2 — Reorden del menú + ocultar items por rol

**Archivo:** `apps/web/src/components/Layout.tsx`

### 2a. Helper de roles

Añadir antes del componente `Layout`:

```typescript
const ROLE_RANK: Record<string, number> = {
  viewer: 0, member: 1, admin: 2, owner: 3,
}

function hasMinRole(userRole: string | null, minRole: string | null): boolean {
  if (!minRole) return true
  return (ROLE_RANK[userRole ?? ''] ?? -1) >= (ROLE_RANK[minRole] ?? 99)
}
```

### 2b. Array `navItems` unificado

Reemplazar la definición actual de nav items (que probablemente separa items de admin en un array diferente) por un único array ordenado:

```typescript
const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',       minRole: null },
  { to: '/loops',      icon: Repeat2,         label: 'Loops',           minRole: null },
  { to: '/agents',     icon: Bot,             label: 'Agents',          minRole: null },
  { to: '/admin',      icon: BarChart2,       label: 'Executive Panel', minRole: 'admin' },
  { to: '/analytics',  icon: TrendingUp,      label: 'Analytics',       minRole: 'admin' },
  { to: '/admin/team', icon: Users,           label: 'Team',            minRole: 'admin' },
  { to: '/settings',   icon: Settings,        label: 'Settings',        minRole: null },
]
```

### 2c. Renderizado condicional

```typescript
{navItems
  .filter(item => hasMinRole(orgRole, item.minRole))
  .map(item => (
    <NavLink key={item.to} to={item.to} ...>
      <item.icon />
      <span>{item.label}</span>
    </NavLink>
  ))
}
```

`orgRole` debe obtenerse del perfil del usuario ya cargado en `Layout` (via `api.me.get()`).

**Nota:** Framework desaparece del nav principal — pasa al footer del sidebar (Bloque 4).

---

## Bloque 3 — Design system Linear + Dark/Light mode

> Fuente de diseño: `DESIGN-linear.app.md`. El sistema de color es token-first:
> CSS custom properties → extendidos en Tailwind → usados en componentes.
> Nunca hardcodear hexadecimales en JSX.

---

### 3a. Fuentes — `apps/web/index.html`

Añadir en `<head>` antes de cualquier otro `<link>`:

```html
<!-- Inter Variable -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" />
```

---

### 3b. CSS variables — `apps/web/src/index.css`

Reemplazar (o añadir al inicio de) el archivo con el bloque de tokens:

```css
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

/* ── Global font settings ───────────────────────────────────────────── */
:root {
  font-family: 'Inter', 'SF Pro Display', -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif;
  font-feature-settings: 'cv01', 'ss03';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* ── Light mode tokens ──────────────────────────────────────────────── */
:root {
  /* Backgrounds */
  --bg-page:       #f7f8f8;
  --bg-panel:      #ffffff;
  --bg-surface:    #f3f4f5;
  --bg-elevated:   #f5f6f7;
  --bg-hover:      #ececee;
  --bg-card:       #ffffff;

  /* Text */
  --text-primary:   #0f1011;
  --text-secondary: #3e3e44;
  --text-muted:     #62666d;
  --text-subtle:    #8a8f98;

  /* Borders */
  --border:        #e6e6e6;
  --border-subtle: #d0d6e0;
  --divide:        #f0f0f2;

  /* Brand / Accent */
  --accent:        #5e6ad2;
  --accent-hover:  #7170ff;
  --accent-light:  #eef0fb;

  /* Status (sin cambio en ningún modo) */
  --green:         #27a644;
  --green-light:   #d1fae5;
  --red:           #dc2626;
  --red-light:     #fee2e2;
  --amber:         #d97706;
  --amber-light:   #fef3c7;
}

/* ── Dark mode tokens ───────────────────────────────────────────────── */
.dark {
  /* Backgrounds — luminance stacking (Linear) */
  --bg-page:       #08090a;   /* deepest canvas */
  --bg-panel:      #0f1011;   /* sidebar, header */
  --bg-surface:    #191a1b;   /* cards, containers */
  --bg-elevated:   #28282c;   /* hover, dropdowns */
  --bg-hover:      rgba(255,255,255,0.04);
  --bg-card:       rgba(255,255,255,0.02);

  /* Text */
  --text-primary:   #f7f8f8;   /* NOT pure white */
  --text-secondary: #d0d6e0;
  --text-muted:     #8a8f98;
  --text-subtle:    #62666d;

  /* Borders — semi-transparent white (Linear approach) */
  --border:        rgba(255,255,255,0.08);
  --border-subtle: rgba(255,255,255,0.05);
  --divide:        rgba(255,255,255,0.05);

  /* Brand / Accent */
  --accent:        #5e6ad2;
  --accent-hover:  #828fff;
  --accent-light:  rgba(94,106,210,0.15);

  /* Status — ligeramente más oscuros en dark */
  --green:         #10b981;
  --green-light:   rgba(16,185,129,0.15);
  --red:           #f87171;
  --red-light:     rgba(248,113,113,0.15);
  --amber:         #fbbf24;
  --amber-light:   rgba(251,191,36,0.15);
}
```

---

### 3c. Tailwind config — `apps/web/tailwind.config.js`

```js
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Semantic surface tokens */
        page:     'var(--bg-page)',
        panel:    'var(--bg-panel)',
        surface:  'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        card:     'var(--bg-card)',
        hover:    'var(--bg-hover)',

        /* Text tokens */
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted:     'var(--text-muted)',
        subtle:    'var(--text-subtle)',

        /* Border tokens */
        edge:        'var(--border)',
        'edge-subtle': 'var(--border-subtle)',

        /* Brand */
        accent:      'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-light': 'var(--accent-light)',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['Berkeley Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontWeight: {
        /* Linear signature weights */
        'light':    '300',
        'normal':   '400',
        'ui':       '510',  /* Linear's signature weight */
        'semibold': '590',
      },
      letterSpacing: {
        'display-xl': '-0.022em', /* ~-1.584px at 72px */
        'display-lg': '-0.022em', /* ~-1.408px at 64px */
        'display':    '-0.022em', /* ~-1.056px at 48px */
        'heading':    '-0.022em', /* ~-0.704px at 32px */
        'sub':        '-0.012em', /* ~-0.288px at 24px */
        'tight':      '-0.012em',
        'normal':     '0em',
      },
      borderRadius: {
        'micro': '2px',
        'sm':    '4px',
        DEFAULT: '6px',
        'md':    '8px',
        'lg':    '12px',
        'xl':    '22px',
        'full':  '9999px',
      },
      boxShadow: {
        /* Linear elevation system */
        'card':    '0 0 0 1px rgba(0,0,0,0.08)',
        'elevated': '0 2px 4px rgba(0,0,0,0.4)',
        'dialog':  '0 8px 2px rgba(0,0,0,0), 0 5px 2px rgba(0,0,0,0.01), 0 3px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.08)',
        'focus':   '0 4px 12px rgba(0,0,0,0.1)',
        'inset-dark': 'inset 0 0 12px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
}
```

---

### 3d. ThemeContext — `apps/web/src/context/ThemeContext.tsx` *(nuevo)*

```typescript
import { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
}>({ theme: 'light', toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Respetar preferencia del sistema si no hay preferencia guardada
    const stored = localStorage.getItem('loopy-theme') as Theme | null
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('loopy-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

### 3e. `apps/web/src/main.tsx`

```tsx
import { ThemeProvider } from './context/ThemeContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
)
```

---

### 3f. Patrones de componente — tabla de conversión

Reemplazar en TODOS los componentes las clases de Tailwind por los tokens semánticos.
Nunca usar `dark:` inline — los tokens cambian solos vía CSS variables.

| Antes (clases hardcoded)         | Después (tokens semánticos)           |
|----------------------------------|---------------------------------------|
| `bg-white`                       | `bg-card`                             |
| `bg-gray-50`                     | `bg-surface`                          |
| `bg-gray-100`                    | `bg-elevated`                         |
| `hover:bg-gray-50`               | `hover:bg-hover`                      |
| `text-gray-900`                  | `text-primary`                        |
| `text-gray-700`                  | `text-secondary`                      |
| `text-gray-500`                  | `text-muted`                          |
| `text-gray-400`                  | `text-subtle`                         |
| `border-gray-100`                | `border-edge-subtle`                  |
| `border-gray-200`                | `border-edge`                         |
| `divide-gray-50`                 | `divide-edge-subtle`                  |
| `bg-indigo-600`                  | `bg-accent`                           |
| `hover:bg-indigo-700`            | `hover:bg-accent-hover`               |
| `bg-indigo-50`                   | `bg-accent-light`                     |
| `focus:ring-indigo-300`          | `focus:ring-accent/30`                |

**Sidebar y header** usan `bg-panel` (no `bg-page`).
**Page wrapper** usa `bg-page`.
**Cards y contenedores** usan `bg-card` con `border border-edge`.
**Filas de tabla en hover** usan `hover:bg-hover`.

---

### 3g. Patrones de componente en código

**Card estándar:**
```tsx
<div className="bg-card border border-edge rounded-lg p-5">
  <h3 className="text-sm font-ui text-primary mb-1">Título</h3>
  <p className="text-xs text-muted">Descripción</p>
</div>
```

**Botón primario:**
```tsx
<button className="px-4 py-2 text-sm font-ui bg-accent hover:bg-accent-hover text-white rounded transition-colors">
  Acción
</button>
```

**Botón ghost (Linear style):**
```tsx
<button className="px-3 py-1.5 text-sm font-ui text-secondary bg-card border border-edge hover:bg-hover rounded transition-colors">
  Acción
</button>
```

**Fila de tabla:**
```tsx
<tr className="border-b border-edge hover:bg-hover cursor-pointer transition-colors">
  <td className="px-4 py-3 text-sm text-primary">…</td>
  <td className="px-4 py-3 text-xs text-muted">…</td>
</tr>
```

**Input:**
```tsx
<input className="w-full px-3 py-2 text-sm text-primary bg-surface border border-edge rounded focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-subtle" />
```

**Sidebar nav item activo/inactivo:**
```tsx
// Activo
"bg-accent-light text-accent font-ui rounded"
// Inactivo
"text-muted hover:text-secondary hover:bg-hover rounded transition-colors"
```

---

### 3h. Archivos a actualizar

Aplicar la conversión de tokens en TODOS estos archivos (prioridad de arriba hacia abajo):

```
apps/web/src/components/Layout.tsx          ← PRIMERO — sidebar, header, overlay
apps/web/src/pages/Dashboard.tsx
apps/web/src/pages/Loops.tsx
apps/web/src/pages/LoopDetail.tsx
apps/web/src/pages/NewLoop.tsx
apps/web/src/pages/Agents.tsx
apps/web/src/components/AgentCard.tsx
apps/web/src/pages/AgentDetail.tsx
apps/web/src/pages/RegistryDetail.tsx       ← ya tiene dark: classes, migrar a tokens
apps/web/src/pages/Admin.tsx
apps/web/src/pages/Analytics.tsx
apps/web/src/pages/AnalyticsResult.tsx
apps/web/src/pages/Team.tsx
apps/web/src/pages/Settings.tsx
apps/web/src/pages/Framework.tsx
apps/web/src/pages/Login.tsx
apps/web/src/components/RegistrySummary.tsx
```

> `RegistryDetail.tsx` ya tiene clases `dark:` aplicadas manualmente — migrarlas al sistema de tokens semánticos al mismo tiempo.

---

## Bloque 4 — Footer del sidebar

**Archivo:** `apps/web/src/components/Layout.tsx`

Añadir al pie del sidebar, después de la lista de nav items:

```tsx
import { BookOpen, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

// Dentro del componente Layout:
const { theme, toggleTheme } = useTheme()

{/* Footer del sidebar */}
<div className="mt-auto border-t border-edge px-4 py-3 flex items-center gap-2">
  <NavLink
    to="/framework"
    title="Framework"
    className="p-1.5 text-subtle hover:text-accent hover:bg-accent-light rounded transition-colors"
  >
    <BookOpen size={16} />
  </NavLink>
  <button
    onClick={toggleTheme}
    title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    className="p-1.5 text-subtle hover:text-secondary hover:bg-hover rounded transition-colors"
  >
    {theme === 'dark'
      ? <Sun size={16} />
      : <Moon size={16} />}
  </button>
</div>
```

---

## Bloque 5 — Version bump

### `apps/web/package.json`
```json
"version": "0.6.0"
```

### `apps/api/package.json`
```json
"version": "0.6.0"
```

### `packages/sdk/package.json`
```json
"version": "0.6.0"
```

### Footer del sidebar en `Layout.tsx`

El string `v0.5.0` que aparece en el footer de la página:
```
v0.5.0 → v0.6.0
```

---

## Bloque 6 — CHANGELOG

Añadir al inicio de `CHANGELOG.md`, antes de `## [0.5.0]`:

```markdown
## [0.6.0] — 2026-04-30

### Added
- **Linear-inspired design system** — token-first color architecture via CSS custom properties (`--bg-page`, `--text-primary`, `--border`, etc.), extended into Tailwind as semantic classes (`bg-card`, `text-muted`, `border-edge`). Inter Variable with `font-feature-settings: 'cv01', 'ss03'` globally. Dark mode uses Linear's near-black canvas (`#08090a` page, `#0f1011` panels, `#191a1b` surfaces) with semi-transparent white borders (`rgba(255,255,255,0.08)`). Light mode uses `#f7f8f8` page background. Brand accent `#5e6ad2` / `#7170ff` throughout both modes.
- **Dark mode** — persistent light/dark toggle in the sidebar footer. Defaults to system preference (`prefers-color-scheme`), then `localStorage`. Implemented via Tailwind `darkMode: 'class'` + `ThemeContext`.
- **Sidebar footer** — icon-only footer strip with Framework link and dark/light mode toggle.
- **Registry entry detail page** (`/registry/:agentKey`) — full detail view for any AI Registry entry: role, vibe, responsibilities, technical specialization, strategic priorities, subordinates list with navigation links, and parent "Reports to" link.
- **Registry flat listing** — Agents page now renders all registry entries as a flat clickable list regardless of type filter. Replaces the previous tree expand/collapse pattern.

### Changed
- **Full English UI** — all user-visible strings in `apps/web/` translated to English. No i18n library; English-only.
- **Sidebar nav order** — unified nav array with role-based visibility: Dashboard, Loops, Agents, Executive Panel *(admin+)*, Analytics *(admin+)*, Team *(admin+)*, Settings.
- **Role-gated nav items** — Executive Panel, Analytics, and Team links are hidden from the sidebar for users without `admin` or `owner` role (previously they appeared and redirected on click).
- `apps/web/package.json`, `apps/api/package.json`, `packages/sdk/package.json` bumped to `0.6.0`.
```

---

## Bloque 7 — Git commit y PR

Una vez implementados todos los bloques anteriores y verificado que el build pasa (`npm run build` en `apps/web/`):

```bash
# Desde la raíz del proyecto
git checkout -b feat/v0.6.0

git add .
git commit -m "feat: v0.6.0 — English UI, dark mode, sidebar reorder, registry detail

- Translate all apps/web/ strings to English
- Add dark mode with ThemeContext + Tailwind darkMode:class
- Sidebar footer: Framework icon + light/dark toggle
- Unified nav array with role-based visibility (admin items hidden for non-admins)
- New /registry/:agentKey detail page (responsibilities, specialization, subordinates, parent link)
- Registry listing now flat (no tree expand/collapse)
- Bump all packages to v0.6.0
- Update CHANGELOG"

git push origin feat/v0.6.0
```

Abrir PR en GitHub con:
- **Título:** `feat: v0.6.0 — English UI, dark mode, sidebar reorder, registry detail`
- **Base branch:** `main`
- **Descripción:** pegar el bloque `## [0.6.0]` del CHANGELOG como body del PR

---

## Archivos que NO cambian en v0.6.0

```
apps/api/          ← sin cambios de código (solo version bump en package.json)
packages/db/       ← sin migraciones nuevas
packages/sdk/      ← solo version bump en package.json
packages/mcp/      ← sin cambios
docker/            ← sin cambios
```

---

## Verificación rápida antes del PR

```bash
# Desde apps/web/
npm run build          # sin errores de TypeScript ni Vite
npm run typecheck      # si existe el script

# Manual en el browser:
# ✓ Dark mode toggle persiste al recargar (localStorage)
# ✓ Primera visita sin localStorage detecta prefers-color-scheme del sistema
# ✓ En dark: fondo de página es near-black (#08090a), sidebar #0f1011, cards #191a1b
# ✓ En dark: bordes son semi-transparentes (no grises sólidos)
# ✓ En dark: texto principal es #f7f8f8 (NO pure white)
# ✓ En light: fondo #f7f8f8, cards white, bordes sutiles
# ✓ Font es Inter con alternates geométricos (la 'a' minúscula es single-story)
# ✓ El accent indigo (#5e6ad2) aparece igual en ambos modos
# ✓ Usuario viewer no ve "Executive Panel", "Analytics", "Team" en el sidebar
# ✓ Usuario admin los ve
# ✓ /registry/skill:loopy-bridge carga correctamente
# ✓ Todos los tabs de /agents muestran items (Skills: 24, Tools: 5, etc.)
# ✓ /analytics carga y los 4 tabs funcionan
# ✓ Sidebar footer visible con íconos Framework y toggle dark/light
```
