import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const nuxi = resolve(root, 'node_modules/.bin/nuxi')
const configPath = resolve(root, '.nuxt/hub/db/config.json')
const generatedDbPath = resolve(root, 'node_modules/@nuxthub/db/db.mjs')
const expectedUrl = 'file:.data/db/sqlite.db'

console.log('Preparing NuxtHub database configuration...')
const prepare = spawnSync(process.execPath, [nuxi, 'prepare'], {
  cwd: root,
  env: { ...process.env, NUXT_HUB_LOCAL_DB: '1' },
  stdio: 'inherit',
})

if (prepare.status !== 0) {
  process.exit(prepare.status ?? 1)
}

if (!existsSync(configPath) || !existsSync(generatedDbPath)) {
  console.error('Local database check failed: NuxtHub did not generate its database configuration.')
  process.exit(1)
}

const config = JSON.parse(readFileSync(configPath, 'utf8'))
const generatedDb = readFileSync(generatedDbPath, 'utf8')
const actualDriver = config.db?.driver
const actualUrl = config.db?.connection?.url

if (
  actualDriver !== 'libsql'
  || actualUrl !== expectedUrl
  || !generatedDb.includes("drizzle-orm/libsql")
  || !generatedDb.includes(expectedUrl)
) {
  console.error('Local database check failed.')
  console.error(`Expected: libsql driver with ${expectedUrl}`)
  console.error(`Generated: ${actualDriver || 'unknown'} driver with ${actualUrl || 'no URL'}`)
  console.error('Refusing to start so the local server cannot silently switch to D1.')
  process.exit(1)
}

console.log(`Local database: ${actualDriver} -> ${actualUrl}`)
