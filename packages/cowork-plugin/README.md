# @loopythinking/cowork-plugin

Cowork plugin for self-hosted **Loopy OSS** instances. Provides five skills that let Claude interact with your local Loopy API — no cloud, no Orion, no corporate fields.

## Installation

1. Download or build the `.plugin` bundle.
2. In Cowork → Settings → Plugins, click **Install** and select the file.
3. Set the required environment variables (see below).

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `LOOPY_BASE_URL` | No | `http://localhost:3001` | API base URL (no trailing slash) |
| `LOOPY_AGENT_TOKEN` | No* | *(empty)* | Agent token. Obtained automatically on first run. |

*The bridge skill will run the registration flow if `LOOPY_AGENT_TOKEN` is not set.

## Skills

| Skill | Purpose |
|---|---|
| `loopy-oss-bridge` | Setup, agent registration, org context |
| `loopy-oss-loop-mapper` | Work Signal → Loop pipeline |
| `loopy-oss-signal-emit` | Emit a signal to an existing loop |
| `loopy-oss-collab-bridge` | Generate invite links, manage team |
| `loopy-oss-ipl-tracker` | Summarise IPL hours |

## Quick start

```
"registra mi agente"     → loopy-oss-bridge (first time setup)
"crea un loop de prueba" → loopy-oss-loop-mapper
"agrega señal al loop X" → loopy-oss-signal-emit
"invita a María al equipo" → loopy-oss-collab-bridge
"cuántas horas liberó el agente este mes" → loopy-oss-ipl-tracker
```

## Differences from cloud skills

| Cloud skill | OSS replacement | Why different |
|---|---|---|
| `loopy-bridge` (registers in Orion) | `loopy-oss-bridge` | No Orion in OSS — uses `POST /agents` directly |
| Asks for "rol corporativo", "área" | Asks for `display_name` only | OSS is self-hosted, no corporate directory |
| Points to `loopythinking.ai` | Points to `LOOPY_BASE_URL` | Configurable local/remote instance |
