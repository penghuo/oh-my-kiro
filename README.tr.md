# oh-my-kiro (OMK)

<p align="center">
  <img src="https://penghuo.github.io/oh-my-kiro-website/omk-character-nobg.png" alt="oh-my-kiro character" width="280">
  <br>
  <em>Codex'iniz yalnız değil.</em>
</p>

[![npm version](https://img.shields.io/npm/v/oh-my-kiro)](https://www.npmjs.com/package/oh-my-kiro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

> **[Website](https://penghuo.github.io/oh-my-kiro-website/)** | **[Documentation](https://penghuo.github.io/oh-my-kiro-website/docs.html)** | **[CLI Reference](https://penghuo.github.io/oh-my-kiro-website/docs.html#cli-reference)** | **[Workflows](https://penghuo.github.io/oh-my-kiro-website/docs.html#workflows)** | **[OpenClaw Entegrasyon Kılavuzu](./docs/openclaw-integration.tr.md)** | **[GitHub](https://github.com/penghuo/oh-my-kiro)** | **[npm](https://www.npmjs.com/package/oh-my-kiro)**

[OpenAI Codex CLI](https://github.com/openai/codex) için çok ajanlı orkestrasyon katmanı.

## Öne çıkan kılavuzlar

- [OpenClaw / Genel Bildirim Geçidi Entegrasyon Kılavuzu](./docs/openclaw-integration.tr.md)

## Diller

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


OMK, Codex'i tek oturumlu bir ajandan koordineli bir sisteme dönüştürür:
- Uzmanlaşmış ajanlar için role prompts (`/prompts:name`)
- Tekrarlanabilir çalışma modları için workflow skills (`$name`)
- tmux'ta takım orkestrasyonu (`omk team`, `$team`)
- MCP sunucuları aracılığıyla kalıcı durum ve bellek

## Neden OMK

Codex CLI doğrudan görevler için güçlüdür. OMK daha büyük işler için yapı ekler:
- Ayrıştırma ve aşamalı yürütme (`team-plan -> team-prd -> team-exec -> team-verify -> team-fix`)
- Kalıcı mod yaşam döngüsü durumu (`.omk/state/`)
- Uzun süreli oturumlar için bellek ve notepad yüzeyleri
- Başlatma, doğrulama ve iptal için operasyonel kontroller

OMK bir eklentidir, fork değil. Codex'in yerel uzantı noktalarını kullanır.

## Gereksinimler

- macOS veya Linux (Windows WSL2 ile)
- Node.js >= 20
- Codex CLI kurulu (`npm install -g @openai/codex`)
- Codex kimlik doğrulaması yapılandırılmış

## Hızlı Başlangıç (3 dakika)

```bash
npm install -g oh-my-kiro
omk setup
omk doctor
```

Güvenilir ortam için önerilen başlatma profili:

```bash
omk --xhigh --madmax
```

## v0.5.0'daki Yenilikler

- `omk setup --scope user|project` ile **kapsam duyarlı kurulum** — esnek kurulum modları.
- `--spark` / `--madmax-spark` ile **Spark worker yönlendirmesi** — takım çalışanlarının lider modelini zorlamadan `gpt-5.3-codex-spark` kullanabilmesi.
- **Katalog birleştirme** — kullanımdan kaldırılmış prompt'lar (`deep-executor`, `scientist`) ve 9 kullanımdan kaldırılmış skill kaldırıldı.
- **Bildirim ayrıntı seviyeleri** — CCNotifier çıktısı için ince taneli kontrol.

## İlk Oturum

Codex içinde:

```text
/prompts:architect "analyze current auth boundaries"
/prompts:executor "implement input validation in login"
$plan "ship OAuth callback safely"
$team 3:executor "fix all TypeScript errors"
```

Terminalden:

```bash
omk team 4:executor "parallelize a multi-module refactor"
omk team status <team-name>
omk team shutdown <team-name>
```

## Temel Model

OMK şu katmanları kurar ve bağlar:

```text
User
  -> Codex CLI
    -> AGENTS.md (orkestrasyon beyni)
    -> ~/.codex/prompts/*.md (ajan prompt kataloğu)
    -> ~/.agents/skills/*/SKILL.md (skill kataloğu)
    -> ~/.codex/config.toml (özellikler, bildirimler, MCP)
    -> .omk/ (çalışma zamanı durumu, bellek, planlar, günlükler)
```

## Ana Komutlar

```bash
omk                # Codex'i başlat (tmux'ta HUD ile birlikte)
omk setup          # Prompt/skill/config'i kapsama göre kur + proje AGENTS.md/.omk
omk doctor         # Kurulum/çalışma zamanı tanılamaları
omk doctor --team  # Team/swarm tanılamaları
omk team ...       # tmux takım çalışanlarını başlat/durum/devam et/kapat
omk status         # Aktif modları göster
omk cancel         # Aktif çalışma modlarını iptal et
omk reasoning <mode> # low|medium|high|xhigh
omk tmux-hook ...  # init|status|validate|test
omk hooks ...      # init|status|validate|test (eklenti uzantı iş akışı)
omk hud ...        # --watch|--json|--preset
omk help
```

## Hooks Uzantısı (Ek Yüzey)

OMK artık eklenti iskelesi ve doğrulaması için `omk hooks` içerir.

- `omk tmux-hook` desteklenmeye devam eder ve değişmemiştir.
- `omk hooks` ek niteliktedir ve tmux-hook iş akışlarını değiştirmez.
- Eklenti dosyaları `.omk/hooks/*.mjs` konumunda bulunur.
- Eklentiler varsayılan olarak kapalıdır; `OMK_HOOK_PLUGINS=1` ile etkinleştirin.

Tam uzantı iş akışı ve olay modeli için `docs/hooks-extension.md` dosyasına bakın.

## Başlatma Bayrakları

```bash
--yolo
--high
--xhigh
--madmax
--force
--dry-run
--verbose
--scope <user|project>  # yalnızca setup
```

`--madmax`, Codex `--dangerously-bypass-approvals-and-sandbox` ile eşlenir.
Yalnızca güvenilir/harici sandbox ortamlarında kullanın.

### MCP workingDirectory politikası (isteğe bağlı sertleştirme)

Varsayılan olarak, MCP durum/bellek/trace araçları çağıranın sağladığı `workingDirectory` değerini kabul eder.
Bunu kısıtlamak için bir izin listesi belirleyin:

```bash
export OMK_MCP_WORKDIR_ROOTS="/path/to/project:/path/to/another-root"
```

Ayarlandığında, bu kökler dışındaki `workingDirectory` değerleri reddedilir.

## Codex-First Prompt Kontrolü

Varsayılan olarak, OMK şunu enjekte eder:

```text
-c model_instructions_file="<cwd>/AGENTS.md"
```

Bu, proje `AGENTS.md` yönlendirmesini Codex başlatma talimatlarına katmanlar.
Codex davranışını genişletir, ancak Codex çekirdek sistem politikalarını değiştirmez/atlamaz.

Kontroller:

```bash
OMK_BYPASS_DEFAULT_SYSTEM_PROMPT=0 omk     # AGENTS.md enjeksiyonunu devre dışı bırak
OMK_MODEL_INSTRUCTIONS_FILE=/path/to/instructions.md omk
```

## Takım Modu

Paralel çalışanlardan fayda sağlayan geniş kapsamlı işler için takım modunu kullanın.

Yaşam döngüsü:

```text
start -> assign scoped lanes -> monitor -> verify terminal tasks -> shutdown
```

Operasyonel komutlar:

```bash
omk team <args>
omk team status <team-name>
omk team resume <team-name>
omk team shutdown <team-name>
```

Önemli kural: İptal etmiyorsanız, görevler hâlâ `in_progress` durumundayken kapatmayın.

### Ralph Temizlik Politikası

Bir takım ralph modunda çalıştığında (`omk team ralph ...`), kapatma temizliği
normal yoldan farklı özel bir politika uygular:

| Davranış | Normal takım | Ralph takımı |
|---|---|---|
| Başarısızlıkta zorla kapatma | `shutdown_gate_blocked` hatası verir | Kapıyı atlar, `ralph_cleanup_policy` olayını günlükler |
| Otomatik dal silme | Geri almada worktree dallarını siler | Dalları korur (`skipBranchDeletion`) |
| Tamamlanma günlükleme | Standart `shutdown_gate` olayı | Görev dökümü ile ek `ralph_cleanup_summary` olayı |

Ralph politikası takım modu durumundan (`linked_ralph`) otomatik algılanır veya
`omk team shutdown <name> --ralph` ile açıkça belirtilebilir.

Takım çalışanları için Worker CLI seçimi:

```bash
OMK_TEAM_WORKER_CLI=auto    # varsayılan; worker --model "claude" içeriyorsa claude kullanır
OMK_TEAM_WORKER_CLI=codex   # Codex CLI çalışanlarını zorla
OMK_TEAM_WORKER_CLI=claude  # Claude CLI çalışanlarını zorla
OMK_TEAM_WORKER_CLI_MAP=codex,codex,claude,claude  # çalışan başına CLI karışımı (uzunluk=1 veya çalışan sayısı)
OMK_TEAM_AUTO_INTERRUPT_RETRY=0  # isteğe bağlı: adaptif queue->resend geri dönüşünü devre dışı bırak
```

Notlar:
- Worker başlatma argümanları hâlâ `OMK_TEAM_WORKER_LAUNCH_ARGS` aracılığıyla paylaşılır.
- `OMK_TEAM_WORKER_CLI_MAP`, çalışan başına seçim için `OMK_TEAM_WORKER_CLI`'yi geçersiz kılar.
- Tetikleyici gönderimi varsayılan olarak adaptif yeniden denemeler kullanır (queue/submit, ardından gerektiğinde güvenli clear-line+resend geri dönüşü).
- Claude worker modunda, OMK çalışanları düz `claude` olarak başlatır (ekstra başlatma argümanı yok) ve açık `--model` / `--config` / `--effort` geçersiz kılmalarını yok sayar, böylece Claude varsayılan `settings.json` kullanır.

## `omk setup` Ne Yazar

- `.omk/setup-scope.json` (kalıcı kurulum kapsamı)
- Kapsama bağlı kurulumlar:
  - `user`: `~/.codex/prompts/`, `~/.agents/skills/`, `~/.codex/config.toml`, `~/.omk/agents/`
  - `project`: `./.codex/prompts/`, `./.agents/skills/`, `./.codex/config.toml`, `./.omk/agents/`
- Başlatma davranışı: kalıcı kapsam `project` ise, `omk` başlatma otomatik olarak `CODEX_HOME=./.codex` kullanır (`CODEX_HOME` zaten ayarlanmadıysa).
- Mevcut `AGENTS.md` varsayılan olarak korunur. Etkileşimli TTY çalıştırmalarında, üzerine yazmadan önce setup sorar; `--force` sormadan üzerine yazar (aktif oturum güvenlik kontrolleri hâlâ geçerlidir).
- `config.toml` güncellemeleri (her iki kapsam için):
  - `notify = ["node", "..."]`
  - `model_reasoning_effort = "high"`
  - `developer_instructions = "..."`
  - `[features] multi_agent = true, child_agents_md = true`
  - MCP sunucu girişleri (`omk_state`, `omk_memory`, `omk_code_intel`, `omk_trace`)
  - `[tui] status_line`
- Proje `AGENTS.md`
- `.omk/` çalışma zamanı dizinleri ve HUD yapılandırması

## Ajanlar ve Skill'ler

- Prompt'lar: `prompts/*.md` (`user` için `~/.codex/prompts/`'a, `project` için `./.codex/prompts/`'a kurulur)
- Skill'ler: `skills/*/SKILL.md` (`user` için `~/.agents/skills/`'a, `project` için `./.agents/skills/`'a kurulur)

Örnekler:
- Ajanlar: `architect`, `planner`, `executor`, `debugger`, `verifier`, `security-reviewer`
- Skill'ler: `autopilot`, `plan`, `team`, `ralph`, `ultrawork`, `cancel`

## Proje Yapısı

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

## Geliştirme

```bash
git clone https://github.com/penghuo/oh-my-kiro.git
cd oh-my-kiro
npm install
npm run build
npm test
```

## Dokümantasyon

- **[Tam Dokümantasyon](https://penghuo.github.io/oh-my-kiro-website/docs.html)** — Eksiksiz kılavuz
- **[CLI Referansı](https://penghuo.github.io/oh-my-kiro-website/docs.html#cli-reference)** — Tüm `omk` komutları, bayraklar ve araçlar
- **[Bildirim Kılavuzu](https://penghuo.github.io/oh-my-kiro-website/docs.html#notifications)** — Discord, Telegram, Slack ve webhook kurulumu
- **[Önerilen İş Akışları](https://penghuo.github.io/oh-my-kiro-website/docs.html#workflows)** — Yaygın görevler için savaşta test edilmiş skill zincirleri
- **[Sürüm Notları](https://penghuo.github.io/oh-my-kiro-website/docs.html#release-notes)** — Her sürümdeki yenilikler

## Notlar

- Tam değişiklik günlüğü: `CHANGELOG.md`
- Geçiş rehberi (v0.4.4 sonrası mainline): `docs/migration-mainline-post-v0.4.4.md`
- Kapsam ve eşitlik notları: `COVERAGE.md`
- Hook uzantı iş akışı: `docs/hooks-extension.md`
- Kurulum ve katkı detayları: `CONTRIBUTING.md`

## Teşekkürler

[oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)'dan ilham alınmıştır, Codex CLI için uyarlanmıştır.

## Lisans

MIT
