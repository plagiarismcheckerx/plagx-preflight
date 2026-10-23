// Plagx Preflight command line. A free academic writing utility by Plagiarism Checker X.
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { checkDraft, CHECKS, DEFAULT_CHECKS, STYLES } from '../src/index.js';

const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

const HELP = `Plagx Preflight ${VERSION}: check a draft before you submit

Usage:
  plagx-preflight check <file> [...]   List suggestions for length, references,
                                       punctuation and basic grammar
  plagx-preflight stats <file> [...]   Print word count, sentences and readability

<file> is a .txt or .md file. Use - to read from stdin.

Options:
  --min-words <n>               Minimum word count
  --max-words <n>               Maximum word count
  --style apa|mla               Citation style (default: apa)
  --checks <list>               Comma-separated: ${CHECKS.join(',')}
                                (default: all except passive-voice)
  --require-heading <name>      Required heading (repeatable)
  --strict                      check: treat warnings as errors
  --json                        Print the result as JSON
  -v, --version                 Show version
  -h, --help                    Show this help

Exit codes: 0 = no errors, 1 = errors found, 2 = usage or input error.

Automated suggestions only. A free academic writing utility by Plagiarism
Checker X, which checks originality and AI-generated text: https://plagiarismcheckerx.com/`;

class UsageError extends Error {}

const csv = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

function parseArgs(argv) {
  const opts = { style: 'apa', checks: DEFAULT_CHECKS, requiredHeadings: [], strict: false, json: false };
  const args = [];
  for (let i = 0; i < argv.length; i += 1) {
    let a = argv[i];
    let inline;
    if (a.startsWith('--') && a.includes('=')) [a, inline] = [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)];
    const value = () => {
      if (inline !== undefined) return inline;
      if (i + 1 >= argv.length) throw new UsageError(`${a} needs a value`);
      return argv[++i];
    };
    const number = () => {
      const v = value();
      if (!/^\d+$/.test(v)) throw new UsageError(`${a} needs a whole number`);
      return Number(v);
    };
    if (a === '--min-words') opts.minWords = number();
    else if (a === '--max-words') opts.maxWords = number();
    else if (a === '--style') opts.style = value();
    else if (a === '--checks') opts.checks = csv(value());
    else if (a === '--require-heading') opts.requiredHeadings.push(value());
    else if (a === '--strict') opts.strict = true;
    else if (a === '--json') opts.json = true;
    else if (a === '-h' || a === '--help') opts.help = true;
    else if (a === '-v' || a === '--version') opts.version = true;
    else if (a.startsWith('-') && a !== '-') throw new UsageError(`Unknown option ${a}`);
    else args.push(a);
  }
  if (!STYLES.includes(opts.style)) throw new UsageError(`Unknown style "${opts.style}". Use: ${STYLES.join(', ')}`);
  for (const c of opts.checks) if (!CHECKS.includes(c)) throw new UsageError(`Unknown check "${c}". Use: ${CHECKS.join(', ')}`);
  return { opts, args };
}

export function loadText(path) {
  const ext = extname(path).toLowerCase();
  if (path !== '-' && ext !== '.txt' && ext !== '.md') throw new UsageError(`${path}: only .txt and .md files are supported`);
  try {
    return readFileSync(path === '-' ? 0 : path, 'utf8').replace(/^﻿/, '');
  } catch (err) {
    throw new UsageError(`Cannot read ${path}: ${err.code === 'ENOENT' ? 'file not found' : err.message}`);
  }
}

function printStats(file, s) {
  return [
    `${file}`,
    `  Words:               ${s.words}`,
    `  Sentences:           ${s.sentences}`,
    `  Paragraphs:          ${s.paragraphs}`,
    `  Characters:          ${s.characters}`,
    `  Reading time:        ${s.readingTimeMinutes} min`,
    `  Flesch reading ease: ${s.fleschReadingEase}`,
  ].join('\n');
}

function printCheck(file, r) {
  const lines = [];
  for (const x of r.issues) lines.push(`${file}:${x.line}:${x.column}  ${x.level.padEnd(7)} ${x.code.padEnd(32)} ${x.message}`);
  lines.push(`${file}: ${r.stats.words} words, ${r.errors} error(s), ${r.warnings} warning(s), ${r.infos} info`);
  return lines.join('\n');
}

export async function main(argv, out = process.stdout, err = process.stderr) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (e) {
    err.write(`${e.message}\n\nRun plagx-preflight --help for usage.\n`);
    return 2;
  }
  const { opts, args } = parsed;
  if (opts.version) { out.write(`${VERSION}\n`); return 0; }
  const [command, ...files] = args;
  if (opts.help || !command) { out.write(`${HELP}\n`); return command || opts.help ? 0 : 2; }

  try {
    if (command !== 'check' && command !== 'stats') throw new UsageError(`Unknown command "${command}"`);
    if (!files.length) throw new UsageError(`${command} needs a file (.txt or .md, or - for stdin)`);
    const texts = files.map((f) => [f, loadText(f)]);
    let failed = false;
    const reports = [];
    for (const [file, text] of texts) {
      const result = checkDraft(text, command === 'stats' ? { checks: [] } : opts);
      if (result.errors || (opts.strict && result.warnings)) failed = true;
      reports.push({ file, ...result });
    }
    if (command === 'stats') {
      const data = reports.map((r) => ({ file: r.file, stats: r.stats }));
      out.write(opts.json ? `${JSON.stringify(data, null, 2)}\n` : `${reports.map((r) => printStats(r.file, r.stats)).join('\n\n')}\n`);
      return 0;
    }
    out.write(opts.json ? `${JSON.stringify(reports, null, 2)}\n` : `${reports.map((r) => printCheck(r.file, r)).join('\n\n')}\n`);
    return failed ? 1 : 0;
  } catch (e) {
    if (!(e instanceof UsageError)) throw e;
    err.write(`${e.message}\n\nRun plagx-preflight --help for usage.\n`);
    return 2;
  }
}
