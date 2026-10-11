# Looksmaxxing evidence check

A demo for looksmaxxing.guide: 12 common looksmaxxing practices, each graded separately on evidence and on risk.

Live: https://sohamumap.github.io/looksmaxxing-evidence-check/

- `build.mjs` holds the data and writes the home page plus one page per practice. Run `node build.mjs`.
- All content and structured data are in the HTML itself. The pages use no JavaScript.
- The build asks PubMed's free public API how many papers match each search. A GitHub Action re-runs it weekly.
- No dependencies, no framework.

The first version was built in a 45-minute test window on 11 October 2026. The layout was simplified later the same day; the commit history shows both.
