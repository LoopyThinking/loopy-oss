# Plugin Spec: loopy-second-brain
*Para desarrollar con Claude Code · Versión 1.0 · 2026-05-06*

---

## 1. Contexto y Posicionamiento

### ¿Qué es?
`loopy-second-brain` es un plugin de Cowork que conecta los loops operativos de Loopy (OSS y loopythinking.ai) con una base de conocimiento personal o de equipo (Obsidian vault u otro Second Brain estructurado).

### ¿Por qué existe?
- Los loops de Loopy tienen pulso operativo pero no memoria contextual.
- Un Second Brain tiene contexto histórico pero no pulso operativo.
- La combinación produce **inteligencia ampliada**: los loops razonan mejor con contexto del vault, y el vault aprende de los loops.

### Modelo de distribución (open core)
| Capa | Features | Distribución |
|------|----------|--------------|
| Capa 1 — Personal | Pull loops → vault, Push vault → señales, Enrich loop con KB | Loopy OSS (GitHub) + loopythinking.ai marketplace |
| Capa 2-3 — Organizacional | Multi-vault, distribución de equipo, org KB sharing | loopythinking.ai (paid) únicamente |

### Dependencias
- **Plugin `loopy-thinking`** (el plugin actual con 6 skills) — maneja auth, sesión y comunicación con la API. Este plugin NO lo reemplaza, lo extiende.
- **Acceso al filesystem** del vault vía Read/Write/Edit tools de Cowork.
- **Chrome** para llamadas a la API de Loopy (mismo patrón que loopy-bridge).

---

## 2. Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   Usuario / Agente                   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│           loopy-second-brain (este plugin)           │
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │loopy-kb-pull│  │loopy-kb-push│  │loopy-kb-    │  │
│  │             │  │             │  │enrich       │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
│         │                │                │          │
│  ┌──────▼────────────────▼────────────────▼──────┐   │
│  │           Platform Capability Detector         │   │
│  └──────────────────────┬────────────────────────┘   │
└─────────────────────────┼───────────────────────────┘
                          │
        ┌─────────────────┴──────────────────┐
        │                                    │
┌───────▼────────┐                 ┌─────────▼───────┐
│  loopy-bridge  │                 │  Obsidian Vault  │
│  (auth + API)  │                 │  (filesystem)    │
└───────┬────────┘                 └─────────────────┘
        │
┌───────▼────────┐
│   Loopy API    │
│ (OSS o paid)   │
└────────────────┘
```

**Principio clave:** `loopy-second-brain` nunca habla directamente con la API de Loopy. Siempre lo hace a través de `loopy-bridge`. Esto garantiza que cualquier mejora al bridge (auth, nuevos endpoints, manejo de errores) beneficia automáticamente a este plugin.

---

## 3. Estructura de Archivos del Plugin

```
loopy-second-brain/
├── PLUGIN.md                          ← Manifiesto del plugin
├── README.md                          ← Documentación para usuarios
├── skills/
│   ├── loopy-kb-pull/
│   │   └── SKILL.md                   ← Spec del skill (este archivo es el prompt)
│   ├── loopy-kb-push/
│   │   └── SKILL.md
│   ├── loopy-kb-enrich/
│   │   └── SKILL.md
│   └── loopy-org-kb/
│       └── SKILL.md                   ← Solo activo en paid tier
├── lib/
│   ├── vault-conventions.md           ← Documentación de cómo leer/escribir el vault
│   ├── platform-detector.md           ← Cómo detectar capacidades de la plataforma
│   └── loop-to-note-mapping.md        ← Mapeo canónico loop ↔ nota
└── examples/
    ├── loop-note-example.md           ← Ejemplo de nota generada desde un loop
    └── signal-from-vault-example.md   ← Ejemplo de señal generada desde el vault
```

---

## 4. PLUGIN.md — Manifiesto

```markdown
# loopy-second-brain

Conecta tus loops de Loopy con tu base de conocimiento personal o de equipo.

## Requiere
- Plugin: loopy-thinking (para autenticación y comunicación con la API)
- Acceso al vault: la carpeta de Obsidian u otro Second Brain estructurado

## Skills incluidos
- loopy-kb-pull    → Trae loops activos al vault como notas
- loopy-kb-push    → Emite señales desde actividad del vault
- loopy-kb-enrich  → Enriquece loops activos con contexto del vault
- loopy-org-kb     → [Solo paid] Distribución organizacional de insights

## Plataformas soportadas
- Loopy OSS (skills: loopy-kb-pull, loopy-kb-push, loopy-kb-enrich)
- loopythinking.ai (todos los skills)
```

---

## 5. Skill Specs

### 5.1 `loopy-kb-pull` — Loops → Vault

**Propósito:** Traer los loops activos del usuario desde Loopy y materializarlos como notas en el vault, siguiendo las convenciones de la base de conocimiento del usuario.

**Trigger:** Usuario dice cualquiera de:
- "trae mis loops al vault"
- "sincroniza mis loops"
- "pull loops"
- "actualiza el vault con mis loops"
- "qué loops tengo activos" (cuando hay un vault conectado)

**Flujo de ejecución:**

```
1. VERIFICAR credenciales (LOOPY_SESSION_KEY, LOOPY_AGENT_REGISTRY_TOKEN)
   └─ Si no existen → invocar loopy-bridge para setup

2. VERIFICAR vault conectado
   └─ Buscar _CLAUDE.md o index.md en el vault
   └─ Si no existe → pedir al usuario que seleccione su carpeta de vault

3. LEER convenciones del vault
   └─ Leer _CLAUDE.md para entender estructura de carpetas y frontmatter requerido
   └─ Si no hay _CLAUDE.md → usar convenciones por defecto (ver lib/vault-conventions.md)

4. OBTENER loops activos desde Loopy
   └─ POST a Loopy API via Chrome con intent "general"
   └─ Payload: { "session_key": "...", "intent": "general", "to": "atlas",
                 "message": "Dame la lista completa de mis loops activos con sus pasos,
                              frecuencia, último estado y señales recientes." }
   └─ Parsear respuesta → lista de loops

5. POR CADA LOOP:
   a. Determinar ruta de destino en el vault
      - Si el vault tiene carpeta Projects/ → crear nota en Projects/Loops/{loop-nombre}.md
      - Si el vault tiene estructura wiki/ → crear en wiki/loops/{loop-nombre}.md
      - Si no hay estructura clara → crear en raíz como {loop-nombre}.md
   
   b. Verificar si la nota ya existe
      - Si existe → actualizar secciones relevantes (no borrar notas del usuario)
      - Si no existe → crear desde template (ver sección 5.1.1)
   
   c. Escribir/actualizar la nota

6. ACTUALIZAR index del vault (si existe)
   └─ Agregar entradas en la sección correspondiente

7. REPORTAR al usuario
   └─ "Sincronizados X loops. Nuevos: Y. Actualizados: Z."
   └─ Listar nombres con links a las notas creadas
```

**Template de nota generada (loop → nota):**

```markdown
---
date: {fecha-hoy}
tags:
  - loop
  - loopy
  - {categoria-del-loop}
status: {estado-del-loop}
loop_id: {uuid}
loop_url: https://loopythinking.ai/loops/{uuid}
frecuencia: {frecuencia}
ultima_senal: {fecha-ultima-senal}
---

# {nombre-del-loop}

> {descripcion-del-loop}

## ¿Qué resuelve?
{que_resuelve}

## Pasos activos

### 🔍 Monitoreo
- **Para qué:** {monitoreo.para_que}
- **Cómo saberlo:** {monitoreo.como_lo_sabras}
- **Alerta cuando:** {monitoreo.cuando_alertar}
- **Frecuencia:** {monitoreo.frecuencia}

### 📊 Análisis *(si existe)*
{...mismo patrón...}

### ⚡ Acción *(si existe)*
{...mismo patrón...}

### 💡 Aprendizaje *(si existe)*
{...mismo patrón...}

## Señales recientes

| Fecha | Resultado | Severidad |
|-------|-----------|-----------|
| {fecha} | {resultado_general} | {severidad} |

## Contexto del vault

> Esta sección es generada por loopy-kb-enrich. Vincula este loop con tu conocimiento existente.

<!-- Vínculos a notas relacionadas se agregan automáticamente -->

## Notas personales

<!-- Tus reflexiones sobre este loop. Claude no toca esta sección. -->

---
*Sincronizado desde Loopy · {fecha} · [[index]]*
```

**Reglas importantes:**
- NUNCA borrar la sección "Notas personales" del usuario.
- Si la nota ya existe, solo actualizar: señales recientes, estado del loop, pasos modificados.
- Preservar todo el contenido escrito por el usuario.
- Si el vault tiene frontmatter obligatorio adicional (detectado en _CLAUDE.md), incluirlo.

---

### 5.2 `loopy-kb-push` — Vault → Señales

**Propósito:** Detectar actividad relevante en el vault y emitir señales automáticas a los loops correspondientes en Loopy.

**Trigger:** Usuario dice cualquiera de:
- "emite señal desde el vault"
- "registra esto en mis loops"
- "sincroniza el vault con Loopy"
- "push al vault"
- Al cerrar una daily note o terminar una sesión de trabajo significativa

**Flujo de ejecución:**

```
1. VERIFICAR credenciales y vault (igual que loopy-kb-pull)

2. IDENTIFICAR qué sincronizar
   └─ Si el usuario especificó un archivo o sección → usar ese
   └─ Si no → preguntar: ¿qué quieres registrar en tus loops?
      Opciones: [Daily note de hoy] [Decisiones recientes] [Proyecto específico] [Otra cosa]

3. LEER el contenido relevante del vault
   └─ Extraer: decisiones tomadas, tareas completadas, aprendizajes, capturas relevantes

4. OBTENER loops activos (para determinar destino de cada señal)
   └─ Mismo call que loopy-kb-pull paso 4

5. MAPEAR contenido → loops
   └─ Por cada elemento de contenido detectado:
      a. ¿A qué loop pertenece esta información?
         - Buscar loops cuyo nombre o categoría se relacione con el contenido
         - Si hay ambigüedad → preguntar al usuario
      b. ¿Vale la pena emitir señal o es ruido?
         - Solo emitir si hay resultado concreto, decisión o métrica

6. POR CADA SEÑAL A EMITIR:
   a. Construir signal_data siguiendo el schema de loopy-bridge
   b. Mostrar preview al usuario: "Voy a emitir esta señal al loop X: [resumen]"
   c. Esperar confirmación (o modo auto si el usuario lo configuró)
   d. Emitir via loopy-bridge intent "send_signal"

7. REPORTAR
   └─ "Emitidas X señales a Y loops."
```

**Reglas importantes:**
- NUNCA emitir señales sin mostrar preview primero (a menos que usuario haya activado modo auto explícitamente).
- Si no hay loop claro para un contenido → crear nota en `00 - Inbox/` del vault en lugar de emitir señal incorrecta.
- No emitir señales de contenido que ya fue sincronizado (detectar por timestamp).

---

### 5.3 `loopy-kb-enrich` — Vault como contexto para loops

**Propósito:** Cuando el usuario analiza un loop activo, inyectar automáticamente el contexto relevante de su vault para enriquecer el análisis.

**Trigger:** Usuario dice cualquiera de:
- "analiza el loop X con contexto"
- "enriquece el loop X"
- "qué dice mi vault sobre el loop X"
- Al abrir una nota de loop en el vault (si se detecta que el usuario está trabajando en una nota con tag `loop`)

**Flujo de ejecución:**

```
1. VERIFICAR credenciales y vault

2. IDENTIFICAR el loop objetivo
   └─ Si el usuario lo especificó → usar ese
   └─ Si hay una nota de loop abierta/activa → usar esa
   └─ Si no → listar loops activos y pedir selección

3. OBTENER detalles del loop
   └─ POST intent "general" → "Dame el estado actual, última señal y contexto del loop {nombre}"

4. BUSCAR contexto relevante en el vault
   Estrategia de búsqueda (en orden):
   a. Buscar notas con el nombre del loop en el título o wikilinks
   b. Buscar notas con los mismos tags del loop
   c. Buscar notas de proyectos/áreas relacionadas con la categoría del loop
   d. Buscar decisiones recientes en daily notes que mencionen el tema del loop
   e. Buscar en wiki/concepts/ síntesis relacionadas

5. CONSTRUIR contexto enriquecido
   └─ Combinar: datos del loop (Loopy) + contexto del vault (KB)
   └─ Identificar: ¿el vault confirma, contradice o amplía lo que dice el loop?
   └─ Detectar: ¿hay decisiones pasadas relevantes? ¿personas clave? ¿riesgos documentados?

6. PRESENTAR al usuario
   Formato de output:
   
   ## Loop: {nombre}
   **Estado:** {estado} · **Última señal:** {fecha}
   
   ### Lo que dice Loopy
   {resumen del estado actual del loop}
   
   ### Lo que dice tu vault
   - [[nota-relevante-1]] — {por qué es relevante}
   - [[nota-relevante-2]] — {por qué es relevante}
   
   ### Síntesis enriquecida
   {análisis combinando ambas fuentes}
   
   ### Preguntas que abre
   - {pregunta 1 que surge del cruce de información}
   - {pregunta 2}

7. OFRECER acciones
   └─ "¿Quieres que guarde esta síntesis como nota en tu vault?"
   └─ "¿Quieres emitir una señal al loop con este análisis?"
```

---

### 5.4 `loopy-org-kb` — Distribución Organizacional *(Paid only)*

**Propósito:** Distribuir insights de loops de equipo/corporativos a los vaults individuales de los miembros relevantes.

**Activación:** Solo disponible si la plataforma conectada es loopythinking.ai (detectado vía Platform Capability Detector).

**Flujo (spec simplificada para v1):**

```
1. Verificar capacidad organizacional en la plataforma
   └─ Si OSS → mostrar mensaje: "Este skill requiere loopythinking.ai"
   └─ Si paid → continuar

2. Obtener loops de equipo/corporativos donde el usuario es miembro

3. Por cada loop de equipo:
   a. Obtener señales e insights recientes
   b. Identificar qué miembros del equipo tienen vaults conectados
   c. Distribuir resumen relevante a los vaults individuales
      (respetando permisos y configuración de privacidad del loop)

4. Agregar sección "Insights de equipo" en la daily note de cada miembro
```

---

## 6. lib/ — Archivos de Soporte

### 6.1 `vault-conventions.md` — Convenciones por Defecto

Cuando el vault no tiene `_CLAUDE.md`, usar estas convenciones:

```
Carpeta de loops:     Projects/Loops/   (fallback: raíz del vault)
Carpeta de señales:   00 - Inbox/       (fallback: raíz del vault)  
Frontmatter mínimo:   date, tags, status
Tag de loop:          loop
Formato de fecha:     YYYY-MM-DD
Wikilinks:            [[nombre-sin-extensión]]
```

**Detección automática de estructura:**
- Si existe `_CLAUDE.md` → leerlo y extraer folder map
- Si existe `00 - Inbox/` → estructura PARA (Obsidian Second Brain)
- Si existe `wiki/` → estructura wiki-style
- Si no hay estructura clara → crear carpeta `Loops/` en la raíz

### 6.2 `platform-detector.md` — Detección de Plataforma

Para detectar si el usuario está en OSS o loopythinking.ai:

```
POST https://efsyebiumgieglwvxiss.supabase.co/functions/v1/mc-bridge/a2a/inbound
Body: {
  "session_key": "<LOOPY_SESSION_KEY>",
  "intent": "general",
  "to": "orion",
  "message": "¿Qué capacidades organizacionales están disponibles en esta sesión? ¿Es una cuenta OSS o de la plataforma?"
}
```

Interpretar respuesta:
- Si menciona capacidades organizacionales, multi-tenant, o team features → `platform: "paid"`
- Si menciona limitaciones o solo features individuales → `platform: "oss"`
- Si error → asumir `platform: "oss"` (fail safe)

### 6.3 `loop-to-note-mapping.md` — Mapeo Canónico

| Campo Loopy | Campo en nota | Transformación |
|-------------|---------------|----------------|
| `nombre` | `title` en frontmatter + `# heading` | Directo |
| `descripcion` | Primer párrafo bajo el heading | Directo |
| `que_resuelve` | Sección `## ¿Qué resuelve?` | Directo |
| `categoria` | `tag` en frontmatter (`individual/equipo/corporativo`) | Lowercase |
| `loop_id` | `loop_id` en frontmatter | Directo |
| `pasos` | Secciones bajo `## Pasos activos` | Ver template 5.1.1 |
| `monitoreo.frecuencia` | `frecuencia` en frontmatter | Directo |
| Señales recientes | Tabla bajo `## Señales recientes` | Últimas 5 señales |

---

## 7. Platform Capability Matrix

| Feature | Loopy OSS | loopythinking.ai |
|---------|-----------|------------------|
| loopy-kb-pull | ✅ | ✅ |
| loopy-kb-push | ✅ | ✅ |
| loopy-kb-enrich | ✅ | ✅ |
| loopy-org-kb | ❌ | ✅ |
| Distribución multi-vault | ❌ | ✅ |
| Insights de equipo en vault | ❌ | ✅ |
| Permisos por loop en vault | ❌ | ✅ |

---

## 8. Plan de Implementación para Claude Code

### Orden de construcción recomendado

**Fase 1 — Scaffolding (1 sesión)**
1. Crear estructura de carpetas del repo del plugin
2. Escribir `PLUGIN.md` (manifiesto)
3. Escribir `lib/vault-conventions.md`
4. Escribir `lib/loop-to-note-mapping.md`
5. Escribir `lib/platform-detector.md`
6. Crear `examples/` con ejemplos de notas y señales

**Fase 2 — loopy-kb-pull (1-2 sesiones)**
1. Escribir `skills/loopy-kb-pull/SKILL.md` siguiendo la spec de la sección 5.1
2. Probar manualmente: conectar con vault de prueba, obtener loops, generar notas
3. Validar que las notas siguen el template correctamente
4. Validar que las notas existentes no pierden contenido del usuario

**Fase 3 — loopy-kb-push (1 sesión)**
1. Escribir `skills/loopy-kb-push/SKILL.md` siguiendo la spec de la sección 5.2
2. Probar: tomar daily note de prueba, mapear contenido a loops, emitir señal
3. Validar el preview antes de emitir
4. Validar que no se emiten duplicados

**Fase 4 — loopy-kb-enrich (1 sesión)**
1. Escribir `skills/loopy-kb-enrich/SKILL.md` siguiendo la spec de la sección 5.3
2. Probar: tomar un loop activo, buscar contexto en vault, generar síntesis
3. Validar calidad del output enriquecido

**Fase 5 — loopy-org-kb (fase separada, solo paid)**
1. Validar API de capacidades organizacionales con el equipo de loopythinking.ai
2. Escribir `skills/loopy-org-kb/SKILL.md`
3. Probar con organización de prueba

**Fase 6 — Packaging y distribución**
1. Escribir `README.md` para usuarios finales
2. Empaquetar como `.plugin` para el marketplace de Cowork
3. Preparar distribución en GitHub (repo de Loopy OSS)
4. Documentar instalación y configuración

---

## 9. Preguntas Abiertas (validar antes o durante el build)

| # | Pregunta | Impacto | Dónde validar |
|---|----------|---------|---------------|
| 1 | ¿Hay un endpoint en la API de Loopy para listar loops activos del usuario? ¿O se hace via intent `general`? | Alto — afecta paso 4 de loopy-kb-pull | Revisar docs de Loopy API o preguntar al team |
| 2 | ¿Los loops de Loopy OSS tienen el mismo schema que los de loopythinking.ai? | Alto — afecta el template de nota | Revisar repo de Loopy OSS |
| 3 | ¿Cómo detectar confiablemente si una sesión es OSS o paid? | Medio — afecta platform-detector | Preguntar a Orion via API o revisar response headers |
| 4 | ¿La API de Loopy expone señales históricas? ¿Cuántas? | Medio — afecta la tabla de señales en la nota | Revisar docs |
| 5 | ¿Hay rate limits distintos para reads vs. writes en la API? | Bajo — afecta sincronizaciones masivas | Revisar docs |
| 6 | Para loopy-org-kb: ¿qué permisos necesita un agente para leer loops de otros miembros? | Alto para Fase 5 | Validar con equipo loopythinking.ai |

---

## 10. Decisiones de Diseño Tomadas

Estas decisiones están cerradas para v1 — no revisitar sin razón concreta:

1. **loopy-second-brain no habla directamente con la API** → siempre via loopy-bridge. Mantiene separación de responsabilidades.
2. **Un solo codebase para OSS y paid** → feature flags por capacidad de plataforma, no dos repos.
3. **Las notas del usuario son inviolables** → el plugin nunca borra ni modifica contenido escrito por el usuario. Solo agrega y actualiza secciones delimitadas.
4. **Preview antes de emitir señales** → loopy-kb-push siempre muestra lo que va a enviar antes de enviarlo, salvo modo auto explícito.
5. **Vault conventions por detección, no por configuración** → el plugin lee _CLAUDE.md o detecta la estructura automáticamente. El usuario no configura nada extra.

---

*Spec generada con Claude Cowork · Proyecto Loopy · 2026-05-06*
*Siguiente paso: abrir Claude Code, crear repo `loopy-second-brain`, y seguir Fase 1 del plan de implementación.*
