---
target: /login and /signup
total_score: 24
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 1
timestamp: 2026-09-28T05-41-29Z
slug: app-pages-login-vue
---
# Design critique — Login and signup (`app/pages/login.vue`, `app/pages/signup.vue`)

## Design health score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 2/4 | OAuth failures are silent to the user; form errors are not tied to individual fields. |
| 2 | Match with real world | 3/4 | Labels and account flows are familiar, but signup’s legal sentence has a hard-coded English conjunction. |
| 3 | User control and freedom | 3/4 | Password visibility, forgot-password, and return-to-login paths exist, though the latter can fall below the mobile viewport. |
| 4 | Consistency and standards | 3/4 | Both routes share an auth purpose, but desktop/mobile branches diverge in CTA styling and composition. |
| 5 | Error prevention | 3/4 | Required fields, minimum password length, and password matching are checked on submit; autocomplete hints are missing. |
| 6 | Recognition rather than recall | 2/4 | Password reveal controls have no accessible name, and general errors are not associated with fields. |
| 7 | Flexibility and efficiency | 2/4 | The long signup flow has no clear shortcut or progress cue; the return link is easy to miss. |
| 8 | Aesthetic and minimalist design | 2/4 | Repeated dashed borders feel template-like, and the auth surface is less editorially specific than the main pages. |
| 9 | Help users recover from errors | 2/4 | OAuth failure only reaches the console; form feedback is broad rather than actionable per field. |
| 10 | Help and documentation | 2/4 | The pages do not clearly communicate why creating an account is worthwhile. |
| **Total** |  | **24/40** | **Functional foundation; the visual hierarchy, mobile fit, accessibility, and feedback need refinement.** |

## Design specificity verdict

The pages are **lightly Verbatims-specific (2/5)**. They inherit the project’s type and subdued palette, but the repeated dashed outlines and generic form treatment do not yet feel like entering a curated quote library. Desktop composition is less persuasive than the mobile version, while the separate desktop/mobile template branches introduce avoidable visual drift.

## Overall impression

The core flows are straightforward, but the current UI presents “authentication” as a generic gate rather than a small, confident doorway into Verbatims. The redesign should make the form the obvious focus, retain a quiet editorial identity, and keep the route-to-route account path discoverable without letting decorative copy compete with the task.

## What’s working

- Login and signup preserve familiar email/password paths, with GitHub and Google alternatives.
- Password reveal and forgot-password affordances are present.
- Signup checks required values, an eight-character minimum, and matching passwords before submission.
- Existing API calls and destination behavior provide a clear functional baseline to preserve.

## Priority issues

1. **[P1] Password reveal controls are not accessible by name and their targets are too small.** The eye icon buttons have no accessible name and were measured at roughly 16×20 px. **Fix:** add localized accessible labels that toggle between “Show password” and “Hide password,” and give the controls comfortable touch targets.
2. **[P2] The fixed mobile app navigation overlaps signup’s legal notice.** This makes important consent/legal copy harder to read and the bottom of the form feel cramped. **Fix:** hide the fixed app navigation on auth routes or reserve enough safe-area space so no content is obscured.
3. **[P2] OAuth errors are invisible to the user.** Failures are only logged to the console. **Fix:** show a localized, non-blocking error near the provider actions while preserving the existing flow.
4. **[P2] The signup page is long and its return-to-login link can fall below the first mobile viewport.** The legal text and provider actions add to the form’s height. **Fix:** refine vertical rhythm and place the alternate sign-in path where it remains easy to find; do not hide legal requirements.
5. **[P2] Form feedback and browser autofill support are underspecified.** Errors use a general alert, and fields lack explicit autocomplete attributes. **Fix:** use appropriate `autocomplete` values and associate field-level validation with the relevant inputs while retaining a summary for submission failures.

## Cognitive load

**Moderate.** Signup has several actions and destinations competing in a single vertical flow. Desktop/mobile branches use slightly different CTA treatments, and the benefit of creating an account is not apparent enough to justify the extra steps.

## Emotional journey

The user reaches a conventional form and can complete it, but the generic outlines and quiet-but-ambiguous feedback make the experience feel utilitarian rather than part of the editorial product. A concise, concrete promise and a cleaner shared composition can improve confidence without adding promotional noise.

## Persona red flags

- **Keyboard/screen-reader user:** icon-only password reveal actions need explicit accessible names and visible focus.
- **Mobile user:** the fixed bottom navigation competes with legal copy and the final signup content.
- **Returning user:** the sign-in alternative should remain findable after encountering the full signup form.
- **User with an OAuth failure:** no visible recovery feedback currently confirms that the attempt failed.

## Minor observations

- The legal text contains a hard-coded English “and” between links despite localized copy elsewhere.
- The heading, helper copy, and account value proposition should be reviewed together; avoid adding explanatory paragraphs that push the form down.
- The repeated dashed borders are the strongest generic/template cue.

## Questions to pressure-test

- Should the two routes share one auth shell and visual system while keeping distinct, task-specific headings and content?
- Is password confirmation worth the additional field and mobile height, given the existing visibility toggle and server-side validation?
- What is the shortest honest account benefit to communicate without turning the form into a promotional landing page?

## Evidence and limits

- Fresh browser review in dark mode at 1228×736 and 390×844 on both routes.
- Source review covered email/password and OAuth flows, required-field checks, error presentation, and navigation.
- No form was submitted; loading and error states were assessed from source, not observed live.
- Light mode and OAuth completion/failure were not visually exercised.
- Impeccable detector: zero findings. Browser overlay detector was skipped because its live-server setup timed out and then reported missing live configuration.
- Independent review: two agents, each working from the pages independently; browser review was conducted by the second agent.
