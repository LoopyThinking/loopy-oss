# @loopythinking/cowork-plugin-second-brain

Connect your Loopy loops with your personal or team knowledge base (Obsidian vault or any Second Brain). Pull loop insights into your vault as structured notes, push vault activity as loop signals, and enrich loop analysis with your KB context.

## Installation

1. Download or build the `.plugin` bundle (see [Packaging](#packaging)).
2. In Cowork → Settings → Plugins, click **Install** and select the file.
3. Set the environment variables (see below).

**Requires:** `loopy-oss` plugin (installed separately — handles auth, agent registration, and API communication).

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `LOOPY_SESSION_KEY` | Yes* | *(empty)* | Session key for Loopy API access. Set via `loopy-oss` or `loopy-bridge` setup. |
| `LOOPY_AGENT_REGISTRY_TOKEN` | Yes* | *(empty)* | Agent registry token. Set via `loopy-oss` or `loopy-bridge` setup. |
| `LOOPY_VAULT_PATH` | No | *(empty)* | Absolute path to your Obsidian vault or Second Brain folder. If not set, the agent will ask for folder access at first use. |

*Set automatically by the `loopy-oss` plugin's setup flow. You only need to set these manually if you're not using `loopy-oss`.

## Skills

### OSS & Paid tiers

| Skill | Purpose | Tier |
|---|---|---|
| `loopy-kb-pull` | Pull active loops into your vault as structured notes | oss |
| `loopy-kb-push` | Emit signals from vault activity to existing loops | oss |
| `loopy-kb-enrich` | Enrich active loop analysis with context from your vault | oss |

### Paid tier only (loopythinking.ai)

| Skill | Purpose | Tier |
|---|---|---|
| `loopy-org-kb` | Distribute team loop insights across individual vaults | paid |

## Quick start

```
"trae mis loops al vault"        → loopy-kb-pull (first sync)
"sincroniza mis loops"           → loopy-kb-pull (update existing)
"emite señal desde el vault"     → loopy-kb-push (push vault activity)
"registra esto en mis loops"     → loopy-kb-push (targeted push)
"analiza el loop X con contexto" → loopy-kb-enrich (enrich analysis)
"qué dice mi vault sobre el loop X" → loopy-kb-enrich (context lookup)
```

## How the vault is used

The plugin reads and writes to your vault following these rules:

- **Reads** `_CLAUDE.md` if it exists to understand your folder structure and frontmatter conventions.
- **Without `_CLAUDE.md`**, uses sensible defaults: loops go in `Projects/Loops/`, signals reference the `00 - Inbox/`, frontmatter includes `date`, `tags`, and `status`.
- **Never deletes or modifies** your personal notes. The `## Notas personales` section in any loop note is never touched.
- **Only updates** the sections it manages: signal tables, loop status, active steps.

## Platform detection

The plugin auto-detects whether you're on Loopy OSS or loopythinking.ai:

| Feature | Loopy OSS | loopythinking.ai |
|---|---|---|
| loopy-kb-pull | Yes | Yes |
| loopy-kb-push | Yes | Yes |
| loopy-kb-enrich | Yes | Yes |
| loopy-org-kb | No | Yes |
| Multi-vault distribution | No | Yes |
| Team insights | No | Yes |

If a paid-only skill is invoked on OSS, the plugin shows: "Este skill requiere loopythinking.ai."

## Packaging

Build the `.plugin` bundle from source:

```bash
cd packages/cowork-plugin-second-brain
./scripts/package.sh
```

This produces `dist/loopy-second-brain-0.1.0.plugin` — a zip containing `plugin.json` and the `skills/` directory. The bundle excludes `package.json`, `SPEC.md`, `lib/`, and `examples/`.

To install, point Cowork at the `.plugin` file: Settings → Plugins → Install.

## License

AGPL-3.0-only — see [LICENSE](../../LICENSE) in the repository root.
