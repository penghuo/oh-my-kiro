# oh-my-kiro (OMK)

<p align="center">
  <img src="https://penghuo.github.io/oh-my-kiro-website/omk-character-nobg.png" alt="oh-my-kiro character" width="280">
  <br>
  <em>Votre codex n'est pas seul.</em>
</p>

[![npm version](https://img.shields.io/npm/v/oh-my-kiro)](https://www.npmjs.com/package/oh-my-kiro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

> **[Website](https://penghuo.github.io/oh-my-kiro-website/)** | **[Documentation](https://penghuo.github.io/oh-my-kiro-website/docs.html)** | **[CLI Reference](https://penghuo.github.io/oh-my-kiro-website/docs.html#cli-reference)** | **[Workflows](https://penghuo.github.io/oh-my-kiro-website/docs.html#workflows)** | **[Guide d’intégration OpenClaw](./docs/openclaw-integration.fr.md)** | **[GitHub](https://github.com/penghuo/oh-my-kiro)** | **[npm](https://www.npmjs.com/package/oh-my-kiro)**

Couche d'orchestration multi-agents pour [OpenAI Codex CLI](https://github.com/openai/codex).

## Guides à la une

- [Guide d’intégration OpenClaw / passerelle de notifications générique](./docs/openclaw-integration.fr.md)

## Langues

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


OMK transforme Codex d'un agent mono-session en un système coordonné avec :
- Des role prompts (`/prompts:name`) pour les agents spécialisés
- Des workflow skills (`$name`) pour les modes d'exécution reproductibles
- L'orchestration d'équipe dans tmux (`omk team`, `$team`)
- Un état et une mémoire persistants via les serveurs MCP

## Pourquoi OMK

Codex CLI est performant pour les tâches directes. OMK ajoute de la structure pour les travaux plus importants :
- Décomposition et exécution par étapes (`team-plan -> team-prd -> team-exec -> team-verify -> team-fix`)
- État persistant du cycle de vie des modes (`.omk/state/`)
- Surfaces de mémoire et notepad pour les sessions longue durée
- Contrôles opérationnels pour le lancement, la vérification et l'annulation

OMK est un add-on, pas un fork. Il utilise les points d'extension natifs de Codex.

## Prérequis

- macOS ou Linux (Windows via WSL2)
- Node.js >= 20
- Codex CLI installé (`npm install -g @openai/codex`)
- Authentification Codex configurée

## Démarrage rapide (3 minutes)

```bash
npm install -g oh-my-kiro
omk setup
omk doctor
```

Profil de lancement recommandé pour les environnements de confiance :

```bash
omk --xhigh --madmax
```

## Nouveautés de la v0.5.0

- **Configuration sensible au scope** avec `omk setup --scope user|project` pour des modes d'installation flexibles.
- **Routage Spark worker** via `--spark` / `--madmax-spark` pour que les workers d'équipe puissent utiliser `gpt-5.3-codex-spark` sans forcer le modèle leader.
- **Consolidation du catalogue** — suppression des prompts obsolètes (`deep-executor`, `scientist`) et de 9 skills obsolètes.
- **Niveaux de verbosité des notifications** pour un contrôle fin de la sortie CCNotifier.

## Première session

Dans Codex :

```text
/prompts:architect "analyze current auth boundaries"
/prompts:executor "implement input validation in login"
$plan "ship OAuth callback safely"
$team 3:executor "fix all TypeScript errors"
```

Depuis le terminal :

```bash
omk team 4:executor "parallelize a multi-module refactor"
omk team status <team-name>
omk team shutdown <team-name>
```

## Modèle de base

OMK installe et connecte ces couches :

```text
User
  -> Codex CLI
    -> AGENTS.md (cerveau d'orchestration)
    -> ~/.codex/prompts/*.md (catalogue de prompts d'agents)
    -> ~/.agents/skills/*/SKILL.md (catalogue de skills)
    -> ~/.codex/config.toml (fonctionnalités, notifications, MCP)
    -> .omk/ (état d'exécution, mémoire, plans, journaux)
```

## Commandes principales

```bash
omk                # Lancer Codex (+ HUD dans tmux si disponible)
omk setup          # Installer prompts/skills/config par scope + projet AGENTS.md/.omk
omk doctor         # Diagnostics d'installation/exécution
omk doctor --team  # Diagnostics Team/Swarm
omk team ...       # Démarrer/statut/reprendre/arrêter les workers d'équipe tmux
omk status         # Afficher les modes actifs
omk cancel         # Annuler les modes d'exécution actifs
omk reasoning <mode> # low|medium|high|xhigh
omk tmux-hook ...  # init|status|validate|test
omk hooks ...      # init|status|validate|test (workflow d'extension de plugins)
omk hud ...        # --watch|--json|--preset
omk help
```

## Extension Hooks (Surface additive)

OMK inclut désormais `omk hooks` pour l'échafaudage et la validation de plugins.

- `omk tmux-hook` reste supporté et inchangé.
- `omk hooks` est additif et ne remplace pas les workflows tmux-hook.
- Les fichiers de plugins se trouvent dans `.omk/hooks/*.mjs`.
- Les plugins sont désactivés par défaut ; activez-les avec `OMK_HOOK_PLUGINS=1`.

Consultez `docs/hooks-extension.md` pour le workflow d'extension complet et le modèle d'événements.

## Flags de lancement

```bash
--yolo
--high
--xhigh
--madmax
--force
--dry-run
--verbose
--scope <user|project>  # uniquement pour setup
```

`--madmax` correspond à Codex `--dangerously-bypass-approvals-and-sandbox`.
À utiliser uniquement dans des environnements sandbox de confiance/externes.

### Politique MCP workingDirectory (durcissement optionnel)

Par défaut, les outils MCP état/mémoire/trace acceptent le `workingDirectory` fourni par l'appelant.
Pour restreindre cela, définissez une liste d'autorisation de racines :

```bash
export OMK_MCP_WORKDIR_ROOTS="/path/to/project:/path/to/another-root"
```

Lorsque défini, les valeurs `workingDirectory` en dehors de ces racines sont rejetées.

## Contrôle Codex-First des prompts

Par défaut, OMK injecte :

```text
-c model_instructions_file="<cwd>/AGENTS.md"
```

Cela superpose les instructions `AGENTS.md` du projet dans les instructions de lancement de Codex.
Cela étend le comportement de Codex, mais ne remplace/contourne pas les politiques système de base de Codex.

Contrôles :

```bash
OMK_BYPASS_DEFAULT_SYSTEM_PROMPT=0 omk     # désactiver l'injection AGENTS.md
OMK_MODEL_INSTRUCTIONS_FILE=/path/to/instructions.md omk
```

## Mode équipe

Utilisez le mode équipe pour les travaux importants qui bénéficient de workers parallèles.

Cycle de vie :

```text
start -> assign scoped lanes -> monitor -> verify terminal tasks -> shutdown
```

Commandes opérationnelles :

```bash
omk team <args>
omk team status <team-name>
omk team resume <team-name>
omk team shutdown <team-name>
```

Règle importante : n'arrêtez pas tant que des tâches sont encore `in_progress`, sauf en cas d'abandon.

### Politique de nettoyage Ralph

Lorsqu'une équipe s'exécute en mode ralph (`omk team ralph ...`), le nettoyage à l'arrêt
applique une politique dédiée qui diffère du chemin normal :

| Comportement | Équipe normale | Équipe Ralph |
|---|---|---|
| Arrêt forcé en cas d'échec | Lance `shutdown_gate_blocked` | Contourne la porte, journalise l'événement `ralph_cleanup_policy` |
| Suppression automatique des branches | Supprime les branches worktree lors du rollback | Préserve les branches (`skipBranchDeletion`) |
| Journalisation de complétion | Événement standard `shutdown_gate` | Événement supplémentaire `ralph_cleanup_summary` avec détail des tâches |

La politique ralph est auto-détectée depuis l'état du mode équipe (`linked_ralph`) ou
peut être passée explicitement via `omk team shutdown <name> --ralph`.

Sélection du CLI worker pour les workers d'équipe :

```bash
OMK_TEAM_WORKER_CLI=auto    # par défaut ; utilise claude quand worker --model contient "claude"
OMK_TEAM_WORKER_CLI=codex   # forcer les workers Codex CLI
OMK_TEAM_WORKER_CLI=claude  # forcer les workers Claude CLI
OMK_TEAM_WORKER_CLI_MAP=codex,codex,claude,claude  # mix CLI par worker (longueur=1 ou nombre de workers)
OMK_TEAM_AUTO_INTERRUPT_RETRY=0  # optionnel : désactiver le fallback adaptatif queue->resend
```

Notes :
- Les arguments de lancement des workers sont toujours partagés via `OMK_TEAM_WORKER_LAUNCH_ARGS`.
- `OMK_TEAM_WORKER_CLI_MAP` remplace `OMK_TEAM_WORKER_CLI` pour la sélection par worker.
- La soumission de déclencheurs utilise par défaut des tentatives adaptatives (queue/submit, puis fallback sécurisé clear-line+resend si nécessaire).
- En mode worker Claude, OMK lance les workers en tant que simple `claude` (pas d'arguments de lancement supplémentaires) et ignore les surcharges explicites `--model` / `--config` / `--effort` pour que Claude utilise le `settings.json` par défaut.

## Ce que `omk setup` écrit

- `.omk/setup-scope.json` (scope de setup persisté)
- Installations dépendantes du scope :
  - `user` : `~/.codex/prompts/`, `~/.agents/skills/`, `~/.codex/config.toml`, `~/.omk/agents/`
  - `project` : `./.codex/prompts/`, `./.agents/skills/`, `./.codex/config.toml`, `./.omk/agents/`
- Comportement au lancement : si le scope persisté est `project`, le lancement `omk` utilise automatiquement `CODEX_HOME=./.codex` (sauf si `CODEX_HOME` est déjà défini).
- Le `AGENTS.md` existant est préservé par défaut. Lors des exécutions TTY interactives, setup demande confirmation avant d'écraser ; `--force` écrase sans demander (les vérifications de sécurité de session active s'appliquent toujours).
- Mises à jour de `config.toml` (pour les deux scopes) :
  - `notify = ["node", "..."]`
  - `model_reasoning_effort = "high"`
  - `developer_instructions = "..."`
  - `[features] multi_agent = true, child_agents_md = true`
  - Entrées de serveurs MCP (`omk_state`, `omk_memory`, `omk_code_intel`, `omk_trace`)
  - `[tui] status_line`
- `AGENTS.md` du projet
- Répertoires d'exécution `.omk/` et configuration HUD

## Agents et Skills

- Prompts : `prompts/*.md` (installés dans `~/.codex/prompts/` pour `user`, `./.codex/prompts/` pour `project`)
- Skills : `skills/*/SKILL.md` (installés dans `~/.agents/skills/` pour `user`, `./.agents/skills/` pour `project`)

Exemples :
- Agents : `architect`, `planner`, `executor`, `debugger`, `verifier`, `security-reviewer`
- Skills : `autopilot`, `plan`, `team`, `ralph`, `ultrawork`, `cancel`

## Structure du projet

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

## Développement

```bash
git clone https://github.com/penghuo/oh-my-kiro.git
cd oh-my-kiro
npm install
npm run build
npm test
```

## Documentation

- **[Documentation complète](https://penghuo.github.io/oh-my-kiro-website/docs.html)** — Guide complet
- **[Référence CLI](https://penghuo.github.io/oh-my-kiro-website/docs.html#cli-reference)** — Toutes les commandes `omk`, flags et outils
- **[Guide des notifications](https://penghuo.github.io/oh-my-kiro-website/docs.html#notifications)** — Configuration Discord, Telegram, Slack et webhooks
- **[Workflows recommandés](https://penghuo.github.io/oh-my-kiro-website/docs.html#workflows)** — Chaînes de skills éprouvées pour les tâches courantes
- **[Notes de version](https://penghuo.github.io/oh-my-kiro-website/docs.html#release-notes)** — Nouveautés de chaque version

## Notes

- Journal des modifications complet : `CHANGELOG.md`
- Guide de migration (post-v0.4.4 mainline) : `docs/migration-mainline-post-v0.4.4.md`
- Notes de couverture et parité : `COVERAGE.md`
- Workflow d'extension hooks : `docs/hooks-extension.md`
- Détails de configuration et contribution : `CONTRIBUTING.md`

## Remerciements

Inspiré par [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode), adapté pour Codex CLI.

## Licence

MIT
