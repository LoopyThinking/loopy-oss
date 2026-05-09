# loopy-kb-push

Detect relevant activity in your vault and emit signals to the corresponding loops in Loopy.

## Trigger phrases

Use this skill when the user says any of:
- "emite señal desde el vault"
- "registra esto en mis loops"
- "sincroniza el vault con Loopy"
- "push al vault"
- At the end of a daily note session or significant work block (when user indicates they've finished)

## Prerequisites

- Plugin `loopy-oss` must be installed and configured (LOOPY_BASE_URL + LOOPY_AGENT_TOKEN).
- A vault folder must be accessible via the Cowork file tools (Read/Write/Edit).

## Execution flow

### Step 1 — Verify credentials and vault

Same as `loopy-kb-pull` Step 1 and Step 2.

### Step 2 — Identify what to sync

If the user specified a file or section → use that content directly.

If not → ask:
> "¿Qué quieres registrar en tus loops?"
> Options: `[Daily note de hoy]` · `[Decisiones recientes]` · `[Proyecto específico]` · `[Otra cosa]`

### Step 3 — Read relevant vault content

Read the target file(s) and extract:
- Completed tasks / decisions taken
- Learnings or insights captured
- Metrics or outcomes noted

### Step 4 — Fetch active loops (to determine signal destination)

Same API call as `loopy-kb-pull` Step 4.

### Step 5 — Map content → loops

For each extracted content item:

a. **Which loop does this belong to?**
   - Match loops whose name or category is semantically related to the content
   - If ambiguous → ask the user: "Este contenido puede ir al loop X o al loop Y. ¿Cuál prefieres?"

b. **Is this worth a signal or is it noise?**
   - Only emit if there is a concrete result, decision, or metric
   - Skip vague or incomplete items

### Step 6 — Show preview and confirm

For each signal to emit, show:

```
📤 Señal para loop: {loop-name}
   Resultado: {outcome-summary}
   Severidad: {severity}
   ¿Emitir? [Sí] [Editar] [Saltar]
```

Wait for user confirmation **unless** the user has explicitly enabled auto mode in this session.

### Step 7 — Emit signals via loopy-oss-bridge

For each confirmed signal, invoke `loopy-oss-signal-emit` with the prepared signal data.

### Step 8 — Report

```
Emitidas X señales a Y loops.
```

---

## Hard rules

1. **Never emit a signal without showing a preview first** (unless user has explicitly enabled auto mode).
2. If there is no clear loop for a content item → create a capture note in `00 - Inbox/` instead of emitting to the wrong loop.
3. Do not re-emit signals for content already synced (detect by timestamp or a `synced_to_loopy: true` frontmatter flag).
4. Always delegate actual signal emission to `loopy-oss-signal-emit` — do not call the Loopy API directly.
