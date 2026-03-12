import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import {
  codexHome,
  codexConfigPath,
  codexPromptsDir,
  userSkillsDir,
  projectSkillsDir,
  omkStateDir,
  omkProjectMemoryPath,
  omkNotepadPath,
  omkPlansDir,
  omkLogsDir,
  packageRoot,
} from '../paths.js';

describe('codexHome', () => {
  let originalCodexHome: string | undefined;

  beforeEach(() => {
    originalCodexHome = process.env.CODEX_HOME;
  });

  afterEach(() => {
    if (typeof originalCodexHome === 'string') {
      process.env.CODEX_HOME = originalCodexHome;
    } else {
      delete process.env.CODEX_HOME;
    }
  });

  it('returns CODEX_HOME env var when set', () => {
    process.env.CODEX_HOME = '/tmp/custom-codex';
    assert.equal(codexHome(), '/tmp/custom-codex');
  });

  it('defaults to ~/.codex when CODEX_HOME is not set', () => {
    delete process.env.CODEX_HOME;
    assert.equal(codexHome(), join(homedir(), '.codex'));
  });
});

describe('codexConfigPath', () => {
  let originalCodexHome: string | undefined;

  beforeEach(() => {
    originalCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = '/tmp/test-codex';
  });

  afterEach(() => {
    if (typeof originalCodexHome === 'string') {
      process.env.CODEX_HOME = originalCodexHome;
    } else {
      delete process.env.CODEX_HOME;
    }
  });

  it('returns config.toml under codex home', () => {
    assert.equal(codexConfigPath(), '/tmp/test-codex/config.toml');
  });
});

describe('codexPromptsDir', () => {
  let originalCodexHome: string | undefined;

  beforeEach(() => {
    originalCodexHome = process.env.CODEX_HOME;
    process.env.CODEX_HOME = '/tmp/test-codex';
  });

  afterEach(() => {
    if (typeof originalCodexHome === 'string') {
      process.env.CODEX_HOME = originalCodexHome;
    } else {
      delete process.env.CODEX_HOME;
    }
  });

  it('returns prompts/ under codex home', () => {
    assert.equal(codexPromptsDir(), '/tmp/test-codex/prompts');
  });
});

describe('userSkillsDir', () => {
  it('returns ~/.agents/skills', () => {
    assert.equal(userSkillsDir(), join(homedir(), '.agents', 'skills'));
  });
});

describe('projectSkillsDir', () => {
  it('uses provided projectRoot', () => {
    assert.equal(projectSkillsDir('/my/project'), '/my/project/.agents/skills');
  });

  it('defaults to cwd when no projectRoot given', () => {
    assert.equal(projectSkillsDir(), join(process.cwd(), '.agents', 'skills'));
  });
});

describe('omkStateDir', () => {
  it('uses provided projectRoot', () => {
    assert.equal(omkStateDir('/my/project'), '/my/project/.omk/state');
  });

  it('defaults to cwd when no projectRoot given', () => {
    assert.equal(omkStateDir(), join(process.cwd(), '.omk', 'state'));
  });
});

describe('omkProjectMemoryPath', () => {
  it('uses provided projectRoot', () => {
    assert.equal(
      omkProjectMemoryPath('/my/project'),
      '/my/project/.omk/project-memory.json',
    );
  });

  it('defaults to cwd when no projectRoot given', () => {
    assert.equal(
      omkProjectMemoryPath(),
      join(process.cwd(), '.omk', 'project-memory.json'),
    );
  });
});

describe('omkNotepadPath', () => {
  it('uses provided projectRoot', () => {
    assert.equal(omkNotepadPath('/my/project'), '/my/project/.omk/notepad.md');
  });

  it('defaults to cwd when no projectRoot given', () => {
    assert.equal(omkNotepadPath(), join(process.cwd(), '.omk', 'notepad.md'));
  });
});

describe('omkPlansDir', () => {
  it('uses provided projectRoot', () => {
    assert.equal(omkPlansDir('/my/project'), '/my/project/.omk/plans');
  });

  it('defaults to cwd when no projectRoot given', () => {
    assert.equal(omkPlansDir(), join(process.cwd(), '.omk', 'plans'));
  });
});

describe('omkLogsDir', () => {
  it('uses provided projectRoot', () => {
    assert.equal(omkLogsDir('/my/project'), '/my/project/.omk/logs');
  });

  it('defaults to cwd when no projectRoot given', () => {
    assert.equal(omkLogsDir(), join(process.cwd(), '.omk', 'logs'));
  });
});

describe('packageRoot', () => {
  it('resolves to a directory containing package.json', () => {
    const root = packageRoot();
    assert.equal(existsSync(join(root, 'package.json')), true);
  });
});
