# Dribbble board templates

There are three layouts for author portraits, literary works, and homepage presentations:

- `author.html` — portrait, biography, attributed quote, and three selected works.
- `reference.html` — reference artwork, summary, attributed quote, and a chain of narrative voices.
- `homepage.html` — an editorial cover built around a full homepage capture, with a title, short dek, image, and configurable credit line.

The dated `.content.json` files beside each board contain the fields to change for another publication. Keep image source and credit details together when replacing artwork. Inline emphasis in text fields uses `*single asterisks*`.

Quote icons and attribution labels are selected in the content JSON, too. The author template uses `icons.quote`; the reference template uses `icons.quoteSequence` and `icons.quoteGroupLabel`. The built-in icon IDs are `moon-stars`, `quill`, `flask`, and `lightning`. Add an SVG path to the `iconPaths` registry in `scripts/render-dribbble.mjs` before using another ID. Credit labels are `credits.portraitLabel` and `credits.worksLabel` on author boards, and `credits.imageLabel` on reference boards. The generator emits icons as decorative and escapes all content values.

## Render a board

The package command supports the `author`, `reference`, and `homepage` templates. The content JSON declares its template; pass `--template` to select it explicitly and have the renderer check that both agree.

```sh
bun run dribbble:render -- --template author docs/design/dribbble/YYYY-MM-DD/name.content.json
bun run dribbble:render -- --template reference docs/design/dribbble/YYYY-MM-DD/name.content.json
bun run dribbble:render -- --template homepage docs/design/dribbble/YYYY-MM-DD/name.content.json
```

The template can also be inferred from the JSON, so this shorter form remains available:

```sh
bun run dribbble:render -- docs/design/dribbble/YYYY-MM-DD/name.content.json
```

The JSON names the HTML and PNG outputs. The renderer writes both beside the JSON file at 1600 × 1200. Relative image paths resolve from that JSON file's directory. It uses the repository's existing Puppeteer installation and waits for the fonts and images before taking the screenshot. Run `bun run dribbble:render -- --help` for usage.

The Mary Shelley and Frankenstein boards in `2026-10-28/` are the reference author/reference outputs. The Halloween homepage board in `2026-10-25/` is the homepage example. The CSS and composition live in the templates; publication-specific content lives in the matching JSON files.
