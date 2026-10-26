# Plagx Preflight for JavaScript

*A free academic writing tool by Plagiarism Checker X.*

**Plagx Preflight for JavaScript is a free, open-source draft checker for Node.js and the browser.** Use it as an essay checker before you submit: it checks the word count and structure, matches in-text citations against the reference list, and gives punctuation and basic grammar suggestions plus readability stats.

- No dependencies, works offline: your text never leaves the machine
- Node.js 18+, modern browsers, Deno and Bun
- APA and MLA citation checks
- Command line with JSON output and CI-friendly exit codes
- TypeScript types included

**[Try the live demo →](https://plagiarismcheckerx.github.io/plagx-preflight/)** · [Open in Observable](https://observablehq.com/@plagiarismcheckerx/plagx-preflight)

Developer downloads: [npm](https://www.npmjs.com/package/plagx-preflight) · [jsDelivr](https://www.jsdelivr.com/package/npm/plagx-preflight)

> Plagx Preflight is a free academic writing utility by Plagiarism Checker X. It checks length, structure, references, punctuation and basic grammar, and every result is a suggestion. Plagiarism checking and AI-generated text detection are available in Plagiarism Checker X, linked at the end of this page.

## Install

```bash
npm install plagx-preflight
```

## Quick start

```js
import { checkDraft } from 'plagx-preflight';

const result = checkDraft(text, { minWords: 1500, maxWords: 2000, style: 'apa' });

result.stats;
// { words: 1620, sentences: 84, paragraphs: 12, characters: 9811, readingTimeMinutes: 9, fleschReadingEase: 48.2 }

result.issues[0];
// { level: 'warning', code: 'repeated-word', message: 'Suggestion: "the the" looks like a repeated word.',
//   start: 312, end: 319, line: 5, column: 14, text: 'the the', suggestion: 'the' }
```

## Command line

```bash
npx plagx-preflight check essay.txt --min-words 1500 --max-words 2000 --style apa
npx plagx-preflight check essay.md --json
npx plagx-preflight stats essay.txt
cat essay.txt | npx plagx-preflight check -
```

| Option | Meaning |
|---|---|
| `--min-words <n>`, `--max-words <n>` | Word limits (reference list excluded) |
| `--style apa\|mla` | Citation style (default `apa`) |
| `--checks <list>` | Comma-separated check groups |
| `--require-heading <name>` | Required heading, repeatable |
| `--strict` | Count warnings as failures |
| `--json` | JSON output |

Exit codes: `0` no errors, `1` errors found (with `--strict`, warnings too), `2` usage or input error. Accepts `.txt` and `.md`.

## API

`checkDraft(text, options)` returns `{ stats, errors, warnings, infos, issues }`. Issues are sorted by position. `start` and `end` are UTF-16 offsets into `text`.

| Option | Default | |
|---|---|---|
| `minWords`, `maxWords` | none | Word limits |
| `style` | `'apa'` | `'apa'` or `'mla'` |
| `checks` | all except `'passive-voice'` | `length`, `references`, `punctuation`, `grammar`, `passive-voice` |
| `requiredHeadings` | `[]` | e.g. `['Introduction', 'Conclusion']` |

Helpers: `countWords(text)`, `splitSentences(text)`, `findCitations(text, style)`, `VERSION`, `CHECKS`.

## Checks

| Group | Codes | Level |
|---|---|---|
| Length & structure | `word-count-low`, `word-count-high`, `long-sentence` (over 40 words), `long-paragraph` (over 250 words), `single-sentence-paragraph`, `missing-heading` | warning / info |
| References | `citation-no-reference`, `missing-reference-section`, `reference-not-cited`, `et-al-format` | error / warning |
| Punctuation | `unmatched-quote`, `unmatched-bracket`, `double-space`, `space-before-punctuation`, `missing-space-after-punctuation`, `repeated-punctuation`, `mixed-quote-styles` | warning / info |
| Grammar | `repeated-word`, `a-an`, `sentence-capital`, `lowercase-i`, `common-confusion`, `passive-voice` (off by default) | warning / info |

## Good to know

- Every result is a suggestion. The grammar rules are deliberately conservative, so they miss some mistakes rather than flag correct text.
- The reference list starts at a heading such as References, Bibliography or Works Cited. It is excluded from the word count and from the punctuation and grammar checks.

## Development

```bash
npm test          # unit, CLI and parity tests
npm run parity    # regenerate parity/expected.json, the contract for other language ports
npm run docs      # copy src/ into docs/lib for the demo
```

## Plagx Preflight - Free Draft & Grammar Checker

An open-source writing utility for students, researchers and developers. Check length, structure, citations, punctuation and basic grammar before you submit.

Developed by Plagiarism Checker X.

Plagx Preflight gives writing suggestions; it does not detect plagiarism or AI-generated text. For full document checks, explore [Plagiarism Checker X](https://plagiarismcheckerx.com/?utm_source=plagx-preflight&utm_medium=readme&utm_campaign=plagx&utm_content=about-cta) and its [AI Content Detector](https://plagiarismcheckerx.com/ai-content-detector?utm_source=plagx-preflight&utm_medium=readme&utm_campaign=plagx&utm_content=about-ai-detector).

## License

MIT © Plagiarism Checker X.
