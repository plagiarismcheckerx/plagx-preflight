# Plagx Preflight – Observable notebook cells

Written for Observable Notebooks 2.0 (observablehq.com/d/…). Create a new notebook and add each cell below in order. Set each cell's type with the label at the cell's top right: **md** for Markdown cells, **js** for JavaScript cells. Paste only the text inside each code block.

---

### Cell 1 · md

```md
# Plagx Preflight: Free Draft Checker & Grammar Suggestions

*A free academic writing tool by Plagiarism Checker X.*

Check an essay or paper before you submit: word count, structure, in-text citations against the reference list, punctuation and basic grammar. Everything runs in your browser using the open-source [plagx-preflight](https://www.npmjs.com/package/plagx-preflight) package, and your text stays on this page.

**[Try the full live demo →](https://plagiarismcheckerx.github.io/plagx-preflight/)** · [Source code on GitHub](https://github.com/plagiarismcheckerx/plagx-preflight)
```

### Cell 2 · js

```js
import * as preflight from "npm:plagx-preflight@0.1.2";
```

### Cell 3 · js

```js
const draft = view(Inputs.textarea({
  label: "Your draft",
  rows: 12,
  submit: "Check draft",
  value: `Introduction

Academic writing is is a skill that students develop over time (Smith, 2020). A good draft has a clear argument ,and each claim is supported by a source (Brown, 2018).

Many students find that a early outline helps them plan there paper.

References

Smith, J. (2020). Writing for university. Academic Press.
Lee, K. (2019). Planning essays. Study Skills Journal, 4(2), 10-18.`
}));
```

### Cell 4 · js

```js
const options = view(Inputs.form({
  minWords: Inputs.number({label: "Min words", value: 0, min: 0, step: 50}),
  maxWords: Inputs.number({label: "Max words", value: 0, min: 0, step: 50}),
  style: Inputs.radio(new Map([["APA", "apa"], ["MLA", "mla"]]), {label: "Citations", value: "apa"}),
  checks: Inputs.checkbox(preflight.CHECKS, {label: "Checks", value: preflight.DEFAULT_CHECKS})
}));
```

### Cell 5 · js

```js
const result = preflight.checkDraft(draft, {
  minWords: options.minWords || undefined,
  maxWords: options.maxWords || undefined,
  style: options.style,
  checks: options.checks
});
display(html`<p style="font-family: system-ui, sans-serif">
  <b>${result.stats.words}</b> words · <b>${result.stats.sentences}</b> sentences ·
  <b>${result.stats.paragraphs}</b> paragraphs · ${result.stats.readingTimeMinutes} min read ·
  Flesch reading ease ${result.stats.fleschReadingEase}<br>
  ${result.errors} errors · ${result.warnings} warnings · ${result.infos} suggestions
</p>`);
```

### Cell 6 · js

```js
const colors = {error: "#f6c9c9", warning: "#fbe3a6", info: "#cfe3f3"};
const parts = [];
let pos = 0;
for (const issue of result.issues.filter((i) => i.end > i.start)) {
  if (issue.start < pos) continue;
  parts.push(draft.slice(pos, issue.start));
  parts.push(html`<mark title="${issue.message}" style="background: ${colors[issue.level]}; border-radius: 3px">${draft.slice(issue.start, issue.end)}</mark>`);
  pos = issue.end;
}
parts.push(draft.slice(pos));
display(html`<div style="font-family: Georgia, serif; white-space: pre-wrap; max-width: 760px; line-height: 1.6">${parts}</div>`);
```

### Cell 7 · js

```js
display(Inputs.table(result.issues, {
  columns: ["level", "code", "line", "text", "message"],
  header: {level: "Level", code: "Check", line: "Line", text: "Text", message: "Suggestion"},
  width: {message: 360}
}));
```

### Cell 8 · md

```md
## How it works

- **Length & structure:** word limits, long sentences, long paragraphs and required headings.
- **References:** in-text citations with no reference-list entry, and references that are never cited (APA or MLA).
- **Punctuation:** unmatched quotes and brackets, double spaces and spacing around punctuation.
- **Basic grammar:** repeated words, *a* / *an*, sentence capitals and common word confusions.

All results are automated suggestions. Preflight checks structure, references, punctuation and basic grammar. Originality and AI-generated text are checked in Plagiarism Checker X.

Use it in your own code:

~~~js
import {checkDraft} from "https://cdn.jsdelivr.net/npm/plagx-preflight@0.1.2/+esm";
~~~

Developer downloads: [npm](https://www.npmjs.com/package/plagx-preflight) · [jsDelivr](https://www.jsdelivr.com/package/npm/plagx-preflight) · [GitHub](https://github.com/plagiarismcheckerx/plagx-preflight)

Need a quick citation online? Use the [free citation generator](https://plagiarismcheckerx.com/citation-generator?utm_source=plagx-preflight-observable&utm_medium=notebook&utm_campaign=plagx&utm_content=citation-generator).

## Plagx Preflight - Free Draft & Grammar Checker

Developed by Plagiarism Checker X. Plagx Preflight gives writing suggestions; it does not detect plagiarism or AI-generated text. For full document checks, explore [Plagiarism Checker X](https://plagiarismcheckerx.com/?utm_source=plagx-preflight-observable&utm_medium=notebook&utm_campaign=plagx&utm_content=about-cta) and its [AI Content Detector](https://plagiarismcheckerx.com/ai-content-detector?utm_source=plagx-preflight-observable&utm_medium=notebook&utm_campaign=plagx&utm_content=about-ai-detector).

MIT License
```
