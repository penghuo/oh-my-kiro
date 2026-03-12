import { safeString } from './utils.js';
import { runProcess } from './process-runner.js';
import {
  buildCapturePaneArgv,
  buildPaneCurrentCommandArgv,
  isPaneRunningShell,
  paneHasActiveTask,
  paneLooksReady,
} from '../tmux-hook-engine.js';

export async function checkPaneReadyForTeamSendKeys(paneTarget) {
  const target = safeString(paneTarget).trim();
  if (!target) {
    return { ok: false, reason: 'missing_pane_target', paneCurrentCommand: '', paneCapture: '' };
  }

  let paneCurrentCommand = '';
  try {
    const result = await runProcess('tmux', buildPaneCurrentCommandArgv(target), 1000);
    paneCurrentCommand = safeString(result.stdout).trim();
    if (isPaneRunningShell(paneCurrentCommand)) {
      return {
        ok: false,
        reason: 'pane_running_shell',
        paneCurrentCommand,
        paneCapture: '',
      };
    }
  } catch {
    paneCurrentCommand = '';
  }

  try {
    const capture = await runProcess('tmux', buildCapturePaneArgv(target), 1000);
    const paneCapture = safeString(capture.stdout);
    if (paneCapture.trim() !== '') {
      if (paneHasActiveTask(paneCapture)) {
        return { ok: false, reason: 'pane_has_active_task', paneCurrentCommand, paneCapture };
      }
      if (!paneLooksReady(paneCapture)) {
        return { ok: false, reason: 'pane_not_ready', paneCurrentCommand, paneCapture };
      }
    }
    return { ok: true, paneCurrentCommand, paneCapture };
  } catch {
    return { ok: true, paneCurrentCommand, paneCapture: '' };
  }
}
