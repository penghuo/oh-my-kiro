# oh-my-kiro (OMK)

<p align="center">
  <img src="https://penghuo.github.io/oh-my-kiro-website/omk-character-nobg.png" alt="oh-my-kiro character" width="280">
  <br>
  <em>あなたのcodexは一人じゃない。</em>
</p>

[![npm version](https://img.shields.io/npm/v/oh-my-kiro)](https://www.npmjs.com/package/oh-my-kiro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

> **[Website](https://penghuo.github.io/oh-my-kiro-website/)** | **[Documentation](https://penghuo.github.io/oh-my-kiro-website/docs.html)** | **[CLI Reference](https://penghuo.github.io/oh-my-kiro-website/docs.html#cli-reference)** | **[Workflows](https://penghuo.github.io/oh-my-kiro-website/docs.html#workflows)** | **[OpenClaw 統合ガイド](./docs/openclaw-integration.ja.md)** | **[GitHub](https://github.com/penghuo/oh-my-kiro)** | **[npm](https://www.npmjs.com/package/oh-my-kiro)**

[OpenAI Codex CLI](https://github.com/openai/codex)のためのマルチエージェントオーケストレーションレイヤー。

## 注目ガイド

- [OpenClaw / 汎用通知ゲートウェイ統合ガイド](./docs/openclaw-integration.ja.md)

## 言語

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


OMKはCodexをシングルセッションエージェントから協調システムに変換します：
- 専門エージェント用の role prompts (`/prompts:name`)
- 再現可能な実行モード用の workflow skills (`$name`)
- tmuxでのチームオーケストレーション (`omk team`, `$team`)
- MCPサーバーによる永続的な状態とメモリ

## なぜOMKか

Codex CLIは直接的なタスクに強力です。OMKはより大規模な作業のための構造を追加します：
- 分解と段階的実行 (`team-plan -> team-prd -> team-exec -> team-verify -> team-fix`)
- 永続的なモードライフサイクル状態 (`.omk/state/`)
- 長期セッション用のメモリとメモ帳サーフェス
- 起動、検証、キャンセルのための運用制御

OMKはアドオンであり、フォークではありません。Codexのネイティブ拡張ポイントを使用します。

## 要件

- macOSまたはLinux（WindowsはWSL2経由）
- Node.js >= 20
- Codex CLIがインストール済み (`npm install -g @openai/codex`)
- Codex認証が設定済み

## クイックスタート（3分）

```bash
npm install -g oh-my-kiro
omk setup
omk doctor
```

信頼された環境向けの推奨起動プロファイル：

```bash
omk --xhigh --madmax
```

## v0.5.0の新機能

- `omk setup --scope user|project`による**スコープ対応セットアップ** — 柔軟なインストールモード。
- `--spark` / `--madmax-spark`による**Sparkワーカールーティング** — チームワーカーがリーダーモデルを強制せずに`gpt-5.3-codex-spark`を使用可能。
- **カタログ統合** — 非推奨プロンプト（`deep-executor`、`scientist`）と9つの非推奨スキルを削除し、よりスリムなサーフェスに。
- **通知の詳細レベル** — CCNotifier出力のきめ細かい制御。

## 最初のセッション

Codex内部で：

```text
/prompts:architect "analyze current auth boundaries"
/prompts:executor "implement input validation in login"
$plan "ship OAuth callback safely"
$team 3:executor "fix all TypeScript errors"
```

ターミナルから：

```bash
omk team 4:executor "parallelize a multi-module refactor"
omk team status <team-name>
omk team shutdown <team-name>
```

## コアモデル

OMKは以下のレイヤーをインストールして接続します：

```text
User
  -> Codex CLI
    -> AGENTS.md (オーケストレーションブレイン)
    -> ~/.codex/prompts/*.md (エージェントプロンプトカタログ)
    -> ~/.agents/skills/*/SKILL.md (スキルカタログ)
    -> ~/.codex/config.toml (機能、通知、MCP)
    -> .omk/ (ランタイム状態、メモリ、計画、ログ)
```

## 主要コマンド

```bash
omk                # Codexを起動（tmuxでHUD付き）
omk setup          # スコープ別にプロンプト/スキル/設定をインストール + プロジェクトAGENTS.md/.omk
omk doctor         # インストール/ランタイム診断
omk doctor --team  # Team/swarm診断
omk team ...       # tmuxチームワーカーの開始/ステータス/再開/シャットダウン
omk status         # アクティブなモードを表示
omk cancel         # アクティブな実行モードをキャンセル
omk reasoning <mode> # low|medium|high|xhigh
omk tmux-hook ...  # init|status|validate|test
omk hooks ...      # init|status|validate|test（プラグイン拡張ワークフロー）
omk hud ...        # --watch|--json|--preset
omk help
```

## Hooks拡張（追加サーフェス）

OMKにはプラグインのスキャフォールディングとバリデーション用の`omk hooks`が含まれるようになりました。

- `omk tmux-hook`は引き続きサポートされ、変更されていません。
- `omk hooks`は追加的であり、tmux-hookワークフローを置き換えません。
- プラグインファイルは`.omk/hooks/*.mjs`に配置されます。
- プラグインはデフォルトで無効です；`OMK_HOOK_PLUGINS=1`で有効にします。

完全な拡張ワークフローとイベントモデルについては`docs/hooks-extension.md`を参照してください。

## 起動フラグ

```bash
--yolo
--high
--xhigh
--madmax
--force
--dry-run
--verbose
--scope <user|project>  # setupのみ
```

`--madmax`はCodexの`--dangerously-bypass-approvals-and-sandbox`にマッピングされます。
信頼された/外部のサンドボックス環境でのみ使用してください。

### MCP workingDirectoryポリシー（オプションの強化）

デフォルトでは、MCP state/memory/traceツールは呼び出し元が提供する`workingDirectory`を受け入れます。
これを制限するには、許可されたルートのリストを設定します：

```bash
export OMK_MCP_WORKDIR_ROOTS="/path/to/project:/path/to/another-root"
```

設定すると、これらのルート外の`workingDirectory`値は拒否されます。

## Codex-Firstプロンプト制御

デフォルトでは、OMKは以下を注入します：

```text
-c model_instructions_file="<cwd>/AGENTS.md"
```

これはプロジェクトの`AGENTS.md`ガイダンスをCodex起動命令にレイヤーします。
Codexの動作を拡張しますが、Codexのコアシステムポリシーを置き換えたりバイパスしたりしません。

制御：

```bash
OMK_BYPASS_DEFAULT_SYSTEM_PROMPT=0 omk     # AGENTS.md注入を無効化
OMK_MODEL_INSTRUCTIONS_FILE=/path/to/instructions.md omk
```

## チームモード

並列ワーカーが有利な大規模作業にはチームモードを使用します。

ライフサイクル：

```text
start -> assign scoped lanes -> monitor -> verify terminal tasks -> shutdown
```

運用コマンド：

```bash
omk team <args>
omk team status <team-name>
omk team resume <team-name>
omk team shutdown <team-name>
```

重要なルール：中断する場合を除き、タスクが`in_progress`状態の間はシャットダウンしないでください。

### Ralphクリーンアップポリシー

チームがralphモード（`omk team ralph ...`）で実行される場合、シャットダウンのクリーンアップは
通常のパスとは異なる専用ポリシーを適用します：

| 動作 | 通常チーム | Ralphチーム |
|---|---|---|
| 失敗時の強制シャットダウン | `shutdown_gate_blocked`をスロー | ゲートをバイパスし、`ralph_cleanup_policy`イベントをログ |
| 自動ブランチ削除 | ロールバック時にworktreeブランチを削除 | ブランチを保持（`skipBranchDeletion`） |
| 完了ログ | 標準`shutdown_gate`イベント | タスク内訳付きの追加`ralph_cleanup_summary`イベント |

Ralphポリシーはチームモード状態（`linked_ralph`）から自動検出されるか、
`omk team shutdown <name> --ralph`で明示的に渡すことができます。

チームワーカー用のWorker CLI選択：

```bash
OMK_TEAM_WORKER_CLI=auto    # デフォルト；worker --modelに"claude"が含まれる場合claudeを使用
OMK_TEAM_WORKER_CLI=codex   # Codex CLIワーカーを強制
OMK_TEAM_WORKER_CLI=claude  # Claude CLIワーカーを強制
OMK_TEAM_WORKER_CLI_MAP=codex,codex,claude,claude  # ワーカーごとのCLIミックス（長さ=1またはワーカー数）
OMK_TEAM_AUTO_INTERRUPT_RETRY=0  # オプション：適応型queue->resendフォールバックを無効化
```

注意：
- ワーカー起動引数は引き続き`OMK_TEAM_WORKER_LAUNCH_ARGS`を通じて共有されます。
- `OMK_TEAM_WORKER_CLI_MAP`はワーカーごとの選択で`OMK_TEAM_WORKER_CLI`をオーバーライドします。
- トリガー送信はデフォルトで適応型リトライを使用します（queue/submit、必要に応じて安全なclear-line+resendフォールバック）。
- Claude workerモードでは、OMKはワーカーをプレーンな`claude`として起動し（追加の起動引数なし）、明示的な`--model` / `--config` / `--effort`オーバーライドを無視して、Claudeがデフォルトの`settings.json`を使用します。

## `omk setup`が書き込む内容

- `.omk/setup-scope.json`（永続化されたセットアップスコープ）
- スコープ依存のインストール：
  - `user`：`~/.codex/prompts/`、`~/.agents/skills/`、`~/.codex/config.toml`、`~/.omk/agents/`
  - `project`：`./.codex/prompts/`、`./.agents/skills/`、`./.codex/config.toml`、`./.omk/agents/`
- 起動動作：永続化されたスコープが`project`の場合、`omk`起動時に自動的に`CODEX_HOME=./.codex`を使用（`CODEX_HOME`が既に設定されている場合を除く）。
- 既存の`AGENTS.md`はデフォルトで保持されます。インタラクティブTTY実行では、上書き前にsetupが確認します；`--force`は確認なしで上書きします（アクティブセッションの安全チェックは引き続き適用されます）。
- `config.toml`の更新（両スコープ共通）：
  - `notify = ["node", "..."]`
  - `model_reasoning_effort = "high"`
  - `developer_instructions = "..."`
  - `[features] multi_agent = true, child_agents_md = true`
  - MCPサーバーエントリ（`omk_state`、`omk_memory`、`omk_code_intel`、`omk_trace`）
  - `[tui] status_line`
- プロジェクト`AGENTS.md`
- `.omk/`ランタイムディレクトリとHUD設定

## エージェントとスキル

- プロンプト：`prompts/*.md`（`user`は`~/.codex/prompts/`に、`project`は`./.codex/prompts/`にインストール）
- スキル：`skills/*/SKILL.md`（`user`は`~/.agents/skills/`に、`project`は`./.agents/skills/`にインストール）

例：
- エージェント：`architect`、`planner`、`executor`、`debugger`、`verifier`、`security-reviewer`
- スキル：`autopilot`、`plan`、`team`、`ralph`、`ultrawork`、`cancel`

## プロジェクト構成

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

## 開発

```bash
git clone https://github.com/penghuo/oh-my-kiro.git
cd oh-my-kiro
npm install
npm run build
npm test
```

## ドキュメント

- **[完全なドキュメント](https://penghuo.github.io/oh-my-kiro-website/docs.html)** — 完全ガイド
- **[CLIリファレンス](https://penghuo.github.io/oh-my-kiro-website/docs.html#cli-reference)** — すべての`omk`コマンド、フラグ、ツール
- **[通知ガイド](https://penghuo.github.io/oh-my-kiro-website/docs.html#notifications)** — Discord、Telegram、Slack、webhookの設定
- **[推奨ワークフロー](https://penghuo.github.io/oh-my-kiro-website/docs.html#workflows)** — 一般的なタスクのための実戦で検証されたスキルチェーン
- **[リリースノート](https://penghuo.github.io/oh-my-kiro-website/docs.html#release-notes)** — 各バージョンの新機能

## 備考

- 完全な変更ログ：`CHANGELOG.md`
- 移行ガイド（v0.4.4以降のmainline）：`docs/migration-mainline-post-v0.4.4.md`
- カバレッジとパリティノート：`COVERAGE.md`
- Hook拡張ワークフロー：`docs/hooks-extension.md`
- セットアップと貢献の詳細：`CONTRIBUTING.md`

## 謝辞

[oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)にインスパイアされ、Codex CLI向けに適応されました。

## ライセンス

MIT
