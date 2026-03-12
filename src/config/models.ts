/**
 * Model Configuration
 *
 * Reads per-mode model overrides from .omk-config.json under the "models" key.
 *
 * Config format:
 * {
 *   "models": {
 *     "default": "o4-mini",
 *     "team": "gpt-4.1"
 *   }
 * }
 *
 * Resolution: mode-specific > "default" key > OMK_MAIN_MODEL > DEFAULT_FRONTIER_MODEL (hardcoded fallback)
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { codexHome } from '../utils/paths.js';

export interface ModelsConfig {
  [mode: string]: string | undefined;
}

export const OMK_MAIN_MODEL_ENV = 'OMK_MAIN_MODEL';
export const OMK_SPARK_MODEL_ENV = 'OMK_SPARK_MODEL';

function readModelsBlock(codexHomeOverride?: string): ModelsConfig | null {
  const configPath = join(codexHomeOverride || codexHome(), '.omk-config.json');
  if (!existsSync(configPath)) return null;
  try {
    const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
    if (raw && typeof raw.models === 'object' && raw.models !== null && !Array.isArray(raw.models)) {
      return raw.models as ModelsConfig;
    }
    return null;
  } catch {
    return null;
  }
}

export const DEFAULT_FRONTIER_MODEL = 'gpt-5.4';
export const HARDCODED_DEFAULT_MODEL = DEFAULT_FRONTIER_MODEL;
export const HARDCODED_TEAM_LOW_COMPLEXITY_MODEL = 'gpt-5.3-codex-spark';

function normalizeConfiguredModel(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readTeamLowComplexityOverride(codexHomeOverride?: string): string | undefined {
  const models = readModelsBlock(codexHomeOverride);
  if (!models) return undefined;
  for (const key of TEAM_LOW_COMPLEXITY_MODEL_KEYS) {
    const value = normalizeConfiguredModel(models[key]);
    if (value) return value;
  }
  return undefined;
}

export function getEnvConfiguredMainDefaultModel(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return normalizeConfiguredModel(env[OMK_MAIN_MODEL_ENV]);
}

export function getEnvConfiguredSparkDefaultModel(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return normalizeConfiguredModel(env[OMK_SPARK_MODEL_ENV]);
}

/**
 * Get the envvar-backed main/default model.
 * Resolution: OMK_MAIN_MODEL > DEFAULT_FRONTIER_MODEL
 */
export function getMainDefaultModel(): string {
  return getEnvConfiguredMainDefaultModel()
    ?? DEFAULT_FRONTIER_MODEL;
}

/**
 * Get the configured model for a specific mode.
 * Resolution: mode-specific override > "default" key > OMK_MAIN_MODEL > DEFAULT_FRONTIER_MODEL
 */
export function getModelForMode(mode: string, codexHomeOverride?: string): string {
  const models = readModelsBlock(codexHomeOverride);
  const modeValue = normalizeConfiguredModel(models?.[mode]);
  if (modeValue) return modeValue;

  const defaultValue = normalizeConfiguredModel(models?.default);
  if (defaultValue) return defaultValue;

  return getMainDefaultModel();
}

const TEAM_LOW_COMPLEXITY_MODEL_KEYS = [
  'team_low_complexity',
  'team-low-complexity',
  'teamLowComplexity',
];

/**
 * Get the envvar-backed spark/low-complexity default model.
 * Resolution: OMK_SPARK_MODEL > explicit low-complexity key(s) > hardcoded spark fallback.
 */
export function getSparkDefaultModel(codexHomeOverride?: string): string {
  return getEnvConfiguredSparkDefaultModel()
    ?? readTeamLowComplexityOverride(codexHomeOverride)
    ?? HARDCODED_TEAM_LOW_COMPLEXITY_MODEL;
}

/**
 * Get the low-complexity team worker model.
 * Resolution: explicit low-complexity key(s) > OMK_SPARK_MODEL > hardcoded spark fallback.
 */
export function getTeamLowComplexityModel(codexHomeOverride?: string): string {
  return readTeamLowComplexityOverride(codexHomeOverride) ?? getSparkDefaultModel(codexHomeOverride);
}
