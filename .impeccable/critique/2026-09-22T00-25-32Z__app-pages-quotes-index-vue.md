---
target: /quotes
total_score: 31
max_score: 40
p0_count: 0
p1_count: 0
na_heuristics:
timestamp: 2026-09-22T00-25-32Z
slug: app-pages-quotes-index-vue
---
# `/quotes` design critique — 2026-09-22

Method: dual-agent (A: 01a0c67b-ecba-7222-a2d6-5b809fe37286 · B: 01a0c67c-2b8d-7510-a2e5-cc66fc39645a). Assessment A performed a manual editorial/usability review; Assessment B ran the detector once and independently inspected the rendered page. The detector returned no findings (`[]`). The diagnostic overlay could not be started, so the live browser screenshots and DOM measurements were used as visual evidence.

## Overall impression

The page is now coherent with Verbatims’ editorial direction: typography carries the hierarchy, quotes remain the focal content, and the filters do not turn the experience into a dashboard. This is a strong, usable page rather than one that needs another redesign. The remaining opportunities are narrow mobile clarity/discoverability refinements. Nielsen heuristic score: **31/40** (previous stored score: 23/40, an increase of 8 points; prior snapshots reported one P1, this review found none).

Design specificity: **medium–high**. The typography and reading rhythm feel distinctive; the discovery controls and feed pattern remain conventional, but appropriately restrained.

## Nielsen heuristic scores

Scale: 0 = serious breakdown; 4 = strong in the observed state.

| Heuristic | Score | Evidence |
|---|---:|---|
| Visibility of system status | 3/4 | Result count is visible; mobile filter details are hidden until the sheet is opened. |
| Match with the real world | 4/4 | Familiar labels such as “Most Recent” and clear author/work attribution. |
| User control and freedom | 3/4 | Search clear, sort direction toggle, and dismissible mobile filter sheet; populated feed has no persistent reset action. |
| Consistency and standards | 3/4 | Controls use familiar patterns; mobile moves language and sort into a sheet. |
| Error prevention | 3/4 | Low-risk, reversible filters with understandable choices. |
| Recognition rather than recall | 3/4 | Named controls on desktop; mobile filter icon and bottom navigation depend more on icon recognition. |
| Flexibility and efficiency of use | 3/4 | Search, topic links, five sort modes, and language filtering; mobile changes require opening the filter sheet. |
| Aesthetic and minimalist design | 4/4 | Restrained palette, confident type hierarchy, and spacious reading rhythm. |
| Error recognition and recovery | 3/4 | Retry and clear-filters paths exist in source; error/empty states were not exercised in the live inspection. |
| Help and documentation | 2/4 | Search does not explain which fields it covers; no guidance explains whether the feed is chronological or curated. |

## Strengths

- Quotes feel like the primary content, not rows in a generic results dashboard.
- Author and reference links provide context directly in the browsing feed.
- Mobile retains the typography-led experience while moving secondary controls into a compact sheet.

## Prioritized observations

1. **Observed · P2 — Active filters are not apparent on mobile while the sheet is closed.** The language can be set to English while the collapsed control remains a generic filter icon. Consider a restrained active indicator or short selected-language label so the visible result count has context.
2. **Observed · P2, product trade-off — The persistent bottom navigation overlays a quote in the initial mobile viewport.** At 390×844 it covers part of the third visible quote. The nav hides while scrolling down, which helps. Given the product decision that it is persistent and may overlay content, I would not change it by default; verify that the current hide-on-scroll behavior feels sufficient during real reading.
3. **Observed state · P2, data-dependent — The opening feed is source-clustered.** Three of the first four visible entries were Chess-related. This may simply reflect the current recent dataset, not a rendering rule; sample other languages and sort modes before considering any diversity mechanism.
4. **Suggestion · P3 — Per-quote sharing is less discoverable on mobile.** The mobile list exposes attribution and quote navigation, but no visible share/copy action. If one-tap sharing is a primary mobile task, consider a subtle action affordance; otherwise leaving it on the detail page preserves the calm list.
5. **Suggestion · P3 — Clarify the horizontal topic row’s purpose.** A small “Popular topics” cue may help, particularly on mobile where the row is clipped horizontally; the right-arrow affordance already hints that more topics are available.

## Persona red flags

- **Serendipity seeker:** a source-clustered opening viewport can feel repetitive.
- **Mobile quote sharer:** needs an extra navigation step before finding share/copy actions.
- **Reader using a language filter:** may not realize a language is active while the filter sheet is closed.

## Minor observations

- The mobile filter sheet is clearly grouped and labeled once opened, with a prominent Done action.
- The result count and selected sort help orient readers.
- The bottom navigation overlap is acknowledged as an intentional trade-off, not treated as an automatic defect.

## Questions to consider

- Is `/quotes` primarily a chronological archive, or should it optimize for varied discovery?
- Should a language filter remain visible in the collapsed mobile controls?
- Is sharing intentionally detail-first on mobile, or should it be one tap away from the feed?

## Run notes

- Route: `http://localhost:3002/quotes?lang=en`; fresh Ego Browser pages, no existing tab reused.
- Desktop inspection: 1440×960 (A) and 1440×1000 (B); mobile inspection: 390×844 (both). Mobile filter sheet also inspected.
- Detector: ran once on the quote page plus directly rendered quote-list components; successful, no findings.
- Overlay: diagnostic live-server timed out before becoming available. No overlay is claimed; screenshot/DOM inspection served as fallback.
- No project files changed. This is a design critique only.
