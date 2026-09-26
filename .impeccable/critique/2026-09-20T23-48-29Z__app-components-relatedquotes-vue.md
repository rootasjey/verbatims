---
target: Related Quotes on quote detail
total_score: 28
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 0
timestamp: 2026-09-20T23-48-29Z
slug: app-components-relatedquotes-vue
---
⚠️ DEGRADED: single-context (both assessment agents stalled; parent completed Assessment A before Assessment B)

## Design Health Score — 28/40 (Good)

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3/4 | Heading and links are clear; relation basis is not shown. |
| 2 | Match System / Real World | 2/4 | “Related” is vague when suggestions can relate by author, reference, or tags. |
| 3 | User Control and Freedom | 3/4 | Standard navigation and browser back are available. |
| 4 | Consistency and Standards | 4/4 | Editorial type and layout fit the rest of Verbatims. |
| 5 | Error Prevention | 3/4 | Whole rows are links and there are no risky actions. |
| 6 | Recognition Rather Than Recall | 2/4 | Users must infer why a suggestion appears. |
| 7 | Flexibility and Efficiency | 2/4 | A fixed short list, with no obvious route to more similar results. |
| 8 | Aesthetic and Minimalist Design | 4/4 | Restrained type-led list; no unnecessary card chrome. |
| 9 | Error Recovery | 3/4 | Simple page navigation, with browser back as a recovery path. |
| 10 | Help and Documentation | 2/4 | No contextual explanation of relevance. |
| **Total** | | **28/40** | **Good** |

## Design Specificity Verdict

Visually, the section feels authored for Verbatims: editorial typography, a short reading list, and no generic card grid. Semantically, it feels generic because the “related” relationship is opaque. The observed example has four suggestions across two languages and different authors, including one unattributed quote, while the primary quote is by George R. R. Martin from *A Game of Thrones*. The API selects by author, reference, and then shared tags, but does not expose the reason to the component.

The static detector returned `[]`. The browser overlay reported three “line length too long” findings on related quote rows and one “tight line height” elsewhere on the page; the latter is not confidently attributable to this component. The font/animation banner diagnostics are page-level and not directly actionable for Related Quotes.

## Overall Impression

The current visual treatment is good and does not need a wholesale redesign. The primary opportunity is explaining the semantic connection, followed by tightening desktop reading measure. The editorial list should remain the base.

## What’s Working

- Serif quote previews keep reading content primary and fit the publication-like identity.
- Four results are easy to scan on desktop and mobile.
- Known authors are shown, while missing attribution is not replaced by a misleading “Other” label.

## Priority Issues

- **[P2] Relationship provenance is hidden.** Users cannot tell whether an item shares an author, reference, or tag; cross-language/different-author suggestions can feel arbitrary. Return a relation reason from the API and show it as a muted inline label or group heading.
- **[P2] Desktop reading measure is too wide.** The list can reach about 48rem and the overlay flagged three rows. Keep the heading width but constrain quote text to roughly 60–65 characters per line.
- **[P3] Link affordance is subtle on touch devices.** Rows look like static editorial text until hover. Keep the unboxed style, but give hover and keyboard focus a restrained underline or equivalent visible cue.

## Persona Red Flags

- **Jordan, first-timer:** “Related Quotes” does not explain the relation, so the mix of authors/languages may look random.
- **Casey, mobile reader:** long previews occupy several lines, increasing scroll; the four-item list remains simple and readable.
- **Project-specific curious quote reader:** credibility depends on understanding why suggestions belong together; a tiny provenance label would help without adding visual noise.

## Minor Observations

- The 200-character truncation is useful for previewing, and the whole row already links to the full quote.
- The absence of an author line when attribution is missing is clearer than a fabricated category label.
- No other urgent design issue surfaced in this focused review; this is not a whole-app audit.

## Questions to Consider

- Should the next pass prioritize semantic clarity (show why each quote is related) or reading comfort (narrower measure and a slightly clearer link cue)?
- Can we keep this quiet editorial list rather than adding cards, while exposing just enough relation context?
