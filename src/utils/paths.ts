/**
 * Path utilities for oh-my-kiro
 * Resolves Codex CLI config, skills, prompts, and state directories
 */

import { dirname, join } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

/** Codex CLI home directory (~/.codex/) */
export function codexHome(): string {
  return process.env.CODEX_HOME || join(homedir(), '.codex');
}

/** Codex config file path (~/.codex/config.toml) */
export function codexConfigPath(): string {
  return join(codexHome(), 'config.toml');
}

/** Codex prompts directory (~/.codex/prompts/) */
export function codexPromptsDir(): string {
  return join(codexHome(), 'prompts');
}

/** User-level skills directory (~/.agents/skills/) */
export function userSkillsDir(): string {
  return join(homedir(), '.agents', 'skills');
}

/** Project-level skills directory (.agents/skills/) */
export function projectSkillsDir(projectRoot?: string): string {
  return join(projectRoot || process.cwd(), '.agents', 'skills');
}

/** oh-my-kiro state directory (.omk/state/) */
export function omkStateDir(projectRoot?: string): string {
  return join(projectRoot || process.cwd(), '.omk', 'state');
}

/** oh-my-kiro project memory file (.omk/project-memory.json) */
export function omkProjectMemoryPath(projectRoot?: string): string {
  return join(projectRoot || process.cwd(), '.omk', 'project-memory.json');
}

/** oh-my-kiro notepad file (.omk/notepad.md) */
export function omkNotepadPath(projectRoot?: string): string {
  return join(projectRoot || process.cwd(), '.omk', 'notepad.md');
}

/** oh-my-kiro plans directory (.omk/plans/) */
export function omkPlansDir(projectRoot?: string): string {
  return join(projectRoot || process.cwd(), '.omk', 'plans');
}

/** oh-my-kiro logs directory (.omk/logs/) */
export function omkLogsDir(projectRoot?: string): string {
  return join(projectRoot || process.cwd(), '.omk', 'logs');
}

/** oh-my-kiro native agent config directory (~/.omk/agents/) */
export function omkAgentsConfigDir(): string {
  return join(homedir(), '.omk', 'agents');
}

/** Get the package root directory (where agents/, skills/, prompts/ live) */
export function packageRoot(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const candidate = join(__dirname, '..', '..');
    if (existsSync(join(candidate, 'package.json'))) {
      return candidate;
    }
    const candidate2 = join(__dirname, '..');
    if (existsSync(join(candidate2, 'package.json'))) {
      return candidate2;
    }
  } catch {
    // fall through to cwd fallback
  }
  return process.cwd();
}
