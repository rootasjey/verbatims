import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, copyFileSync, unlinkSync, mkdirSync, readdirSync, renameSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { createInterface } from 'node:readline'

const root = process.cwd()
const wrangler = resolve(root, 'node_modules/.bin/wrangler')
const targetDb = resolve(root, '.data/db/sqlite.db')
const tempSql = resolve(root, '.data/db/.prod-export.sql')
const incomingDb = `${targetDb}.incoming`
const ftsMigration = resolve(root, 'server/db/migrations/sqlite/0030_create_quotes_fts.sql')
const activityLogsMigration = resolve(root, 'server/db/migrations/sqlite/0024_create_activity_logs.sql')
const yes = process.argv.includes('--yes')

function run(cmd, args, { json = false } = {}) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', cwd: root })
  if (res.status !== 0) {
    console.error(res.stderr || res.stdout || `Command failed: ${cmd} ${args.join(' ')}`)
    process.exit(1)
  }
  return json ? JSON.parse(res.stdout) : res.stdout
}

function fmtTimestamp(date = new Date()) {
  const pad = (v) => String(v).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

async function confirm(prompt) {
  if (yes) return true
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await new Promise((res) => rl.question(`${prompt} [y/N] `, res))
  rl.close()
  return answer.toLowerCase() === 'y'
}

// 1. List production tables (exclude Cloudflare/wrangler internals and FTS virtual tables)
const results = run(wrangler, ['d1', 'execute', 'verbatims', '--remote', '--json', '--command',
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('_cf_KV','d1_migrations') AND name NOT LIKE 'quotes_fts%' ORDER BY name"
], { json: true })
const tables = results.flatMap((r) => r.results || []).map((row) => row.name)
if (!tables.length) {
  console.error('No tables found in production database.')
  process.exit(1)
}
console.log(`Found ${tables.length} production tables.`)

// 2. Confirm before overwriting the local database
if (!(await confirm(`This will REPLACE local .data/db/sqlite.db with production data. Continue?`))) {
  console.log('Aborted.')
  process.exit(0)
}

// 3. Export production schema + data (FTS virtual tables excluded on purpose)
console.log('Exporting production database...')
run(wrangler, ['d1', 'export', 'verbatims', '--remote', '--output', tempSql, ...tables.flatMap((t) => ['--table', t])])
console.log(`Exported to ${tempSql}`)

// 4. Back up current local DB, then import into a staging file. Wrangler's
// export interleaves each CREATE TABLE with that table's INSERTs, but its
// alphabetical table order can insert child rows before a referenced table
// exists. Create all tables first, then apply the exported data.
if (existsSync(targetDb)) {
  const backup = `${targetDb}.before-prod-sync-${fmtTimestamp()}.bak`
  copyFileSync(targetDb, backup)
  console.log(`Backed up local DB to ${backup}`)
}
mkdirSync(dirname(targetDb), { recursive: true })
if (existsSync(incomingDb)) unlinkSync(incomingDb)

const sql = readFileSync(tempSql, 'utf8')
const createTableStatements = []
const dataSql = sql.replace(/(^|\n)(CREATE TABLE\b[\s\S]*?;\n)/g, (_match, prefix, statement) => {
  createTableStatements.push(statement)
  return prefix
})
const db = new DatabaseSync(incomingDb)
try {
  console.log('Importing production data into local DB...')
  db.exec('BEGIN;')
  db.exec(`${createTableStatements.join('\n')}\n${dataSql}`)
  db.exec('COMMIT;')

  // Some production exports may predate activity_logs even though the
  // migration tracker is already populated. Restore the table locally before
  // marking migrations as applied so the generated database matches the app
  // schema.
  const activityLogsTable = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'activity_logs'").get()
  if (!activityLogsTable && existsSync(activityLogsMigration)) {
    console.log('Restoring missing activity_logs table...')
    db.exec(readFileSync(activityLogsMigration, 'utf8'))
  }

  if (existsSync(ftsMigration)) {
    console.log('Recreating FTS5 index (quotes_fts)...')
    db.exec(readFileSync(ftsMigration, 'utf8'))
  }

  // Production schema is already fully migrated; record every local migration
  // in the tracker so `nuxthub db migrate` stays consistent.
  console.log('Updating _hub_migrations tracker...')
  const migrationFiles = readdirSync(resolve(root, 'server/db/migrations/sqlite'))
    .filter((f) => f.endsWith('.sql'))
    .map((f) => f.replace(/\.sql$/, ''))
  const markApplied = db.prepare('INSERT OR IGNORE INTO _hub_migrations (name) VALUES (?)')
  for (const name of migrationFiles) {
    markApplied.run(name)
  }
} finally {
  db.close()
}

// 5. Cleanup and report
unlinkSync(tempSql)
renameSync(incomingDb, targetDb)
const check = new DatabaseSync(targetDb, { readOnly: true })
const count = (t) => check.prepare(`SELECT count(*) AS c FROM ${t}`).get().c
console.log('---')
console.log(`users: ${count('users')} | quotes: ${count('quotes')} | authors: ${count('authors')}`)
console.log(`activity_logs: ${count('activity_logs')} | _hub_migrations: ${count('_hub_migrations')}`)
check.close()
console.log('Local database synced from production.')
