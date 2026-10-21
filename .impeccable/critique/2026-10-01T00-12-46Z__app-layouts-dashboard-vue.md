---
target: User dashboard (lists, favorites, drafts)
total_score: 25
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 2
target_identity: "file:/Users/rootasjey/GitHub/verbatims/app/layouts/dashboard.vue"
target_fingerprint: "sha256:c1d0fdadc69787b450b359061c54258894855a7c3819078765ed78f6aa8030b6"
target_path: /Users/rootasjey/GitHub/verbatims/app/layouts/dashboard.vue
timestamp: 2026-10-01T00-12-46Z
slug: app-layouts-dashboard-vue
---
## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 3/4 | Counters and loading/results are shown; action confirmation was not tested. |
| 2 | Match with the real world | 3/4 | Favorites, drafts, and published quotes are understandable; the lists summary count is confusing. |
| 3 | User control and freedom | 3/4 | Navigation, filters, and useful exits from empty states exist; undo/cancel paths were not tested. |
| 4 | Consistency and standards | 2/4 | Public navigation, dashboard navigation, and admin links coexist, especially awkwardly on mobile. |
| 5 | Error prevention | 2/4 | Several controls were not tested; ambiguous list counts and a missing mobile create action invite mistakes. |
| 6 | Recognition rather than recall | 3/4 | Desktop labels and page titles help, but some mobile header actions are icon-only. |
| 7 | Flexibility and efficiency | 3/4 | Search, sorting, filters, and bulk selection help on desktop; some controls disappear on mobile. |
| 8 | Aesthetic and minimalist design | 3/4 | Verbatims typography and palette carry through, but metrics and competing navigation dilute the focal action. |
| 9 | Error recovery | 2/4 | Empty states offer a next step; failed-action recovery was not observed. |
| 10 | Help and documentation | 1/4 | Little directly accessible guidance was apparent; a new-account flow was not tested. |
| **Total** | | **25/40** | **Acceptable; the weakest areas are help, mobile navigation, and action hierarchy.** |

Scores are qualitative and based on the sampled connected admin account and routes below; they are not a full accessibility or new-account test.

## Design Specificity Verdict

The dashboard retains product-specific editorial cues—Verbatims wordmark, palette, serif headlines, and quote-first content—but its persistent sidebar, metrics-first overview, and visible Developer/Admin destinations make the personal area read like a small admin console. This is a structural mismatch more than a color or typography problem. Assessment A and the browser review in Assessment B independently noted the admin-like impression; the desktop/mobile captures support that judgment. Admin-only destinations were observed on the connected admin account, so their visibility to ordinary users remains unverified.

The deterministic detector reported four `gray-on-color` warnings across three locations. They appear to be false positives: two classes in `developer.vue` belong to different conditional branches; in `favourites.vue` and `lists/[id].vue`, gray text is the default while red is only a hover background. The scan covered `app/pages/dashboard`; it did not scan the layout file.

## Overall Impression

The task pages themselves are reasonably clear and quote-centered. The sense of “admin” comes mainly from the outer frame and the amount of navigation, not from the core tasks. A separate information architecture for personal work is useful; a visibly separate application shell is probably not.

## What's Working

- Favorites and quote contributions keep the actual quotes central; the published feed remains readable on mobile.
- Specialized pages have clear task titles, relevant controls, and empty states that offer a way forward.
- Typography and restrained colors connect the dashboard to Verbatims’ public editorial identity.

## Priority Issues

1. **[P1] Competing navigation makes the personal area feel administrative.** The dashboard sidebar/menu sits alongside public navigation; on mobile, the dashboard menu and public bottom navigation add competing location cues. On the inspected admin account, Developer and Admin destinations are also visible. **Fix:** share the public site’s outer frame and account entry point, keep a compact contextual “My library” sub-navigation for Favorites, Lists, Drafts, Pending, and Published, and keep administration in its own clearly privileged area.
2. **[P1] Creating a list is unavailable on mobile when lists already exist.** The “Create List” action disappears with desktop controls, and the populated state does not replace it with an accessible mobile action. **Fix:** keep a touch-sized create action available at mobile widths.
3. **[P2] The dashboard overview places five metrics before the contribution action.** “Submit a quote” is lower in the page and below the first mobile view, so a first-time contributor may not see the next useful step. **Fix:** lead with one relevant action and recent personal content; demote the metrics.
4. **[P2] The list summary appears to count lists as quotes.** The observed summary says “2 quotes” while the two visible lists each show zero quotes; dates also show “N/A”. This may be local seed/data behavior rather than a production defect. **Fix:** verify the source and make the unit and date states truthful; hide unavailable dates rather than showing “N/A”.
5. **[P2] Mobile has measurable horizontal overflow and weaker control discoverability.** Assessment B measured a 407px document at a 390px viewport on the favorites route; Assessment A also noted that some mobile controls are icon-only and sorting/language controls disappear. **Fix:** remove the overflow and preserve access to important controls through a labeled compact filter/action surface.

## Cognitive Load

Assessment A marked 4 of 8 checks as failures, concentrated on the overview and navigation: the primary contribution action competes with metrics, five statistics form one oversized group, the action hierarchy is inverted, and users must reconcile multiple navigation systems. The specialized pages otherwise keep a clear task focus and useful grouping.

## Persona Red Flags

- **Alex, power user:** On Published, search, sorting, language filters, and bulk selection support managing many quotes on desktop. On mobile some controls disappear, requiring more navigation and reducing efficiency.
- **Jordan, first-timer:** The overview foregrounds statistics and activity while “Submit a quote” is lower on the page; on mobile it falls below the first view. A brand-new account was not tested, so this is a hierarchy-based projection, not a confirmed first-run failure.

## Minor Observations

- The list count/date inconsistencies may come from local test data and need a data-level check before changing copy or UI behavior.
- The favorites page in one capture was still loading and displayed zero items; do not treat that capture alone as proof of a broken empty state.
- No overlay injection or full assistive-technology test was performed. Browser evidence came from inspected desktop/mobile screenshots and DOM-visible page states.

## Questions to Consider

- What if the personal area were a named section inside the familiar site shell, while only Admin retained its own distinct console?
- Should the dashboard home prioritize contributing, or returning to a quote/list the user was already organizing?
- Can the metrics move out of the first visual position without losing useful status information?
