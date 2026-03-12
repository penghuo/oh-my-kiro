# oh-my-kiro (OMK)

<p align="center">
  <img src="https://penghuo.github.io/oh-my-kiro-website/omk-character-nobg.png" alt="oh-my-kiro character" width="280">
  <br>
  <em>Seu codex não está sozinho.</em>
</p>

[![npm version](https://img.shields.io/npm/v/oh-my-kiro)](https://www.npmjs.com/package/oh-my-kiro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

> **[Website](https://penghuo.github.io/oh-my-kiro-website/)** | **[Documentation](https://penghuo.github.io/oh-my-kiro-website/docs.html)** | **[CLI Reference](https://penghuo.github.io/oh-my-kiro-website/docs.html#cli-reference)** | **[Workflows](https://penghuo.github.io/oh-my-kiro-website/docs.html#workflows)** | **[Guia de integração OpenClaw](./docs/openclaw-integration.pt.md)** | **[GitHub](https://github.com/penghuo/oh-my-kiro)** | **[npm](https://www.npmjs.com/package/oh-my-kiro)**

Camada de orquestração multiagente para [OpenAI Codex CLI](https://github.com/openai/codex).

## Guias em destaque

- [Guia de integração OpenClaw / gateway genérico de notificações](./docs/openclaw-integration.pt.md)

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


OMK transforma o Codex de um agente de sessão única em um sistema coordenado com:
- Role prompts (`/prompts:name`) para agentes especializados
- Workflow skills (`$name`) para modos de execução repetíveis
- Orquestração de equipes no tmux (`omk team`, `$team`)
- Estado persistente e memória via servidores MCP

## Por que OMK

Codex CLI é forte para tarefas diretas. OMK adiciona estrutura para trabalhos maiores:
- Decomposição e execução em etapas (`team-plan -> team-prd -> team-exec -> team-verify -> team-fix`)
- Estado persistente do ciclo de vida dos modos (`.omk/state/`)
- Superfícies de memória e bloco de notas para sessões longas
- Controles operacionais para início, verificação e cancelamento

OMK é um complemento, não um fork. Utiliza os pontos de extensão nativos do Codex.

## Requisitos

- macOS ou Linux (Windows via WSL2)
- Node.js >= 20
- Codex CLI instalado (`npm install -g @openai/codex`)
- Autenticação do Codex configurada

## Início rápido (3 minutos)

```bash
npm install -g oh-my-kiro
omk setup
omk doctor
```

Perfil de inicialização recomendado para ambientes confiáveis:

```bash
omk --xhigh --madmax
```

## Novidades na v0.5.0

- **Configuração com escopo** via `omk setup --scope user|project` para modos de instalação flexíveis.
- **Roteamento de Spark worker** via `--spark` / `--madmax-spark` — workers da equipe podem usar `gpt-5.3-codex-spark` sem forçar o modelo líder.
- **Consolidação do catálogo** — removidos prompts obsoletos (`deep-executor`, `scientist`) e 9 skills obsoletas para uma superfície mais enxuta.
- **Níveis de detalhamento de notificações** para controle granular da saída do CCNotifier.

## Primeira sessão

Dentro do Codex:

```text
/prompts:architect "analyze current auth boundaries"
/prompts:executor "implement input validation in login"
$plan "ship OAuth callback safely"
$team 3:executor "fix all TypeScript errors"
```

Do terminal:

```bash
omk team 4:executor "parallelize a multi-module refactor"
omk team status <team-name>
omk team shutdown <team-name>
```

## Modelo central

OMK instala e conecta estas camadas:

```text
User
  -> Codex CLI
    -> AGENTS.md (cérebro de orquestração)
    -> ~/.codex/prompts/*.md (catálogo de prompts de agentes)
    -> ~/.agents/skills/*/SKILL.md (catálogo de skills)
    -> ~/.codex/config.toml (funcionalidades, notificações, MCP)
    -> .omk/ (estado de execução, memória, planos, logs)
```

## Comandos principais

```bash
omk                # Iniciar Codex (+ HUD no tmux quando disponível)
omk setup          # Instalar prompts/skills/config por escopo + projeto AGENTS.md/.omk
omk doctor         # Diagnósticos de instalação/execução
omk doctor --team  # Diagnósticos de Team/swarm
omk team ...       # Iniciar/status/retomar/encerrar workers tmux da equipe
omk status         # Mostrar modos ativos
omk cancel         # Cancelar modos de execução ativos
omk reasoning <mode> # low|medium|high|xhigh
omk tmux-hook ...  # init|status|validate|test
omk hooks ...      # init|status|validate|test (fluxo de trabalho de extensão de plugins)
omk hud ...        # --watch|--json|--preset
omk help
```

## Extensão de Hooks (Superfície adicional)

OMK agora inclui `omk hooks` para scaffolding e validação de plugins.

- `omk tmux-hook` continua sendo suportado e não foi alterado.
- `omk hooks` é aditivo e não substitui os fluxos de trabalho do tmux-hook.
- Arquivos de plugins ficam em `.omk/hooks/*.mjs`.
- Plugins estão desativados por padrão; ative com `OMK_HOOK_PLUGINS=1`.

Consulte `docs/hooks-extension.md` para o fluxo de trabalho completo de extensões e modelo de eventos.

## Flags de inicialização

```bash
--yolo
--high
--xhigh
--madmax
--force
--dry-run
--verbose
--scope <user|project>  # apenas para setup
```

`--madmax` mapeia para Codex `--dangerously-bypass-approvals-and-sandbox`.
Use apenas em ambientes sandbox confiáveis ou externos.

### Política de workingDirectory MCP (endurecimento opcional)

Por padrão, as ferramentas MCP de state/memory/trace aceitam o `workingDirectory` fornecido pelo chamador.
Para restringir isso, defina uma lista de raízes permitidas:

```bash
export OMK_MCP_WORKDIR_ROOTS="/path/to/project:/path/to/another-root"
```

Quando definido, valores de `workingDirectory` fora dessas raízes são rejeitados.

## Controle de prompts Codex-First

Por padrão, OMK injeta:

```text
-c model_instructions_file="<cwd>/AGENTS.md"
```

Isso adiciona as instruções do projeto `AGENTS.md` aos comandos de inicialização do Codex.
Estende o comportamento do Codex, mas não substitui nem contorna as políticas centrais do sistema Codex.

Controles:

```bash
OMK_BYPASS_DEFAULT_SYSTEM_PROMPT=0 omk     # desativar injeção de AGENTS.md
OMK_MODEL_INSTRUCTIONS_FILE=/path/to/instructions.md omk
```

## Modo equipe

Use o modo equipe para trabalhos amplos que se beneficiam de workers paralelos.

Ciclo de vida:

```text
start -> assign scoped lanes -> monitor -> verify terminal tasks -> shutdown
```

Comandos operacionais:

```bash
omk team <args>
omk team status <team-name>
omk team resume <team-name>
omk team shutdown <team-name>
```

Regra importante: não encerre enquanto tarefas estiverem em estado `in_progress`, a menos que esteja abortando.

### Política de limpeza Ralph

Quando uma equipe roda em modo ralph (`omk team ralph ...`), a limpeza no encerramento
aplica uma política dedicada diferente do caminho normal:

| Comportamento | Equipe normal | Equipe Ralph |
|---|---|---|
| Encerramento forçado em caso de falha | Lança `shutdown_gate_blocked` | Ignora a porta, registra evento `ralph_cleanup_policy` |
| Exclusão automática de branches | Exclui branches do worktree no rollback | Preserva branches (`skipBranchDeletion`) |
| Log de conclusão | Evento padrão `shutdown_gate` | Evento adicional `ralph_cleanup_summary` com detalhamento de tarefas |

A política Ralph é detectada automaticamente do estado do modo equipe (`linked_ralph`) ou
pode ser passada explicitamente via `omk team shutdown <name> --ralph`.

Seleção de Worker CLI para workers da equipe:

```bash
OMK_TEAM_WORKER_CLI=auto    # padrão; usa claude quando worker --model contém "claude"
OMK_TEAM_WORKER_CLI=codex   # forçar workers Codex CLI
OMK_TEAM_WORKER_CLI=claude  # forçar workers Claude CLI
OMK_TEAM_WORKER_CLI_MAP=codex,codex,claude,claude  # mix de CLI por worker (comprimento=1 ou quantidade de workers)
OMK_TEAM_AUTO_INTERRUPT_RETRY=0  # opcional: desativar fallback adaptativo queue->resend
```

Notas:
- Argumentos de inicialização de workers são compartilhados via `OMK_TEAM_WORKER_LAUNCH_ARGS`.
- `OMK_TEAM_WORKER_CLI_MAP` sobrescreve `OMK_TEAM_WORKER_CLI` para seleção por worker.
- O envio de triggers usa retentativas adaptativas por padrão (queue/submit, depois fallback seguro clear-line+resend quando necessário).
- No modo Claude worker, OMK inicia workers como `claude` simples (sem argumentos extras de inicialização) e ignora substituições explícitas de `--model` / `--config` / `--effort` para que o Claude use o `settings.json` padrão.

## O que `omk setup` grava

- `.omk/setup-scope.json` (escopo de instalação persistido)
- Instalações dependentes do escopo:
  - `user`: `~/.codex/prompts/`, `~/.agents/skills/`, `~/.codex/config.toml`, `~/.omk/agents/`
  - `project`: `./.codex/prompts/`, `./.agents/skills/`, `./.codex/config.toml`, `./.omk/agents/`
- Comportamento de inicialização: se o escopo persistido for `project`, o lançamento do `omk` usa automaticamente `CODEX_HOME=./.codex` (a menos que `CODEX_HOME` já esteja definido).
- O `AGENTS.md` existente é preservado por padrão. Em execuções TTY interativas, o setup pergunta antes de sobrescrever; `--force` sobrescreve sem perguntar (verificações de segurança de sessões ativas continuam aplicáveis).
- Atualizações do `config.toml` (para ambos os escopos):
  - `notify = ["node", "..."]`
  - `model_reasoning_effort = "high"`
  - `developer_instructions = "..."`
  - `[features] multi_agent = true, child_agents_md = true`
  - Entradas de servidores MCP (`omk_state`, `omk_memory`, `omk_code_intel`, `omk_trace`)
  - `[tui] status_line`
- `AGENTS.md` do projeto
- Diretórios `.omk/` de execução e configuração do HUD

## Agentes e skills

- Prompts: `prompts/*.md` (instalados em `~/.codex/prompts/` para `user`, `./.codex/prompts/` para `project`)
- Skills: `skills/*/SKILL.md` (instalados em `~/.agents/skills/` para `user`, `./.agents/skills/` para `project`)

Exemplos:
- Agentes: `architect`, `planner`, `executor`, `debugger`, `verifier`, `security-reviewer`
- Skills: `autopilot`, `plan`, `team`, `ralph`, `ultrawork`, `cancel`

## Estrutura do projeto

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

## Desenvolvimento

```bash
git clone https://github.com/penghuo/oh-my-kiro.git
cd oh-my-kiro
npm install
npm run build
npm test
```

## Documentação

- **[Documentação completa](https://penghuo.github.io/oh-my-kiro-website/docs.html)** — Guia completo
- **[Referência CLI](https://penghuo.github.io/oh-my-kiro-website/docs.html#cli-reference)** — Todos os comandos `omk`, flags e ferramentas
- **[Guia de notificações](https://penghuo.github.io/oh-my-kiro-website/docs.html#notifications)** — Configuração de Discord, Telegram, Slack e webhooks
- **[Fluxos de trabalho recomendados](https://penghuo.github.io/oh-my-kiro-website/docs.html#workflows)** — Cadeias de skills testadas em batalha para tarefas comuns
- **[Notas de versão](https://penghuo.github.io/oh-my-kiro-website/docs.html#release-notes)** — Novidades em cada versão

## Notas

- Log de alterações completo: `CHANGELOG.md`
- Guia de migração (pós-v0.4.4 mainline): `docs/migration-mainline-post-v0.4.4.md`
- Notas de cobertura e paridade: `COVERAGE.md`
- Fluxo de trabalho de extensão de hooks: `docs/hooks-extension.md`
- Detalhes de instalação e contribuição: `CONTRIBUTING.md`

## Agradecimentos

Inspirado em [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode), adaptado para Codex CLI.

## Licença

MIT
