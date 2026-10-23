# Plagx Preflight command line in a container.
# A free academic writing utility by Plagiarism Checker X. https://plagiarismcheckerx.com/
#
#   docker run --rm -v "$PWD:/data" plagiarismcheckerx/plagx-preflight check essay.txt
FROM node:22-alpine

LABEL org.opencontainers.image.title="Plagx Preflight" \
      org.opencontainers.image.description="Draft checker for essays and papers: word count, citations and reference list, punctuation, basic grammar and readability. A free academic writing utility by Plagiarism Checker X." \
      org.opencontainers.image.vendor="Plagiarism Checker X" \
      org.opencontainers.image.url="https://plagiarismcheckerx.com/" \
      org.opencontainers.image.source="https://github.com/plagiarismcheckerx/plagx-preflight" \
      org.opencontainers.image.documentation="https://github.com/plagiarismcheckerx/plagx-preflight#command-line" \
      org.opencontainers.image.licenses="MIT"

WORKDIR /app
COPY package.json LICENSE README.md ./
COPY src ./src
COPY bin ./bin

USER node
WORKDIR /data
ENTRYPOINT ["node", "/app/bin/plagx-preflight.js"]
CMD ["--help"]
