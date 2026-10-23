// Writes parity/expected.json: the checkDraft() output for every fixture and
// option set. Every port must reproduce this file's results exactly.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { checkDraft, VERSION } from '../src/index.js';
import { OPTION_SETS } from '../parity/option-sets.js';

const root = fileURLToPath(new URL('..', import.meta.url));

export function buildParity() {
  const fixtures = readdirSync(`${root}test/fixtures`).filter((f) => /\.(txt|md)$/.test(f)).sort();
  const cases = [];
  for (const fixture of fixtures) {
    const text = readFileSync(`${root}test/fixtures/${fixture}`, 'utf8');
    for (const [name, options] of Object.entries(OPTION_SETS)) {
      cases.push({ fixture, options: name, result: checkDraft(text, options) });
    }
  }
  return { version: VERSION, optionSets: OPTION_SETS, cases };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const data = buildParity();
  writeFileSync(`${root}parity/expected.json`, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Wrote ${data.cases.length} cases to parity/expected.json`);
}
