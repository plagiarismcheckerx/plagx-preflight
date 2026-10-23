import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main } from '../bin/cli.js';

const dir = mkdtempSync(join(tmpdir(), 'plagx-preflight-'));
const bad = join(dir, 'bad.txt');
writeFileSync(bad, 'Shown (Smith, 2020). the the end.\n');
const warn = join(dir, 'warn.md');
writeFileSync(warn, 'Fine text here. the end is near.\n');
const clean = join(dir, 'clean.txt');
writeFileSync(clean, 'A clean draft. It has two sentences.\n');
const doc = join(dir, 'paper.docx');
writeFileSync(doc, 'x');

async function run(...args) {
  let stdout = '';
  let stderr = '';
  const code = await main(args, { write: (s) => { stdout += s; } }, { write: (s) => { stderr += s; } });
  return { code, stdout, stderr };
}

test('check exits 1 when errors are found', async () => {
  const { code, stdout } = await run('check', bad);
  assert.equal(code, 1);
  assert.match(stdout, /missing-reference-section/);
  assert.match(stdout, /bad\.txt:1:22 +warning repeated-word/);
});

test('check exits 0 with warnings only, 1 with --strict', async () => {
  assert.equal((await run('check', warn)).code, 0);
  assert.equal((await run('check', warn, '--strict')).code, 1);
});

test('check --json prints the full result', async () => {
  const { code, stdout } = await run('check', clean, '--json', '--min-words', '3', '--max-words=100');
  assert.equal(code, 0);
  const data = JSON.parse(stdout);
  assert.equal(data[0].file, clean);
  assert.equal(data[0].stats.words, 7);
  assert.deepEqual(data[0].issues, []);
});

test('check passes options through', async () => {
  const { stdout } = await run('check', clean, '--require-heading', 'Conclusion', '--min-words', '50', '--json');
  const codes = JSON.parse(stdout)[0].issues.map((i) => i.code);
  assert.deepEqual(codes, ['missing-heading', 'word-count-low']);
});

test('--checks limits the groups', async () => {
  const { stdout } = await run('check', bad, '--checks', 'grammar', '--json');
  assert.deepEqual(JSON.parse(stdout)[0].issues.map((i) => i.code), ['repeated-word', 'sentence-capital']);
});

test('stats prints readability numbers', async () => {
  const { code, stdout } = await run('stats', clean);
  assert.equal(code, 0);
  assert.match(stdout, /Words: +7/);
  assert.match(stdout, /Flesch reading ease: /);
});

test('stats --json', async () => {
  const { stdout } = await run('stats', clean, '--json');
  assert.equal(JSON.parse(stdout)[0].stats.sentences, 2);
});

test('usage errors exit 2', async () => {
  assert.equal((await run('check')).code, 2);
  assert.equal((await run('check', doc)).code, 2);
  assert.equal((await run('check', join(dir, 'missing.txt'))).code, 2);
  assert.equal((await run('check', clean, '--style', 'chicago')).code, 2);
  assert.equal((await run('check', clean, '--min-words', 'ten')).code, 2);
  assert.equal((await run('check', clean, '--checks', 'magic')).code, 2);
  assert.equal((await run('check', clean, '--nope')).code, 2);
  assert.equal((await run('lint', clean)).code, 2);
  assert.equal((await run()).code, 2);
});

test('--help and --version', async () => {
  assert.match((await run('--help')).stdout, /plagx-preflight check <file>/);
  assert.match((await run('--version')).stdout, /^\d+\.\d+\.\d+\n$/);
});
