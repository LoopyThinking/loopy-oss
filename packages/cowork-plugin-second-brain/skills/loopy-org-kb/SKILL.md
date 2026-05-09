# loopy-org-kb

> **Paid tier only — loopythinking.ai**
> This skill is not available in self-hosted Loopy OSS instances.

Distribute team and organizational loop insights across individual member vaults.

## Availability check (required first step)

Before doing anything else, detect whether the connected platform supports organizational features:

```
GET {LOOPY_BASE_URL}/me
Authorization: Bearer {LOOPY_AGENT_TOKEN}
```

If the response does not include organizational/team loop permissions, or if the base URL points to a self-hosted OSS instance → show this message and stop:

```
Este skill requiere loopythinking.ai.

loopy-org-kb distribuye insights de loops de equipo a los vaults individuales
de los miembros, una capacidad que requiere la plataforma cloud de Loopy.

En tu instancia self-hosted (OSS), tienes disponibles:
  • loopy-kb-pull   → Traer loops al vault
  • loopy-kb-push   → Emitir señales desde el vault
  • loopy-kb-enrich → Enriquecer loops con contexto del vault
```

## Trigger phrases (paid platform only)

- "distribuye los loops del equipo a los vaults"
- "sincroniza los loops de equipo con los vaults individuales"
- "envía insights de equipo al vault de [person]"

## Execution flow (v1 spec — paid platform)

### Step 1 — Confirm platform capability

(See availability check above.)

### Step 2 — Fetch team/organizational loops where user is a member

Only loops with scope `team` or `organizational` where the user has read access.

### Step 3 — For each team loop

a. Fetch recent signals and insights.
b. Identify which team members have connected vaults.
c. Distribute a relevant summary to each member's vault — respecting the loop's privacy/permission settings.
d. Append an "Insights de equipo" section to each member's daily note (if one exists for today).

### Step 4 — Report

```
Distribuidos insights de X loops a Y miembros del equipo.
```

---

## Implementation note

This skill requires API endpoints for organizational loop access and multi-user vault targeting that are only available in loopythinking.ai. Full spec to be defined in coordination with the loopythinking.ai team before implementing Phase 5.

See `SPEC.md` Section 9 (Open Questions) item #6 for required API clarifications.
