# Plagx Preflight

*A free academic writing tool by Plagiarism Checker X.*

Check a draft before you submit: word count and structure, in-text citations against the reference list, punctuation and basic grammar suggestions, plus readability stats. Runs offline in the container.

**[Try the live demo →](https://plagiarismcheckerx.github.io/plagx-preflight/)**

## Usage

```bash
docker run --rm -v "$PWD:/data" plagiarismcheckerx/plagx-preflight check essay.txt --min-words 1500 --style apa
docker run --rm -v "$PWD:/data" plagiarismcheckerx/plagx-preflight stats essay.md
cat essay.txt | docker run --rm -i plagiarismcheckerx/plagx-preflight check - --json
```

Exit codes: `0` no errors, `1` errors found (`--strict` counts warnings too), `2` usage or input error.

Source and full documentation: [github.com/plagiarismcheckerx/plagx-preflight](https://github.com/plagiarismcheckerx/plagx-preflight)

Plagx Preflight gives writing suggestions; it does not detect plagiarism or AI-generated text. For full document checks, explore [Plagiarism Checker X](https://plagiarismcheckerx.com/?utm_source=plagx-preflight-docker) and its [AI Content Detector](https://plagiarismcheckerx.com/ai-content-detector?utm_source=plagx-preflight-docker).

MIT © Plagiarism Checker X
