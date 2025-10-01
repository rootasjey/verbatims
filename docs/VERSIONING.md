## Versioning strategy — Tag-based + build-time injection

This project uses a simple tag-based versioning strategy with build-time injection of the version string into the built assets. It's intentionally low-friction and keeps release control with maintainers.

Summary
- Source of truth: git tags (e.g. `v1.2.3`).
- Build-time injection: the build reads the most recent tag (or `package.json` fallback) and writes a `__APP_VERSION__`-style replacement into the bundle.
- No automatic version bumps are performed by CI unless you add tooling to do so. Creating a release is an explicit action (tag push).

Why we chose this
- Works well for applications where tags and releases are the authority.
- Avoids enforcing Conventional Commits or a release bot.
- Allows manual control for patch/minor/major bumps without complicated CI workflows.

How it works (technical sketch)

1. During local development the project uses the version in `package.json` as a fallback (helpful for `npm`/`bun` workflows and local testing).
2. During CI or `bun run build`, a small script reads the latest annotated or lightweight git tag that matches the version pattern `v*.*.*` and exports that value to the build (for example, by writing it to a file or replacing a token at build-time).
3. The built app exposes the injected value at runtime (for example a global constant or an endpoint) so the UI and logs can show the exact deployed version.

Does the version bump automatically?

Short answer: No — version bumps do not happen automatically unless you add automation.

Details:
- The build and CI will read the latest git tag to determine the version. The CI will not create or update tags by itself.
- Creating a new version requires a maintainer to create and push a git tag (see "How to create a release" below).

What happens if I manually update the version value in `package.json`?

- If you change only `package.json` locally and do not create a corresponding git tag, the build may still prefer a matching git tag (if present in your environment). Otherwise, builds that rely on `package.json` as a fallback will use that version string.
- In short:
  - Local dev: `package.json` version is useful and will be used by local runs.
  - CI/build: the build step prefers the latest git tag. If no tag is present it will fall back to `package.json`.
  - Pushing a changed `package.json` without tagging will not create an official release; to produce a deployable release you must push a git tag.

How to bump into a new release or major version

The canonical, recommended flow is to create a git tag and push it to the remote. Examples below show a few approaches.

1) Create a tag manually (recommended for maintainers)

- Patch bump (e.g. 1.2.3 → 1.2.4):

  git tag v1.2.4 -m "Release v1.2.4"
  git push origin v1.2.4

- Minor bump (e.g. 1.2.3 → 1.3.0):

  git tag v1.3.0 -m "Release v1.3.0"
  git push origin v1.3.0

- Major bump (e.g. 1.2.3 → 2.0.0):

  git tag v2.0.0 -m "Release v2.0.0"
  git push origin v2.0.0

Notes:
- Use annotated tags (`git tag -a vX.Y.Z -m "message"`) when you want more metadata; lightweight tags (no -a) work too.
- Pushing tags is the action that creates the release version from the perspective of the build.

2) Use `npm`/`bun` helpers for local version update + tag (optional)

- If you prefer editing `package.json` and having the tooling create a tag for you, use `npm version` or `bunx npm version` helpers:

  # patch
  npm version patch

  # minor
  npm version minor

  # major
  npm version major

This updates `package.json`, creates a git commit, and creates a git tag. You still need to push the commit and tag:

  git push --follow-tags origin main

3) CI-driven tagging (advanced / optional)

- If you'd rather automate tagging from PR merges or release branches, implement a CI job that runs `npm version` or `git tag` on the repository and pushes the tag back to the remote. This is optional — the default repo configuration does not include automatic tagging.

Best practices

- Always create a tag for a released version so the build can reliably inject the correct version.
- Use `v`-prefixed semantic versions (for example `v1.2.3`) so the build script can easily pattern-match tags.
- Prefer annotated tags for important releases; they carry commit metadata and messages.
- If you want a changelog, generate it from your commit history or use a release checklist when tagging.

Troubleshooting

- Build shows an older version: ensure the CI environment has fetched tags. For GitHub Actions, make sure the checkout action fetches tags (set fetch-depth: 0 or fetch-tags).
- Version shows `0.0.0` or an unexpected fallback: that means no tag was found and `package.json` may be missing or empty; check the build logs and the script that injects the version.

Example build snippet (conceptual)

```bash
# get latest tag matching v*.*.* or fallback to package.json
TAG=$(git describe --tags --match "v[0-9]*.[0-9]*.[0-9]*" --abbrev=0 2>/dev/null || true)
if [ -z "$TAG" ]; then
  TAG=$(node -pe "require('./package.json').version")
fi
echo "Using version: $TAG"
# write to a file consumed by the build
printf "%s" "$TAG" > .version
```

Next steps / optional improvements

- Add a small `scripts/get-version.js` that encapsulates the logic (git tag preferred, then package.json) and is used by CI and local builds.
- Add a `release` GitHub Action if you want automated tagging, changelog generation, or GitHub Releases creation.
- If you adopt semantic commit conventions later, you can add automation to generate changelogs and auto bump versions.

Contact

If you have questions or want me to wire up an automated tagging CI workflow or a `get-version.js` helper, open an issue or ping the maintainers.
Local helpers

- `scripts/bump-version.mjs` — bump package.json patch version.
  - Usage:
    - Bump only: `node ./scripts/bump-version.mjs --bump`
    - Bump + commit: `node ./scripts/bump-version.mjs --bump -c`
    - Bump + commit + push: `node ./scripts/bump-version.mjs --bump -cp`
    - Bump + push (will commit if pending): `node ./scripts/bump-version.mjs --bump -p`
  - Notes: This script no longer touches `types/version.ts` (we inject at build).

- `scripts/tag-version.mjs` — bump package.json and create a git tag without committing.
  - Usage:
    - `bun run version patch`
    - `bun run version minor`
    - `bun run version major`
  - Then push the tag: `git push origin vX.Y.Z`

CI

- We removed the auto-bump workflow to avoid double deploys on Cloudflare.
- Deploy workflow fetches tags so the build-time injected version matches the latest `vX.Y.Z` tag.
