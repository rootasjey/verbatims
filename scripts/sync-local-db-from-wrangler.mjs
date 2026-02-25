import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const sourceDir = resolve(root, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject')
const targetDb = resolve(root, '.data/db/sqlite.db')

function formatTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

if (!existsSync(sourceDir)) {
  console.error(`Source D1 directory not found: ${sourceDir}`)
  process.exit(1)
}

const sourceCandidates = readdirSync(sourceDir)
  .filter(name => name.endsWith('.sqlite'))
  .map(name => ({
    name,
    path: join(sourceDir, name),
    mtime: statSync(join(sourceDir, name)).mtimeMs
  }))
  .sort((a, b) => b.mtime - a.mtime)

if (!sourceCandidates.length) {
  console.error(`No .sqlite source file found in: ${sourceDir}`)
  process.exit(1)
}

const sourceDb = sourceCandidates[0].path
mkdirSync(dirname(targetDb), { recursive: true })

if (existsSync(targetDb)) {
  const backupPath = `${targetDb}.before-sync-${formatTimestamp()}.bak`
  copyFileSync(targetDb, backupPath)
  console.log(`Backed up target DB to: ${backupPath}`)
}

const sqliteBackup = spawnSync('sqlite3', [sourceDb, `.backup ${targetDb}`], {
  cwd: root,
  stdio: 'pipe',
  encoding: 'utf8'
})

if (sqliteBackup.error) {
  copyFileSync(sourceDb, targetDb)
  console.warn('sqlite3 not available, used direct file copy fallback')
} else if (sqliteBackup.status !== 0) {
  console.error(sqliteBackup.stderr || 'sqlite3 backup failed')
  process.exit(sqliteBackup.status ?? 1)
}

const sourceSize = statSync(sourceDb).size
const targetSize = statSync(targetDb).size
console.log(`Synced local DB from ${sourceDb}`)
console.log(`Target DB: ${targetDb}`)
console.log(`Source size: ${sourceSize} bytes | Target size: ${targetSize} bytes`)
