#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

async function read(path) { return await readFile(path, 'utf-8'); }

function replaceBetween(text, startMarker, endMarker, replacement) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  if (start === -1 || end === -1) throw new Error(`Markers not found: ${startMarker} .. ${endMarker}`);
  return text.slice(0, start + startMarker.length) + '\n' + replacement.trimEnd() + '\n' + text.slice(end);
}

async function main() {
  const op = (await read('docs/prompt-guidance-fragments/core-operating-principles.md')).trim();
  const vs = (await read('docs/prompt-guidance-fragments/core-verification-and-sequencing.md')).trim();
  const exC = (await read('docs/prompt-guidance-fragments/executor-constraints.md')).trim();
  const exO = (await read('docs/prompt-guidance-fragments/executor-output.md')).trim();
  const plC = (await read('docs/prompt-guidance-fragments/planner-constraints.md')).trim();
  const plI = (await read('docs/prompt-guidance-fragments/planner-investigation.md')).trim();
  const plO = (await read('docs/prompt-guidance-fragments/planner-output.md')).trim();
  const vfC = (await read('docs/prompt-guidance-fragments/verifier-constraints.md')).trim();
  const vfI = (await read('docs/prompt-guidance-fragments/verifier-investigation.md')).trim();

  for (const file of ['AGENTS.md', 'templates/AGENTS.md']) {
    let text = await read(file);
    text = replaceBetween(text, '<!-- OMK:GUIDANCE:OPERATING:START -->', '<!-- OMK:GUIDANCE:OPERATING:END -->', op);
    text = replaceBetween(text, '<!-- OMK:GUIDANCE:VERIFYSEQ:START -->', '<!-- OMK:GUIDANCE:VERIFYSEQ:END -->', vs);
    await writeFile(file, text);
  }

  let text = await read('prompts/executor.md');
  text = replaceBetween(text, '<!-- OMK:GUIDANCE:EXECUTOR:CONSTRAINTS:START -->', '<!-- OMK:GUIDANCE:EXECUTOR:CONSTRAINTS:END -->', exC);
  text = replaceBetween(text, '<!-- OMK:GUIDANCE:EXECUTOR:OUTPUT:START -->', '<!-- OMK:GUIDANCE:EXECUTOR:OUTPUT:END -->', exO);
  await writeFile('prompts/executor.md', text);

  text = await read('prompts/planner.md');
  text = replaceBetween(text, '<!-- OMK:GUIDANCE:PLANNER:CONSTRAINTS:START -->', '<!-- OMK:GUIDANCE:PLANNER:CONSTRAINTS:END -->', plC);
  text = replaceBetween(text, '<!-- OMK:GUIDANCE:PLANNER:INVESTIGATION:START -->', '<!-- OMK:GUIDANCE:PLANNER:INVESTIGATION:END -->', plI);
  text = replaceBetween(text, '<!-- OMK:GUIDANCE:PLANNER:OUTPUT:START -->', '<!-- OMK:GUIDANCE:PLANNER:OUTPUT:END -->', plO);
  await writeFile('prompts/planner.md', text);

  text = await read('prompts/verifier.md');
  text = replaceBetween(text, '<!-- OMK:GUIDANCE:VERIFIER:CONSTRAINTS:START -->', '<!-- OMK:GUIDANCE:VERIFIER:CONSTRAINTS:END -->', vfC);
  text = replaceBetween(text, '<!-- OMK:GUIDANCE:VERIFIER:INVESTIGATION:START -->', '<!-- OMK:GUIDANCE:VERIFIER:INVESTIGATION:END -->', vfI);
  await writeFile('prompts/verifier.md', text);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
