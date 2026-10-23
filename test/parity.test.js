import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildParity } from '../scripts/build-parity.js';

test('parity/expected.json matches the current output (run npm run parity after changes)', () => {
  const expected = JSON.parse(readFileSync(new URL('../parity/expected.json', import.meta.url), 'utf8'));
  const actual = JSON.parse(JSON.stringify(buildParity()));
  assert.equal(actual.cases.length, expected.cases.length);
  for (let i = 0; i < expected.cases.length; i += 1) {
    const e = expected.cases[i];
    assert.deepEqual(actual.cases[i], e, `${e.fixture} / ${e.options}`);
  }
});
