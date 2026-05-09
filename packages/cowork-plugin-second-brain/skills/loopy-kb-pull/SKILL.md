# loopy-kb-pull

Pull active loops from your Loopy instance into your vault as structured notes.

## Trigger phrases

Use this skill when the user says any of:
- "trae mis loops al vault"
- "sincroniza mis loops"
- "pull loops"
- "actualiza el vault con mis loops"
- "qué loops tengo activos" (when a vault is connected)

## Prerequisites

- Plugin `loopy-oss` must be installed and configured (LOOPY_BASE_URL + LOOPY_AGENT_TOKEN).
- A vault folder must be accessible via the Cowork file tools (Read/Write/Edit).

## Execution flow

### Step 1 — Verify credentials

Check that `LOOPY_AGENT_TOKEN` and `LOOPY_BASE_URL` are set.
If missing → invoke `loopy-oss-bridge` to complete setup before continuing.

### Step 2 — Verify vault access

Look for `_CLAUDE.md` or `index.md` in the vault root to detect structure.
If no vault is connected → ask the user to select their vault folder via Cowork's folder picker.

### Step 3 — Read vault conventions

If `_CLAUDE.md` exists → read it and extract:
- folder map (where to place loop notes)
- required frontmatter fields
- preferred tag format

If no `_CLAUDE.md` → use default conventions:
- Loop notes folder: `Projects/Loops/` (fallback: `Loops/` at vault root)
- Inbox folder: `00 - Inbox/`
- Frontmatter: `date`, `tags`, `status`
- Date format: `YYYY-MM-DD`
- Wikilinks: `[[name-without-extension]]`

Auto-detect vault structure:
- `00 - Inbox/` present → PARA structure (Obsidian Second Brain)
- `wiki/` present → wiki-style structure
- Neither → create `Loops/` at vault root

### Step 4 — Fetch active loops from Loopy

```
GET {LOOPY_BASE_URL}/loops
Authorization: Bearer {LOOPY_AGENT_TOKEN}
```

Parse the response to get the list of active loops with their steps, frequency, last status, and recent signals.

If the API does not return loops directly, fall back to a general intent message:
```json
{
  "intent": "general",
  "message": "List all my active loops with their steps, frequency, last state, and recent signals."
}
```

### Step 5 — For each loop: create or update note

Determine destination path in the vault (see Step 3 conventions).

If the note already exists → update only these sections:
- `## Señales recientes` table (append new rows, keep existing)
- Loop `status` in frontmatter
- Steps that have changed

Never overwrite the `## Notas personales` section or any user-written content.

If the note does not exist → create it from the template below.

### Step 6 — Update vault index (optional)

If the vault has an `index.md` or `README.md` → add or update the loop entry in the relevant section.

### Step 7 — Report to user

```
Sincronizados X loops. Nuevos: Y. Actualizados: Z.
- [[loop-name-1]]
- [[loop-name-2]]
```

---

## Note template (loop → note)

```markdown
---
date: {YYYY-MM-DD}
tags:
  - loop
  - loopy
  - {loop-category}
status: {loop-status}
loop_id: {uuid}
loop_url: {LOOPY_BASE_URL}/loops/{uuid}
frecuencia: {frequency}
ultima_senal: {YYYY-MM-DD}
---

# {loop-name}

> {loop-description}

## ¿Qué resuelve?
{what-it-solves}

## Pasos activos

### 🔍 Monitoreo
- **Para qué:** {monitoring.purpose}
- **Cómo saberlo:** {monitoring.how-to-know}
- **Alerta cuando:** {monitoring.when-to-alert}
- **Frecuencia:** {monitoring.frequency}

<!-- Repeat for Análisis, Acción, Aprendizaje if present -->

## Señales recientes

| Fecha | Resultado | Severidad |
|-------|-----------|-----------|
| {date} | {outcome} | {severity} |

## Contexto del vault

> Esta sección es generada por loopy-kb-enrich. Vincula este loop con tu conocimiento existente.

<!-- Related note links are added automatically by loopy-kb-enrich -->

## Notas personales

<!-- Your own reflections on this loop. Claude never modifies this section. -->

---
*Sincronizado desde Loopy · {date} · [[index]]*
```

---

## Hard rules

1. **Never delete or overwrite** the `## Notas personales` section.
2. **Preserve all user-written content** — only add or update delimited sections.
3. If the vault has additional required frontmatter (detected in `_CLAUDE.md`), include it.
4. If a loop note already exists and has user edits in step sections, keep those edits and only append new signal rows.
