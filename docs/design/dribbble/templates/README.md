# Dribbble board templates

There are two layouts because the author portrait and the literary work board have different content structures:

- `author.html` — portrait, biography, attributed quote, and three selected works.
- `work.html` — book artwork, work summary, attributed quote, and a chain of narrative voices.

The dated `.content.json` files beside each board contain the fields to change for another publication. Keep image source and credit details together when replacing artwork. Inline emphasis in text fields uses `*single asterisks*`.

Quote icons and attribution labels are selected in the content JSON, too. The author template uses `icons.quote`; the work template uses `icons.quoteSequence` and `icons.quoteGroupLabel`. The built-in icon IDs are `moon-stars`, `quill`, `flask`, and `lightning`. Add an SVG path to the `iconPaths` registry in `scripts/render-dribbble.mjs` before using another ID. Credit labels are `credits.portraitLabel` and `credits.worksLabel` on author boards, and `credits.imageLabel` on work boards. The generator emits icons as decorative and escapes all content values.

## Render a board

From the repository root, run:

```sh
node scripts/render-dribbble.mjs docs/design/dribbble/YYYY-MM-DD/name.content.json
```

The JSON selects a template and names its output files. The renderer writes the HTML and a 1600 × 1200 PNG beside that JSON file. It uses the repository's existing Puppeteer installation and waits for the fonts and images before taking the screenshot.

The Mary Shelley and Frankenstein boards in `2026-10-28/` are the reference outputs. The CSS and editorial composition live in the templates; their content lives in the matching JSON files.
