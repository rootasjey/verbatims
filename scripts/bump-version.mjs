#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { execSync } from 'node:child_process'

function usage() {
  console.log('Usage: bump-version.mjs [type] [-c|-p|-cp]')
  console.log('  type        one of: fix|patch (default), minor, major')
  console.log('  -c          Also commit the change')
  console.log('  -p          Also push (implies -c if a commit is pending)')
  console.log('  -cp         Commit and push')
  process.exit(1)
}

const args = process.argv.slice(2)

// find first non-flag arg as bump type (e.g. minor/major/fix)
const typeArg = args.find(a => !a.startsWith('-'))
const bumpType = typeArg ? String(typeArg).toLowerCase() : 'patch'
if (!['patch', 'fix', 'minor', 'major'].includes(bumpType)) {
  usage()
}

const doCommit = args.includes('-c') || args.includes('-cp') || args.includes('-pc')
const doPush = args.includes('-p') || args.includes('-cp') || args.includes('-pc')

const pkgPath = new URL('../package.json', import.meta.url).pathname

async function readPackageVersion() {
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8'))
  return { pkg, version: pkg.version }
}

function bumpVersion(v, type) {
  const parts = v.split('.').map(n => Number(n))
  if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) throw new Error('Version must be semver x.y.z')
  let [maj, min, pat] = parts
  switch (type) {
    case 'patch':
    case 'fix':
      pat = pat + 1
      break
    case 'minor':
      min = min + 1
      pat = 0
      break
    case 'major':
      maj = maj + 1
      min = 0
      pat = 0
      break
    default:
      throw new Error('Unknown bump type: ' + type)
  }
  return `${maj}.${min}.${pat}`
}

async function writePackage(pkg) {
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
}

async function main() {
  const { pkg, version } = await readPackageVersion()
  const newVersion = bumpVersion(version, bumpType)
  pkg.version = newVersion
  await writePackage(pkg)
  console.log('Bumped version', version, '->', newVersion)
  execSync('git add package.json')

  if (doCommit || doPush) {
    try {
      execSync('git config user.name "verbatims-bot"')
      execSync('git config user.email "verbatims-bot@users.noreply.github.com"')
      // use [skip ci] to avoid CI loops in case workflows exist
      execSync(`git commit -m "chore: bump version to ${newVersion} [skip ci]"`, { stdio: 'inherit' })
    } catch (e) {
      // If commit fails because there are no changes, continue silently
      console.error('Commit step:', e.message)
    }
  }

  if (doPush) {
    try {
      execSync('git push', { stdio: 'inherit' })
    } catch (e) {
      console.error('Push step:', e.message)
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
