# oh-my-kiro (OMK)

<p align="center">
  <img src="https://penghuo.github.io/oh-my-kiro-website/omk-character-nobg.png" alt="oh-my-kiro character" width="280">
  <br>
  <em>Tu codex no está solo.</em>
</p>

[![npm version](https://img.shields.io/npm/v/oh-my-kiro)](https://www.npmjs.com/package/oh-my-kiro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

> **[Website](https://penghuo.github.io/oh-my-kiro-website/)** | **[Documentation](https://penghuo.github.io/oh-my-kiro-website/docs.html)** | **[CLI Reference](https://penghuo.github.io/oh-my-kiro-website/docs.html#cli-reference)** | **[Workflows](https://penghuo.github.io/oh-my-kiro-website/docs.html#workflows)** | **[Guía de integración de OpenClaw](./docs/openclaw-integration.es.md)** | **[GitHub](https://github.com/penghuo/oh-my-kiro)** | **[npm](https://www.npmjs.com/package/oh-my-kiro)**

Capa de orquestación multiagente para [OpenAI Codex CLI](https://github.com/openai/codex).

## Guías destacadas

- [Guía de integración de OpenClaw / pasarela genérica de notificaciones](./docs/openclaw-integration.es.md)

## Idiomas

- [English](./README.md)
- [한국어 (Korean)](./README.ko.md)
- [日本語 (Japanese)](./README.ja.md)
- [简体中文 (Chinese Simplified)](./README.zh.md)
- [繁體中文 (Chinese Traditional)](./README.zh-TW.md)
- [Tiếng Việt (Vietnamese)](./README.vi.md)
- [Español (Spanish)](./README.es.md)
- [Português (Portuguese)](./README.pt.md)
- [Русский (Russian)](./README.ru.md)
- [Türkçe (Turkish)](./README.tr.md)
- [Deutsch (German)](./README.de.md)
- [Français (French)](./README.fr.md)
- [Italiano (Italian)](./README.it.md)


OMK convierte Codex de un agente de sesión única en un sistema coordinado con:
- Role prompts (`/prompts:name`) para agentes especializados
- Workflow skills (`$name`) para modos de ejecución repetibles
- Orquestación de equipos en tmux (`omk team`, `$team`)
- Estado persistente y memoria a través de servidores MCP

## Por qué OMK

Codex CLI es potente para tareas directas. OMK añade estructura para trabajo más amplio:
- Descomposición y ejecución por etapas (`team-plan -> team-prd -> team-exec -> team-verify -> team-fix`)
- Estado persistente del ciclo de vida de modos (`.omk/state/`)
- Superficies de memoria y bloc de notas para sesiones prolongadas
- Controles operacionales para inicio, verificación y cancelación

OMK es un complemento, no un fork. Utiliza los puntos de extensión nativos de Codex.

## Requisitos

- macOS o Linux (Windows vía WSL2)
- Node.js >= 20
- Codex CLI instalado (`npm install -g @openai/codex`)
- Autenticación de Codex configurada

## Inicio rápido (3 minutos)

```bash
npm install -g oh-my-kiro
omk setup
omk doctor
```

Perfil de inicio recomendado para entornos de confianza:

```bash
omk --xhigh --madmax
```

## Novedades en v0.5.0

- **Configuración con alcance** mediante `omk setup --scope user|project` para modos de instalación flexibles.
- **Enrutamiento de Spark worker** vía `--spark` / `--madmax-spark` — los workers del equipo pueden usar `gpt-5.3-codex-spark` sin forzar el modelo líder.
- **Consolidación del catálogo** — se eliminaron prompts obsoletos (`deep-executor`, `scientist`) y 9 skills obsoletos para una superficie más compacta.
- **Niveles de detalle de notificaciones** para control granular de la salida de CCNotifier.

## Primera sesión

Dentro de Codex:

```text
/prompts:architect "analyze current auth boundaries"
/prompts:executor "implement input validation in login"
$plan "ship OAuth callback safely"
$team 3:executor "fix all TypeScript errors"
```

Desde la terminal:

```bash
omk team 4:executor "parallelize a multi-module refactor"
omk team status <team-name>
omk team shutdown <team-name>
```

## Modelo central

OMK instala y conecta estas capas:

```text
User
  -> Codex CLI
    -> AGENTS.md (cerebro de orquestación)
    -> ~/.codex/prompts/*.md (catálogo de prompts de agentes)
    -> ~/.agents/skills/*/SKILL.md (catálogo de skills)
    -> ~/.codex/config.toml (características, notificaciones, MCP)
    -> .omk/ (estado en ejecución, memoria, planes, registros)
```

## Comandos principales

```bash
omk                # Lanzar Codex (+ HUD en tmux cuando está disponible)
omk setup          # Instalar prompts/skills/config por alcance + proyecto AGENTS.md/.omk
omk doctor         # Diagnósticos de instalación/ejecución
omk doctor --team  # Diagnósticos de Team/swarm
omk team ...       # Iniciar/estado/reanudar/apagar workers tmux del equipo
omk status         # Mostrar modos activos
omk cancel         # Cancelar modos de ejecución activos
omk reasoning <mode> # low|medium|high|xhigh
omk tmux-hook ...  # init|status|validate|test
omk hooks ...      # init|status|validate|test (flujo de trabajo de extensión de plugins)
omk hud ...        # --watch|--json|--preset
omk help
```

## Extensión de Hooks (Superficie adicional)

OMK ahora incluye `omk hooks` para scaffolding y validación de plugins.

- `omk tmux-hook` sigue siendo compatible y no ha cambiado.
- `omk hooks` es aditivo y no reemplaza los flujos de trabajo de tmux-hook.
- Los archivos de plugins se encuentran en `.omk/hooks/*.mjs`.
- Los plugins están desactivados por defecto; actívalos con `OMK_HOOK_PLUGINS=1`.

Consulta `docs/hooks-extension.md` para el flujo de trabajo completo de extensiones y el modelo de eventos.

## Flags de inicio

```bash
--yolo
--high
--xhigh
--madmax
--force
--dry-run
--verbose
--scope <user|project>  # solo para setup
```

`--madmax` se mapea a Codex `--dangerously-bypass-approvals-and-sandbox`.
Úsalo solo en entornos sandbox de confianza o externos.

### Política de workingDirectory MCP (endurecimiento opcional)

Por defecto, las herramientas MCP de state/memory/trace aceptan el `workingDirectory` proporcionado por el llamador.
Para restringir esto, establece una lista de raíces permitidas:

```bash
export OMK_MCP_WORKDIR_ROOTS="/path/to/project:/path/to/another-root"
```

Cuando se establece, los valores de `workingDirectory` fuera de estas raíces son rechazados.

## Control de prompts Codex-First

Por defecto, OMK inyecta:

```text
-c model_instructions_file="<cwd>/AGENTS.md"
```

Esto añade las instrucciones del proyecto `AGENTS.md` a los comandos de inicio de Codex.
Extiende el comportamiento de Codex, pero no reemplaza ni elude las políticas centrales del sistema Codex.

Controles:

```bash
OMK_BYPASS_DEFAULT_SYSTEM_PROMPT=0 omk     # desactivar inyección de AGENTS.md
OMK_MODEL_INSTRUCTIONS_FILE=/path/to/instructions.md omk
```

## Modo equipo

Usa el modo equipo para trabajo amplio que se beneficia de workers paralelos.

Ciclo de vida:

```text
start -> assign scoped lanes -> monitor -> verify terminal tasks -> shutdown
```

Comandos operacionales:

```bash
omk team <args>
omk team status <team-name>
omk team resume <team-name>
omk team shutdown <team-name>
```

Regla importante: no apagues mientras las tareas estén en estado `in_progress` a menos que estés abortando.

### Política de limpieza Ralph

Cuando un equipo se ejecuta en modo ralph (`omk team ralph ...`), la limpieza al apagar
aplica una política dedicada diferente a la ruta normal:

| Comportamiento | Equipo normal | Equipo Ralph |
|---|---|---|
| Apagado forzado en caso de fallo | Lanza `shutdown_gate_blocked` | Omite la puerta, registra evento `ralph_cleanup_policy` |
| Eliminación automática de ramas | Elimina ramas de worktree en rollback | Preserva ramas (`skipBranchDeletion`) |
| Registro de finalización | Evento estándar `shutdown_gate` | Evento adicional `ralph_cleanup_summary` con desglose de tareas |

La política Ralph se detecta automáticamente del estado del modo equipo (`linked_ralph`) o
se puede pasar explícitamente vía `omk team shutdown <name> --ralph`.

Selección de Worker CLI para los workers del equipo:

```bash
OMK_TEAM_WORKER_CLI=auto    # predeterminado; usa claude cuando worker --model contiene "claude"
OMK_TEAM_WORKER_CLI=codex   # forzar workers Codex CLI
OMK_TEAM_WORKER_CLI=claude  # forzar workers Claude CLI
OMK_TEAM_WORKER_CLI_MAP=codex,codex,claude,claude  # mezcla de CLI por worker (longitud=1 o cantidad de workers)
OMK_TEAM_AUTO_INTERRUPT_RETRY=0  # opcional: desactivar fallback adaptativo queue->resend
```

Notas:
- Los argumentos de inicio de workers se comparten a través de `OMK_TEAM_WORKER_LAUNCH_ARGS`.
- `OMK_TEAM_WORKER_CLI_MAP` anula `OMK_TEAM_WORKER_CLI` para selección por worker.
- El envío de triggers usa reintentos adaptativos por defecto (queue/submit, luego fallback seguro clear-line+resend cuando es necesario).
- En modo Claude worker, OMK lanza workers como `claude` simple (sin argumentos de inicio extra) e ignora anulaciones explícitas de `--model` / `--config` / `--effort` para que Claude use el `settings.json` predeterminado.

## Qué escribe `omk setup`

- `.omk/setup-scope.json` (alcance de instalación persistido)
- Instalaciones dependientes del alcance:
  - `user`: `~/.codex/prompts/`, `~/.agents/skills/`, `~/.codex/config.toml`, `~/.omk/agents/`
  - `project`: `./.codex/prompts/`, `./.agents/skills/`, `./.codex/config.toml`, `./.omk/agents/`
- Comportamiento de inicio: si el alcance persistido es `project`, el lanzamiento de `omk` usa automáticamente `CODEX_HOME=./.codex` (a menos que `CODEX_HOME` ya esté establecido).
- El `AGENTS.md` existente se preserva por defecto. En ejecuciones TTY interactivas, setup pregunta antes de sobrescribir; `--force` sobrescribe sin preguntar (las verificaciones de seguridad de sesiones activas siguen aplicándose).
- Actualizaciones de `config.toml` (para ambos alcances):
  - `notify = ["node", "..."]`
  - `model_reasoning_effort = "high"`
  - `developer_instructions = "..."`
  - `[features] multi_agent = true, child_agents_md = true`
  - Entradas de servidores MCP (`omk_state`, `omk_memory`, `omk_code_intel`, `omk_trace`)
  - `[tui] status_line`
- `AGENTS.md` del proyecto
- Directorios `.omk/` de ejecución y configuración de HUD

## Agentes y skills

- Prompts: `prompts/*.md` (instalados en `~/.codex/prompts/` para `user`, `./.codex/prompts/` para `project`)
- Skills: `skills/*/SKILL.md` (instalados en `~/.agents/skills/` para `user`, `./.agents/skills/` para `project`)

Ejemplos:
- Agentes: `architect`, `planner`, `executor`, `debugger`, `verifier`, `security-reviewer`
- Skills: `autopilot`, `plan`, `team`, `ralph`, `ultrawork`, `cancel`

## Estructura del proyecto

```text
oh-my-kiro/
  bin/omk.js
  src/
    cli/
    team/
    mcp/
    hooks/
    hud/
    config/
    modes/
    notifications/
    verification/
  prompts/
  skills/
  templates/
  scripts/
```

## Desarrollo

```bash
git clone https://github.com/penghuo/oh-my-kiro.git
cd oh-my-kiro
npm install
npm run build
npm test
```

## Documentación

- **[Documentación completa](https://penghuo.github.io/oh-my-kiro-website/docs.html)** — Guía completa
- **[Referencia CLI](https://penghuo.github.io/oh-my-kiro-website/docs.html#cli-reference)** — Todos los comandos `omk`, flags y herramientas
- **[Guía de notificaciones](https://penghuo.github.io/oh-my-kiro-website/docs.html#notifications)** — Configuración de Discord, Telegram, Slack y webhooks
- **[Flujos de trabajo recomendados](https://penghuo.github.io/oh-my-kiro-website/docs.html#workflows)** — Cadenas de skills probadas en batalla para tareas comunes
- **[Notas de versión](https://penghuo.github.io/oh-my-kiro-website/docs.html#release-notes)** — Novedades en cada versión

## Notas

- Registro de cambios completo: `CHANGELOG.md`
- Guía de migración (post-v0.4.4 mainline): `docs/migration-mainline-post-v0.4.4.md`
- Notas de cobertura y paridad: `COVERAGE.md`
- Flujo de trabajo de extensión de hooks: `docs/hooks-extension.md`
- Detalles de instalación y contribución: `CONTRIBUTING.md`

## Agradecimientos

Inspirado en [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode), adaptado para Codex CLI.

## Licencia

MIT
