---
target: admin filter placement proposal
total_score: 31
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 1
target_identity: "file:/Users/rootasjey/GitHub/verbatims/app/pages/admin/quotes/published.vue"
target_fingerprint: "sha256:fea75976ba2e8f82a65c00c6f105dbc95b30e569fedc79fa1f817f530f4265ef"
target_path: /Users/rootasjey/GitHub/verbatims/app/pages/admin/quotes/published.vue
timestamp: 2026-10-15T12-06-02Z
slug: app-pages-admin-quotes-published-vue
---
Method: dual-agent (A: Avicenna · B: Harvey)

Scope: assess moving the existing “All Types” and “All Languages” filters into their corresponding table headers, without code changes.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 3/4 | Current value is visible in the menu; preserve a clear active state in the header. |
| 2 | Match system / real world | 3/4 | Column association is natural; distinguish filtering from sorting. |
| 3 | User control and freedom | 4/4 | Filters remain reversible and non-destructive. |
| 4 | Consistency and standards | 3/4 | Existing comboboxes are reused, but filter and sort controls look similar. |
| 5 | Error prevention | 4/4 | No significant risk; all values remains an easy reset. |
| 6 | Recognition rather than recall | 3/4 | Column labels provide context if the control keeps an accessible name. |
| 7 | Flexibility and efficiency | 3/4 | Better desktop proximity, but mobile access must remain. |
| 8 | Aesthetic and minimalist design | 3/4 | A compact control could lighten the toolbar without cluttering the header. |
| 9 | Error recovery | 3/4 | A mistaken filter is easy to clear if selected state remains apparent. |
| 10 | Help and documentation | 2/4 | Triggers are announced as “Show popup”; action-specific names are needed. |
| **Total** | | **31/40** | Good proposal with mobile and accessibility conditions. |

## Design Specificity Verdict

The proposed placement fits the editorial table: each filter sits next to the data it narrows, while the toolbar remains for search and sorting. Keep “Name A-Z” and “Most Recent” in the toolbar; move only the type and language filters. A restrained 24px funnel control with a visible active state is preferable to a chevron that might imply column sorting. Add UnaUI tooltips and explicit accessible names such as “Filter by language.”

Assessment A found the column labels make filter placement intuitive, while the existing menus already expose their selected values. It also found that current filter and sort triggers look similar and are generically named “Show popup.” The proposed appearance has not been prototyped, so its resulting visual fit remains unverified.

Assessment B ran the Impeccable detector against both `app/pages/admin/authors.vue` and `app/pages/admin/quotes/published.vue`: 0 findings in each (`[]`, exit code 0), with no false positives. Ego loaded both routes with populated data. One broken author thumbnail (ALT 236) appeared, unrelated to this proposal.

## Overall Impression

This is a good desktop refinement: it moves each filter to its semantic home and can reduce toolbar clutter. The main risk is losing mobile reachability when the relevant table column is outside the horizontal viewport.

## What's Working

- `TYPE` and `LANGUAGE` make their corresponding filter context clear.
- The existing combobox options and selected values can be reused.
- The pages already leave the data as the visual focus.

## Priority Issues

- **[P1] Preserve mobile access:** The authors type filter currently remains in mobile controls and should stay there. The Published language filter is hidden on mobile; provide a mobile toolbar control or filter drawer rather than relying on a horizontally scrolled header.
- **[P2] Distinguish filter from sort:** Use a funnel icon and a specific action name; do not use an ambiguous sort chevron.
- **[P2] Keep the header compact:** The columns are currently 96px wide and the header about 41px high. A 24px control should preserve the row height; `LANGUAGE` may need about 104–112px, preferably reclaimed from the flexible quote column.
- **[P2] Improve accessibility:** Replace generic “Show popup” names and announce when a filter is active.

## Persona Red Flags

- **Alex, frequent moderator:** The filter is quicker to locate under its column, but “Show popup” does not explain its purpose to a screen reader.
- **Morgan, mobile editor:** The type filter remains in the mobile toolbar today; a header-only language filter would be difficult to find when its column is off-screen.

## Minor Observations

Ego routes checked: `/admin/authors` and `/admin/quotes/published`, desktop 1240×748 and mobile 390×844. The tables measured 720px and 760px wide on mobile, confirming the horizontal reachability risk. The live overlay was skipped because `.impeccable/live/config.json` is absent; enabling it would require an out-of-scope configuration edit. The existing localhost:3002 server was left intact. No repository files were changed.

## Questions to Consider

- Should the filters remain in the mobile toolbar or live in a shared mobile filter drawer?
- Can both controls keep a compact visible state without making the header ambiguous?
