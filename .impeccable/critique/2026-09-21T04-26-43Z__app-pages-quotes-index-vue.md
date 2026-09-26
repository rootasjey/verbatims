---
target: /quotes
total_score: 23
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 1
timestamp: 2026-09-21T04-26-43Z
slug: app-pages-quotes-index-vue
---
Method: dual-agent (A: `01a0c227-215b-7ce1-90ab-6241c6d3ca11` · B: `01a0c227-21cb-7083-af0e-0f23beeb2a38`)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 2/4 | The first observed state says “No quotes yet” before 1,595 quotes appear. |
| 2 | Match with real world | 3/4 | Quote, author, and source are understandable; “reference” may be less familiar than “source.” |
| 3 | User control and freedom | 3/4 | Search, language, sort, and order are adjustable; no obvious global reset. |
| 4 | Consistency and standards | 2/4 | The `/quotes` header diverges from `/authors` and `/references`. |
| 5 | Error prevention | 3/4 | Constrained filters prevent most input errors; few risky actions. |
| 6 | Recognition rather than recall | 3/4 | Search and metadata are visible; tag-rail overflow is weakly signaled. |
| 7 | Flexibility and efficiency | 2/4 | Search, sort, and load-more exist, but few visible accelerators. |
| 8 | Aesthetic and minimalist design | 2/4 | Quote-first structure is promising, but header and tags weaken editorial coherence. |
| 9 | Error recovery | 2/4 | A failed initial load can resemble a truly empty collection; retry is not obvious. |
| 10 | Help and documentation | 1/4 | No contextual help is visible; need is limited for this task. |
| **Total** |  | **23/40** | **Acceptable (57.5%)** |

## Design Specificity Verdict

The quote content, authors, sources, and tags ground the page in Verbatims. Yet its visual language reads more like an older catalogue than the editorial direction now used by `/authors` and `/references`: a centered uppercase Khand heading and pill-shaped tag rail stand apart from their left-aligned serif headings and quieter treatment. The strongest opportunity is to align this hierarchy, then bring the tag rail into the same visual grammar.

The deterministic CLI scan returned `[]` (zero findings). The browser overlay reported two mobile anti-patterns: `tight line height` on the footer description and `skipped heading level` between `h1 “Quotes”` and `h3 “Explore”`. The footer finding appears global rather than specific to the quote list; the heading sequence merits a semantic check in navigation.

## Overall Impression

The page has useful quote-discovery controls and a strong quote-first content structure, but its header and tags make it feel like a different product from the redesigned directory pages. The first observed false-empty state is more urgent than the visual inconsistency because it can mislead a new visitor.

## What’s Working

- Quote text remains primary, with author and source context nearby.
- Search, language, and sort serve the browse task without adding marketing elements.
- Mobile filters are grouped in a drawer, and the page had no document-level horizontal overflow at 390px.

## Priority Issues

1. **[P1] False empty state on initial load.** The first live snapshot showed “0 quotes shown” and “No quotes yet”; a later hydrated snapshot showed 1,595 quotes. The template renders the empty state when `quotesLoading` is false without also gating it on `initialLoading`. Reserve the empty state for a completed first request; show a delayed skeleton for slow requests, and distinguish a real empty collection from no matches and network failure.

2. **[P2] Header breaks editorial continuity.** `/quotes` uses a centered uppercase Khand heading and small italic subtitle, unlike the left-aligned serif headers on `/authors` and `/references`. Align width, alignment, typography, and spacing with those directory pages, using sentence case and keeping browse controls functionally distinct.

3. **[P2] Tag rail feels generic and its overflow is hard to discover.** `ScrollableTags.vue` fetches up to 30 tags and styles them as bordered `#` pills; quote detail uses smaller uppercase tracked labels with a color dot. Reuse that quieter grammar, reduce the number of initially visible choices, and make horizontal scrolling controls visible, focusable, and explicitly named. Keep the removed self-link “See All” removed; an all-tags destination, if wanted, should point to the tags directory.

## Cognitive Load

One checklist failure: **Minimal choices**. About ten tag links appeared in the desktop snapshot (five in mobile); the sort selector has five modes. The remaining checklist items—single focus, chunking, grouping, hierarchy, one decision at a time, working memory, and progressive disclosure—passed, with visual hierarchy qualified because screenshots were unavailable.

## Emotional Journey

The first observed state risks a trust dip: “No quotes yet” suggests a barren collection even though the later hydrated feed contains 1,595 quotes. After loading, the count and familiar quote/author/source pairings make discovery feel substantial. The tag rail offers serendipitous browsing, but its continuation is not obvious on touch devices.

## Persona Red Flags

- **Jordan, first-timer:** May read the initial “No quotes yet” literally and assume the collection is empty.
- **Casey, mobile browser:** Sees only a subset of the horizontally scrolling tags, with little touch-oriented indication that more are available.
- **Sam, accessibility-dependent:** The tag-rail arrow buttons have no explicit accessible names or focus-visible treatment.

## Minor Observations

- The desktop toolbar groups language, search, sort, and sort direction; mobile condenses secondary controls into a filter drawer.
- Mobile quote rows truncate quote text at 120 characters.
- Overlay also reported the footer description’s tight line height and a heading-level skip. The former looks like a global footer issue, outside this page’s core redesign.
- Screenshot capture timed out with `CdpRequestTimeoutError: CDP request timed out: Page.captureScreenshot`; contrast and pixel-level balance could not be verified.

## Questions to Consider

- Which priority should the next lot address first: the editorial header, the tag rail, or the initial loading/empty state?
- Should the next implementation cover all three, or start with the header and tags and treat the false-empty state separately?
