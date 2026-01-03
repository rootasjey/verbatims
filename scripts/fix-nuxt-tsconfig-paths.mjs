import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

/**
 * Nuxt generates multiple tsconfig.*.json files under `.nuxt/` and also under
 * `node_modules/.cache/nuxt/.nuxt/`.
 *
 * In this repo we use imports like `~/server/...` from server code.
 * VS Code resolves them thanks to the root tsconfig + Nuxt language tooling,
 * but `vue-tsc -b` (Nuxt `typecheck`) can end up checking server files with the
 * app tsconfig, which often lacks `~/server/*` path mappings.
 *
 * This script patches the generated tsconfigs to ensure `~/server/*` and
 * `~/shared/*` resolve correctly from the generated tsconfig locations.
 */

const repoRoot = process.cwd()

const targets = [
  resolve(repoRoot, '.nuxt/tsconfig.json'),
  resolve(repoRoot, '.nuxt/tsconfig.app.json'),
  resolve(repoRoot, 'node_modules/.cache/nuxt/.nuxt/tsconfig.json'),
  resolve(repoRoot, 'node_modules/.cache/nuxt/.nuxt/tsconfig.app.json'),
]

const desiredPaths = {
  '~/server': ['../server'],
  '~/server/*': ['../server/*'],
  '~/shared': ['../shared'],
  '~/shared/*': ['../shared/*'],
}

function readJsonc(filePath) {
  const raw = readFileSync(filePath, 'utf8')

  // Nuxt writes JSONC. We need to strip comments WITHOUT touching sequences like "~/*".
  const noComments = stripJsonComments(raw)
  return { raw, json: JSON.parse(noComments) }
}

function stripJsonComments(input) {
  let out = ''
  let i = 0
  let inString = false
  let stringQuote = '"'
  let escaped = false

  while (i < input.length) {
    const ch = input[i]
    const next = input[i + 1]

    if (inString) {
      out += ch
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === stringQuote) {
        inString = false
      }
      i++
      continue
    }

    // Enter string
    if (ch === '"' || ch === "'") {
      inString = true
      stringQuote = ch
      out += ch
      i++
      continue
    }

    // Line comment
    if (ch === '/' && next === '/') {
      i += 2
      while (i < input.length && input[i] !== '\n') i++
      continue
    }

    // Block comment
    if (ch === '/' && next === '*') {
      i += 2
      while (i < input.length) {
        if (input[i] === '*' && input[i + 1] === '/') {
          i += 2
          break
        }
        i++
      }
      continue
    }

    out += ch
    i++
  }

  return out
}

function writeJsonc(filePath, originalRaw, value) {
  // Preserve JSONC formatting isn't critical here; keep it readable.
  const out = JSON.stringify(value, null, 2) + '\n'
  writeFileSync(filePath, out, 'utf8')
}

let patched = 0
for (const filePath of targets) {
  if (!existsSync(filePath)) continue

  const { raw, json } = readJsonc(filePath)

  json.compilerOptions ||= {}
  json.compilerOptions.paths ||= {}

  let changed = false
  for (const [key, val] of Object.entries(desiredPaths)) {
    const cur = json.compilerOptions.paths[key]
    const same = Array.isArray(cur) && cur.length === val.length && cur.every((v, i) => v === val[i])
    if (!same) {
      json.compilerOptions.paths[key] = val
      changed = true
    }
  }

  if (changed) {
    writeJsonc(filePath, raw, json)
    patched++
  }
}

if (patched > 0) {
  // eslint-disable-next-line no-console
  console.log(`[fix-nuxt-tsconfig-paths] Patched ${patched} tsconfig file(s).`)
}
