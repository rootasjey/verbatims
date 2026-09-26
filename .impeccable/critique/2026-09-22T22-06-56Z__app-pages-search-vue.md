---
target: /search and its quick-search dialog
total_score: 25
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 2
timestamp: 2026-09-22T22-06-56Z
slug: app-pages-search-vue
---
# Design critique — Search (`app/pages/search.vue` + `app/components/SearchBox.vue`)

## Design health score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 3/4 | Both views show result counts; counts are not consistently attached to the relevant result group. |
| 2 | Match with real world | 3/4 | Quotes, authors, and references are recognizable groups, but “Filter quotes” is ambiguous on a mixed-results page. |
| 3 | User control and freedom | 3/4 | Search can be cleared, filters reset, and the dialog dismissed with Escape. |
| 4 | Consistency and standards | 2/4 | The dialog and route expose the same search in noticeably different visual and semantic patterns. |
| 5 | Error prevention | 2/4 | Filter scope is unclear when results include multiple entity types. |
| 6 | Recognition rather than recall | 3/4 | Search, filters, and keyboard hints are labeled; the global shortcut is not discoverable from the route. |
| 7 | Flexibility and efficiency | 3/4 | Cmd/Ctrl+K and arrow-key navigation reward keyboard users. |
| 8 | Aesthetic and minimalist design | 2/4 | Editorial quote typography is diluted by generic outlined cards and low-signal engagement counts. |
| 9 | Help users recover from errors | 2/4 | Empty-result messaging exists, but recovery cues are limited. |
| 10 | Help and documentation | 2/4 | The dialog explains its keyboard controls, but the global-search entry point is otherwise hidden. |
| **Total** |  | **25/40** | **Acceptable (62.5%); significant visual and semantic improvements remain.** |

## Design specificity verdict

The route is **moderately Verbatims-specific (3/5)**: Fraunces-like quote typography, restrained dark surfaces, and quote provenance are good foundations. But the desktop page’s broad controls and repeated rounded, outlined rows read as a mobile results list stretched across the viewport. The centered count floats between controls and results instead of anchoring the reading hierarchy.

The quick-search dialog is **less distinctive (2/5)**. It works as a conventional command palette, but the compact sans-serif rows, nested borders, blue focus outline, generic iconography, and like/view counters do not carry the newer editorial identity. The dialog was about 566×643 px at 1440×1000: enough for a basic palette, but cramped for seven quote results plus authors and references.

The CLI detector found **0 findings** in `SearchBox.vue` and **1 warning** in `search.vue`: `border-accent-on-rounded` at line 302. That is a false positive—the rule flags a dashed underline on a small loading spinner, not a rounded card. Browser detection reported **13 findings** in the mobile dialog state: one tight-leading instance (1.15×), one low-contrast instance (3.1:1 for black text on `#854d0e`), ten nested-card instances, and one width transition. The nested-card count is partly a pattern-level warning: the result rows are visibly boxed inside the dialog’s own surface, which contributes to the generic, layered-card appearance, though not every instance is necessarily harmful in context.

## Overall impression

The search works, but it has not yet been art-directed as part of the editorial product. The strongest opportunity is not merely to enlarge the dialog or add more cards: it is to give each surface a distinct editorial composition while letting quotes remain the primary content.

## What’s working

- Quote text already leads its metadata typographically; that is the best existing bridge to the editorial style.
- Search and filters are easy to locate, and the URL retains query and filter state.
- The dialog’s keyboard navigation and explicit arrow/Enter/Escape hints are useful and should survive the redesign.

## Priority issues

1. **[P1] Desktop `/search` lacks a desktop composition.** The same stacked controls and full-width quote cards simply expand, leaving broad rows and a detached “Found 10 results” label. This is the core reason the route feels like a mobile screen stretched wide. **Fix:** create an intentional desktop index: a compact query header; a narrow, clearly grouped filter rail; an editorial quote list with attribution and quiet separators in the main column; and separate, compact author/reference grids where imagery (portrait/poster) adds recognition. Collapse the rail and grids naturally on mobile. **Suggested command:** `$impeccable layout`.

2. **[P1] Quick-search results are not exposed as selectable items to assistive technology.** The live accessibility snapshot reports clickable result rows as generic containers, despite arrow-key selection and Enter activation. Screen-reader users may not know a row is actionable or which one is selected. **Fix:** use appropriate button/option semantics, expose the active state, and announce the result group and selection. **Suggested command:** `$impeccable audit`.

3. **[P2] The dialog is a generic, cramped palette rather than an editorial quick-search.** Nested bordered cards, small sans-serif quote rows, bright blue focus, vivid type badges, and zero-valued like/view counters compete with the quote. **Fix:** widen moderately on desktop (roughly 800–900 px, still viewport-bounded), keep quotes as an unboxed or lightly separated reading list, show author/reference hits as compact image-led tiles in a two-column grid, and remove or strongly de-emphasize likes/views. Use the app’s muted focus and category colors. **Suggested command:** `$impeccable distill`.

4. **[P2] Filter scope and result counts are hard to parse.** “FILTER QUOTES” appears above a page that returns quotes, authors, and references; “Found 10 results” is separated from the QUOTES heading even though per-type counts also appear. **Fix:** define whether filters narrow only quote results or every type, name that scope explicitly, and attach counts to their own sections rather than presenting competing totals. **Suggested command:** `$impeccable clarify`.

5. **[P2] Contrast and motion polish still feel inherited from the old UI.** The browser detector found one 3.1:1 text/background pairing and a width transition in the mobile dialog; the live screenshots also show the saturated cyan focus ring against the quiet palette. **Fix:** use a theme-aware neutral focus treatment with adequate contrast and remove width animation unless it communicates a meaningful state change. **Suggested command:** `$impeccable audit`.

## Cognitive load

**Moderate (2 checklist failures):** the detached count weakens visual hierarchy, and the “FILTER QUOTES” label makes people infer whether filters affect only quotes or the entire search. The content is otherwise chunked by type, with three filters visible at once. In the dialog, like/view zeros are extra information with little value before opening a result.

## Emotional journey

Typing a query and seeing grouped hits feels immediate and reassuring. The serif quote copy then promises a curated reading experience, but the broad desktop rows and generic nested dialog cards break that promise. The transition from “search quickly” to “browse editorially” feels like entering two different products; improving composition and selection semantics would restore confidence without losing speed.

## Persona red flags

- **Sam, screen-reader/keyboard user:** dialog rows are keyboard-selectable but exposed as generic containers, so action and selection state may be unclear.
- **Casey, mobile user:** stacked filters consume much of the first viewport before quote results; preserve them, but make the result transition and active filters more compact.
- **Jordan, first-time visitor:** Cmd/Ctrl+K works but is not discoverable on `/search`; a subtle shortcut cue could connect the route to global quick search.

## Minor observations

- The vivid “Book” label stands out more than the content and surrounding muted palette.
- Dialog totals and per-section counts duplicate information; the zero-valued engagement figures are particularly low-signal.
- The same search query appears in both dialog and page, but their visual language currently differs more than their purpose does.

## Questions to pressure-test

- Should `/search` lead with quote reading, with authors and references as supporting discovery paths?
- Does a person need to see likes and views before opening a quote, or would attribution be more useful there?
