# oh-my-kiro (OMK)

<p align="center">
  <img src="https://penghuo.github.io/oh-my-kiro-website/omk-character-nobg.png" alt="oh-my-kiro character" width="280">
  <br>
  <em>Dein Codex ist nicht allein.</em>
</p>

[![npm version](https://img.shields.io/npm/v/oh-my-kiro)](https://www.npmjs.com/package/oh-my-kiro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

> **[Website](https://penghuo.github.io/oh-my-kiro-website/)** | **[Documentation](https://penghuo.github.io/oh-my-kiro-website/docs.html)** | **[CLI Reference](https://penghuo.github.io/oh-my-kiro-website/docs.html#cli-reference)** | **[Workflows](https://penghuo.github.io/oh-my-kiro-website/docs.html#workflows)** | **[OpenClaw-Integrationsleitfaden](./docs/openclaw-integration.de.md)** | **[GitHub](https://github.com/penghuo/oh-my-kiro)** | **[npm](https://www.npmjs.com/package/oh-my-kiro)**

Multi-Agenten-Orchestrierungsschicht für [OpenAI Codex CLI](https://github.com/openai/codex).

## Empfohlene Leitfäden

- [OpenClaw-Integrationsleitfaden für generisches Notification-Gateway](./docs/openclaw-integration.de.md)

## Sprachen

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


OMK verwandelt Codex von einem Einzelsitzungs-Agenten in ein koordiniertes System mit:
- Role Prompts (`/prompts:name`) für spezialisierte Agenten
- Workflow Skills (`$name`) für wiederholbare Ausführungsmodi
- Team-Orchestrierung in tmux (`omk team`, `$team`)
- Persistenter Zustand und Speicher über MCP-Server

## Warum OMK

Codex CLI ist stark für direkte Aufgaben. OMK fügt Struktur für größere Arbeiten hinzu:
- Zerlegung und stufenweise Ausführung (`team-plan -> team-prd -> team-exec -> team-verify -> team-fix`)
- Persistenter Modus-Lebenszyklus-Zustand (`.omk/state/`)
- Speicher- und Notepad-Oberflächen für langfristige Sitzungen
- Operationelle Steuerung für Start, Verifizierung und Abbruch

OMK ist ein Add-on, kein Fork. Es nutzt die nativen Erweiterungspunkte von Codex.

## Voraussetzungen

- macOS oder Linux (Windows über WSL2)
- Node.js >= 20
- Codex CLI installiert (`npm install -g @openai/codex`)
- Codex-Authentifizierung konfiguriert

## Schnellstart (3 Minuten)

```bash
npm install -g oh-my-kiro
omk setup
omk doctor
```

Empfohlenes Startprofil für vertrauenswürdige Umgebungen:

```bash
omk --xhigh --madmax
```

## Neu in v0.5.0

- **Bereichsbewusstes Setup** mit `omk setup --scope user|project` für flexible Installationsmodi.
- **Spark-Worker-Routing** über `--spark` / `--madmax-spark`, damit Team-Worker `gpt-5.3-codex-spark` nutzen können, ohne das Leader-Modell zu erzwingen.
- **Katalog-Konsolidierung** — veraltete Prompts (`deep-executor`, `scientist`) und 9 veraltete Skills entfernt.
- **Benachrichtigungs-Detailstufen** für feingranulare CCNotifier-Ausgabesteuerung.

## Erste Sitzung

Innerhalb von Codex:

```text
/prompts:architect "analyze current auth boundaries"
/prompts:executor "implement input validation in login"
$plan "ship OAuth callback safely"
$team 3:executor "fix all TypeScript errors"
```

Vom Terminal:

```bash
omk team 4:executor "parallelize a multi-module refactor"
omk team status <team-name>
omk team shutdown <team-name>
```

## Kernmodell

OMK installiert und verbindet diese Schichten:

```text
User
  -> Codex CLI
    -> AGENTS.md (Orchestrierungs-Gehirn)
    -> ~/.codex/prompts/*.md (Agenten-Prompt-Katalog)
    -> ~/.agents/skills/*/SKILL.md (Skill-Katalog)
    -> ~/.codex/config.toml (Features, Benachrichtigungen, MCP)
    -> .omk/ (Laufzeitzustand, Speicher, Pläne, Protokolle)
```

## Hauptbefehle

```bash
omk                # Codex starten (+ HUD in tmux wenn verfügbar)
omk setup          # Prompts/Skills/Config nach Bereich installieren + Projekt AGENTS.md/.omk
omk doctor         # Installations-/Laufzeitdiagnose
omk doctor --team  # Team/Swarm-Diagnose
omk team ...       # tmux-Team-Worker starten/Status/fortsetzen/herunterfahren
omk status         # Aktive Modi anzeigen
omk cancel         # Aktive Ausführungsmodi abbrechen
omk reasoning <mode> # low|medium|high|xhigh
omk tmux-hook ...  # init|status|validate|test
omk hooks ...      # init|status|validate|test (Plugin-Erweiterungs-Workflow)
omk hud ...        # --watch|--json|--preset
omk help
```

## Hooks-Erweiterung (Additive Oberfläche)

OMK enthält jetzt `omk hooks` für Plugin-Gerüstbau und -Validierung.

- `omk tmux-hook` wird weiterhin unterstützt und ist unverändert.
- `omk hooks` ist additiv und ersetzt keine tmux-hook-Workflows.
- Plugin-Dateien befinden sich unter `.omk/hooks/*.mjs`.
- Plugins sind standardmäßig deaktiviert; aktivieren mit `OMK_HOOK_PLUGINS=1`.

Siehe `docs/hooks-extension.md` für den vollständigen Erweiterungs-Workflow und das Ereignismodell.

## Start-Flags

```bash
--yolo
--high
--xhigh
--madmax
--force
--dry-run
--verbose
--scope <user|project>  # nur bei setup
```

`--madmax` entspricht Codex `--dangerously-bypass-approvals-and-sandbox`.
Nur in vertrauenswürdigen/externen Sandbox-Umgebungen verwenden.

### MCP workingDirectory-Richtlinie (optionale Härtung)

Standardmäßig akzeptieren MCP-Zustand/Speicher/Trace-Tools das vom Aufrufer bereitgestellte `workingDirectory`.
Um dies einzuschränken, setzen Sie eine Erlaubnisliste von Wurzelverzeichnissen:

```bash
export OMK_MCP_WORKDIR_ROOTS="/path/to/project:/path/to/another-root"
```

Wenn gesetzt, werden `workingDirectory`-Werte außerhalb dieser Wurzeln abgelehnt.

## Codex-First Prompt-Steuerung

Standardmäßig injiziert OMK:

```text
-c model_instructions_file="<cwd>/AGENTS.md"
```

Dies schichtet die `AGENTS.md`-Anweisungen des Projekts in die Codex-Startanweisungen.
Es erweitert das Codex-Verhalten, ersetzt/umgeht aber nicht die Codex-Kernsystemrichtlinien.

Steuerung:

```bash
OMK_BYPASS_DEFAULT_SYSTEM_PROMPT=0 omk     # AGENTS.md-Injektion deaktivieren
OMK_MODEL_INSTRUCTIONS_FILE=/path/to/instructions.md omk
```

## Team-Modus

Verwenden Sie den Team-Modus für umfangreiche Arbeiten, die von parallelen Workern profitieren.

Lebenszyklus:

```text
start -> assign scoped lanes -> monitor -> verify terminal tasks -> shutdown
```

Operationelle Befehle:

```bash
omk team <args>
omk team status <team-name>
omk team resume <team-name>
omk team shutdown <team-name>
```

Wichtige Regel: Fahren Sie nicht herunter, während Aufgaben noch `in_progress` sind, es sei denn, Sie brechen ab.

### Ralph-Aufräumrichtlinie

Wenn ein Team im Ralph-Modus läuft (`omk team ralph ...`), wendet die Shutdown-Bereinigung
eine spezielle Richtlinie an, die sich vom normalen Pfad unterscheidet:

| Verhalten | Normales Team | Ralph-Team |
|---|---|---|
| Erzwungenes Herunterfahren bei Fehler | Wirft `shutdown_gate_blocked` | Umgeht Gate, protokolliert `ralph_cleanup_policy`-Ereignis |
| Automatische Branch-Löschung | Löscht Worktree-Branches bei Rollback | Bewahrt Branches (`skipBranchDeletion`) |
| Abschluss-Protokollierung | Standard-`shutdown_gate`-Ereignis | Zusätzliches `ralph_cleanup_summary`-Ereignis mit Aufgabenaufschlüsselung |

Die Ralph-Richtlinie wird automatisch aus dem Team-Modus-Zustand (`linked_ralph`) erkannt oder
kann explizit über `omk team shutdown <name> --ralph` übergeben werden.

Worker-CLI-Auswahl für Team-Worker:

```bash
OMK_TEAM_WORKER_CLI=auto    # Standard; verwendet claude wenn Worker --model "claude" enthält
OMK_TEAM_WORKER_CLI=codex   # Codex-CLI-Worker erzwingen
OMK_TEAM_WORKER_CLI=claude  # Claude-CLI-Worker erzwingen
OMK_TEAM_WORKER_CLI_MAP=codex,codex,claude,claude  # CLI-Mix pro Worker (Länge=1 oder Worker-Anzahl)
OMK_TEAM_AUTO_INTERRUPT_RETRY=0  # optional: adaptiven Queue->Resend-Fallback deaktivieren
```

Hinweise:
- Worker-Startargumente werden weiterhin über `OMK_TEAM_WORKER_LAUNCH_ARGS` geteilt.
- `OMK_TEAM_WORKER_CLI_MAP` überschreibt `OMK_TEAM_WORKER_CLI` für Worker-spezifische Auswahl.
- Trigger-Übermittlung verwendet standardmäßig adaptive Wiederholungsversuche (Queue/Submit, dann sicherer Clear-Line+Resend-Fallback bei Bedarf).
- Im Claude-Worker-Modus startet OMK Worker als einfaches `claude` (keine zusätzlichen Startargumente) und ignoriert explizite `--model` / `--config` / `--effort`-Überschreibungen, sodass Claude die Standard-`settings.json` verwendet.

## Was `omk setup` schreibt

- `.omk/setup-scope.json` (persistierter Setup-Bereich)
- Bereichsabhängige Installationen:
  - `user`: `~/.codex/prompts/`, `~/.agents/skills/`, `~/.codex/config.toml`, `~/.omk/agents/`
  - `project`: `./.codex/prompts/`, `./.agents/skills/`, `./.codex/config.toml`, `./.omk/agents/`
- Startverhalten: Wenn der persistierte Bereich `project` ist, verwendet `omk` automatisch `CODEX_HOME=./.codex` (sofern `CODEX_HOME` nicht bereits gesetzt ist).
- Vorhandene `AGENTS.md` wird standardmäßig beibehalten. Bei interaktiven TTY-Läufen fragt Setup vor dem Überschreiben; `--force` überschreibt ohne Nachfrage (aktive Sitzungs-Sicherheitsprüfungen gelten weiterhin).
- `config.toml`-Aktualisierungen (für beide Bereiche):
  - `notify = ["node", "..."]`
  - `model_reasoning_effort = "high"`
  - `developer_instructions = "..."`
  - `[features] multi_agent = true, child_agents_md = true`
  - MCP-Server-Einträge (`omk_state`, `omk_memory`, `omk_code_intel`, `omk_trace`)
  - `[tui] status_line`
- Projekt-`AGENTS.md`
- `.omk/`-Laufzeitverzeichnisse und HUD-Konfiguration

## Agenten und Skills

- Prompts: `prompts/*.md` (installiert nach `~/.codex/prompts/` für `user`, `./.codex/prompts/` für `project`)
- Skills: `skills/*/SKILL.md` (installiert nach `~/.agents/skills/` für `user`, `./.agents/skills/` für `project`)

Beispiele:
- Agenten: `architect`, `planner`, `executor`, `debugger`, `verifier`, `security-reviewer`
- Skills: `autopilot`, `plan`, `team`, `ralph`, `ultrawork`, `cancel`

## Projektstruktur

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

## Entwicklung

```bash
git clone https://github.com/penghuo/oh-my-kiro.git
cd oh-my-kiro
npm install
npm run build
npm test
```

## Dokumentation

- **[Vollständige Dokumentation](https://penghuo.github.io/oh-my-kiro-website/docs.html)** — Kompletter Leitfaden
- **[CLI-Referenz](https://penghuo.github.io/oh-my-kiro-website/docs.html#cli-reference)** — Alle `omk`-Befehle, Flags und Tools
- **[Benachrichtigungs-Leitfaden](https://penghuo.github.io/oh-my-kiro-website/docs.html#notifications)** — Discord, Telegram, Slack und Webhook-Einrichtung
- **[Empfohlene Workflows](https://penghuo.github.io/oh-my-kiro-website/docs.html#workflows)** — Praxiserprobte Skill-Ketten für häufige Aufgaben
- **[Versionshinweise](https://penghuo.github.io/oh-my-kiro-website/docs.html#release-notes)** — Neuheiten in jeder Version

## Hinweise

- Vollständiges Änderungsprotokoll: `CHANGELOG.md`
- Migrationsleitfaden (nach v0.4.4 mainline): `docs/migration-mainline-post-v0.4.4.md`
- Abdeckungs- und Paritätsnotizen: `COVERAGE.md`
- Hook-Erweiterungs-Workflow: `docs/hooks-extension.md`
- Setup- und Beitragsdetails: `CONTRIBUTING.md`

## Danksagungen

Inspiriert von [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode), angepasst für Codex CLI.

## Lizenz

MIT
