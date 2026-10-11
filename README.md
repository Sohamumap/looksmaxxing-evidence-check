# Looksmaxxing evidence check

A one-page demo for looksmaxxing.guide: 12 common looksmaxxing practices, each graded separately on evidence and on risk.

- `build.mjs` holds the data and writes `index.html`. Run `node build.mjs`.
- All cards and the FAQ structured data are in the HTML itself, so crawlers that don't run JavaScript can read them. JavaScript only powers the filter buttons.
- No dependencies, no framework.
