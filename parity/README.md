# Parity contract

`expected.json` is the contract for every Plagx Preflight port (Python, PHP, .NET, Java, Dart). A port is ready to release only when it reproduces every case in it exactly.

```
{ "version": "0.1.0",
  "optionSets": { "default": {}, "limits": {...}, "mla": {...}, "gb": {...}, "all": {...} },
  "cases": [ { "fixture": "01-clean-apa.txt", "options": "default", "result": { stats, errors, warnings, infos, issues } } ] }
```

Fixtures live in `test/fixtures/`. Read them as UTF-8, byte for byte, and don't normalise line endings (`24-crlf.txt` uses CRLF).

Regenerate the file after any change to the JS core with `npm run parity`. `npm test` fails while the file is out of date.

## Rules ports must follow

- **Offsets.** `start`, `end` and `column` count **UTF-16 code units**, as JavaScript strings do. Python, Dart (runes), PHP and Java/.NET code points need converting. An emoji outside the BMP counts as 2. `characters` in stats counts **code points**.
- **Key order.** Results are `stats, errors, warnings, infos, issues`. Stats are `words, sentences, paragraphs, characters, readingTimeMinutes, fleschReadingEase`. Each issue is `level, code, message, start, end, line, column, text, suggestion`, and `suggestion` is a string or `null`.
- **Sorting.** Sort issues by `start`, then `code` (ordinal string compare), then `end`. Drop duplicates with the same `code`, `start` and `end`.
- **Numbers.** `fleschReadingEase = round1(206.835 - 1.015 * (W / S) - 84.6 * (Syl / W))`. `round1` is JavaScript `Math.round(x * 10) / 10`, which rounds halves up toward +infinity (use `floor(x * 10 + 0.5) / 10`, not banker's rounding). It is `0` when there are no sentences. A whole-number value is serialised without `.0`, so compare parsed JSON numbers.
- **Character classes.** "Letter" means Unicode `\p{L}`, "mark" means `\p{M}`, and digits are only ASCII `0-9`. Every other class in the source is ASCII-only: `[A-Za-z]`, `[a-z]`, `\s` (JS whitespace), and `\b` (ASCII word boundary, `[A-Za-z0-9_]`). In Python, use `re.ASCII` where the JS regex has no `u` flag. Sentence-case tests use `\p{Lu}` / `\p{Ll}`.
- **Messages.** Use exactly the English strings in `src/checks.js`.

## Algorithm reference

The JS source is the specification:

| File | What it defines |
|---|---|
| `src/text.js` | words, paragraphs, headings, reference section, sentence splitting, syllables |
| `src/citations.js` | APA and MLA citation patterns, entry parsing, matching |
| `src/checks.js` | every check, its level, message and suggestion |
| `src/index.js` | options, stats, masking (URLs, emails, `code`), sorting |
