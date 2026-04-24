# Good First Issues — Loopy OSS

Copy-paste these into GitHub Issues. Each is scoped, self-contained, and includes
enough context for a new contributor to get started without pinging maintainers.

Apply labels: `good-first-issue`, `help-wanted`, and the relevant area label.

---

## Issue 1 — Add a Railway deployment guide

**Labels:** `good-first-issue` `help-wanted` `docs` `self-hosting`

**Title:** `docs: add Railway deployment guide`

**Body:**

Loopy OSS runs on any platform that supports Docker. [Railway](https://railway.app) is a popular choice for quick self-hosted deployments and is free for small projects.

### What needs to be done

Create `docker/deploy-railway.md` with step-by-step instructions to deploy the full Loopy stack (API + web + Postgres) on Railway using the existing `docker-compose.yml` as a reference.

### Acceptance criteria

- [ ] The guide covers: creating a Railway project, provisioning a Postgres instance, setting the required env vars (see `.env.example`), deploying the API and web apps
- [ ] Screenshots or Railway config snippets are included
- [ ] A reader with no prior Railway experience can follow it in < 15 minutes
- [ ] Linked from `docker/README.md`

### Resources

- `.env.example` — required environment variables
- `docker/docker-compose.yml` — the reference stack
- Railway docs: https://docs.railway.app

**Estimated effort:** 2–4 hours

---

## Issue 2 — Add Vitest tests for LoopyMapper.classify()

**Labels:** `good-first-issue` `help-wanted` `testing` `sdk`

**Title:** `test(@loopy/sdk): add unit tests for LoopyMapper.classify()`

**Body:**

`LoopyMapper.map()` classifies free-text activity descriptions into one of the five cognitive layers (`perception`, `interpretation`, `decision`, `action`, `reflection`). The classification logic lives in `packages/sdk/src/mapper.ts` and currently has no automated tests.

### What needs to be done

Add a test file at `packages/sdk/src/__tests__/mapper.test.ts` using Vitest.

### Acceptance criteria

- [ ] At least 10 test cases covering all five cognitive layers
- [ ] At least 2 edge-case tests (empty string, ambiguous text)
- [ ] Tests pass with `npx turbo test --filter=@loopy/sdk`
- [ ] No changes to the production code (unless you find a bug — then open a separate issue)

### Resources

- `packages/sdk/src/mapper.ts` — the classifier to test
- `packages/sdk/src/__tests__/` — existing test examples
- `packages/sdk/package.json` — scripts: `"test": "vitest run"`

**Estimated effort:** 2–3 hours

---

## Issue 3 — Translate /framework page to English

**Labels:** `good-first-issue` `help-wanted` `web` `i18n`

**Title:** `feat(apps/web): add English version of /framework page`

**Body:**

The `/framework` page in `apps/web/src/pages/Framework.tsx` is currently written in Spanish (the initial audience). We want to add an English version so international contributors and self-hosters can understand the Loopy cognitive model.

### What needs to be done

Add a language toggle to the `/framework` page that switches between Spanish and English content.

### Acceptance criteria

- [ ] A toggle (e.g. `ES | EN` buttons in the top-right of the content area) switches all section text between languages
- [ ] All 6 sections are translated: cognitive cycle, Work Signals, Confidence Index, IPL, Scope, and FAQ
- [ ] The toggle selection is preserved in `localStorage` so it persists across page refreshes
- [ ] Existing Spanish content is not removed — it should remain the default
- [ ] The page renders correctly on mobile

### Resources

- `apps/web/src/pages/Framework.tsx` — the file to extend
- `apps/web/src/components/Layout.tsx` — layout reference

**Estimated effort:** 3–5 hours

---

## Issue 4 — Add `listByAgent()` method to LoopySignals

**Labels:** `good-first-issue` `help-wanted` `sdk`

**Title:** `feat(@loopy/sdk): add LoopySignals.listByAgent(agentId)`

**Body:**

Currently `LoopySignals.listByLoop(loopId)` lets you fetch all signals for a given loop. There's no method to fetch all signals emitted by a specific agent across all loops — useful for building agent activity dashboards.

The API already supports this via `GET /signals?agentId=:id` (you'll need to add this query param support to the API route too).

### What needs to be done

1. **API** (`apps/api/src/routes/signals.ts`): add `agentId` query param support to `GET /signals`
2. **SDK** (`packages/sdk/src/signals.ts`): add `LoopySignals.listByAgent(agentId, config)`
3. **Types** (`packages/sdk/src/types.ts`): extend if needed

### Acceptance criteria

- [ ] `GET /signals?agentId=:id` returns all signals emitted by that agent (scoped to the org via `X-Org-Id`)
- [ ] `LoopySignals.listByAgent(agentId, config)` works end-to-end
- [ ] JSDoc on the new SDK method
- [ ] At least one Vitest test for the new SDK method (mock the API)

**Estimated effort:** 3–4 hours

---

## Issue 5 — Add Render.com deployment guide

**Labels:** `good-first-issue` `help-wanted` `docs` `self-hosting`

**Title:** `docs: add Render.com deployment guide`

**Body:**

Similar to Railway (Issue #GFI-1), [Render.com](https://render.com) is a popular platform for deploying Docker-based apps with a generous free tier.

### What needs to be done

Create `docker/deploy-render.md` with a step-by-step guide to deploy Loopy OSS on Render using their native services (Web Service + PostgreSQL).

### Acceptance criteria

- [ ] Covers: creating a Render account, deploying the API as a Web Service, deploying the web app as a Static Site or Web Service, creating a Render PostgreSQL instance, wiring up env vars
- [ ] Includes the `render.yaml` Blueprint file for one-click deploys (optional but highly recommended)
- [ ] A reader can go from zero to a running Loopy instance in < 20 minutes
- [ ] Linked from `docker/README.md`

### Resources

- `.env.example` — required environment variables  
- `apps/api/Dockerfile` and `apps/web/Dockerfile` — Docker build contexts
- Render docs: https://render.com/docs/deploy-a-dockerfile
- Render Blueprint spec: https://render.com/docs/blueprint-spec

**Estimated effort:** 3–5 hours

---

## Issue 6 — Add `estimatedHumanMinutes` to SDK TypeScript docs + example

**Labels:** `good-first-issue` `help-wanted` `docs` `sdk`

**Title:** `docs(@loopy/sdk): document estimatedHumanMinutes with a worked example`

**Body:**

`WorkSignal.estimatedHumanMinutes` is the mechanism for overriding the IPL heuristic on a per-signal basis. It's mentioned in the type definition but there's no worked example showing when and how to use it, or what values are reasonable.

### What needs to be done

Add a section to `packages/sdk/README.md` titled **"Customising IPL per signal"** that explains:

1. What `estimatedHumanMinutes` is and when to use it (override the heuristic when the agent knows the actual time)
2. A TypeScript code example showing an agent emitting a signal with this field set
3. The valid range (0–480 = up to one full workday) and what happens if it's omitted
4. A note on why human-sourced signals don't contribute to IPL at all

### Acceptance criteria

- [ ] The section is in `packages/sdk/README.md`
- [ ] The code example compiles (runs `tsc --noEmit`)
- [ ] The explanation is in English, ≤ 300 words

**Estimated effort:** 1–2 hours — great first issue if you want to start with docs only.
