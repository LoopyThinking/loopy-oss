# loopy-kb-enrich

Enrich an active loop's analysis by injecting relevant context from your vault.

## Trigger phrases

Use this skill when the user says any of:
- "analiza el loop X con contexto"
- "enriquece el loop X"
- "qué dice mi vault sobre el loop X"
- When the user is working on a note tagged `loop` in the vault (proactive enrichment)

## Prerequisites

- Plugin `loopy-oss` must be installed and configured (LOOPY_BASE_URL + LOOPY_AGENT_TOKEN).
- A vault folder must be accessible via the Cowork file tools (Read/Write/Edit).

## Execution flow

### Step 1 — Verify credentials and vault

Same as `loopy-kb-pull` Step 1 and Step 2.

### Step 2 — Identify the target loop

If the user specified a loop by name → use that.
If there is an active note open with a `loop` tag → use that loop.
If neither → fetch the active loops list and ask the user to select one.

### Step 3 — Fetch loop details from Loopy

```
GET {LOOPY_BASE_URL}/loops/{loop_id}
Authorization: Bearer {LOOPY_AGENT_TOKEN}
```

Extract: current status, last signal, recent signal history, step definitions.

### Step 4 — Search for relevant context in the vault

Apply search strategies in order:

1. Notes with the loop name in the title or as a `[[wikilink]]`
2. Notes sharing the same tags as the loop category
3. Project or area notes related to the loop's domain
4. Daily notes mentioning the loop's topic or related decisions
5. `wiki/concepts/` or equivalent synthesis notes on related themes

Read only the most relevant excerpts — do not load the entire vault into context.

### Step 5 — Build enriched context

Combine:
- Loop data from Loopy (current state, signals, steps)
- Relevant vault content (notes, decisions, context)

Identify:
- Does the vault **confirm** what the loop is reporting?
- Does the vault **contradict** or surface overlooked information?
- Does the vault **add context** the loop data doesn't capture?

### Step 6 — Present enriched analysis

```markdown
## Loop: {loop-name}
**Estado:** {status} · **Última señal:** {date}

### Lo que dice Loopy
{summary of current loop state}

### Lo que dice tu vault
- [[relevant-note-1]] — {why it's relevant}
- [[relevant-note-2]] — {why it's relevant}

### Síntesis enriquecida
{combined analysis from both sources}

### Preguntas que abre
- {question emerging from the cross-reference}
- {question 2}
```

### Step 7 — Offer follow-up actions

> "¿Quieres que guarde esta síntesis como nota en tu vault?"
> "¿Quieres emitir una señal al loop con este análisis?"

If the user confirms saving → write the synthesis to the loop's vault note under a timestamped subsection inside `## Contexto del vault`. Never overwrite `## Notas personales`.

---

## Hard rules

1. **Never modify** the `## Notas personales` section of any vault note.
2. Only append to `## Contexto del vault` — never replace prior enrichment entries.
3. Delegate signal emission to `loopy-oss-signal-emit` if the user wants to push the synthesis as a signal.
4. If vault search returns no relevant content → be explicit: "No encontré contexto relevante en tu vault para este loop."
