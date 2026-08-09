import { existsSync } from 'node:fs'
import { execSync, spawn } from 'node:child_process'
import { resolve } from 'node:path'

const output = resolve('.output/server/index.mjs')

if (!existsSync(output)) {
  console.log('[dev:worker] Worker bundle not found, building first...')
  execSync('bun run build', { stdio: 'inherit' })
} else {
  console.log('[dev:worker] Using existing worker bundle. Re-run `bun run build` after code changes (wrangler reloads automatically).')
}

const child = spawn('bunx', ['wrangler', 'dev'], { stdio: 'inherit' })
child.on('exit', (code) => process.exit(code ?? 0))
