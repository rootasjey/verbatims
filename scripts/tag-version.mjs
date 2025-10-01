#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { execSync } from 'node:child_process'

const pkgPath = new URL('../package.json', import.meta.url).pathname

function usage() {
  console.log('Usage: tag-version.mjs <patch|minor|major>')
  process.exit(1)
}

function bump(v, type) {
  const [maj, min, pat] = v.split('.').map(n => Number(n))
  if ([maj, min, pat].some(n => Number.isNaN(n))) throw new Error('Invalid semver in package.json')
  if (type === 'patch') return `${maj}.${min}.${pat + 1}`
  if (type === 'minor') return `${maj}.${min + 1}.0`
  if (type === 'major') return `${maj + 1}.0.0`
  throw new Error('Unknown bump type: ' + type)
}

async function main() {
  const type = process.argv[2]
  if (!type) usage()

  const pkg = JSON.parse(await readFile(pkgPath, 'utf8'))
  const current = pkg.version
  const next = bump(current, type)
  pkg.version = next
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8')
  console.log(`package.json version: ${current} -> ${next}`)

  // create tag without committing package.json change
  const tag = `v${next}`
  try {
    execSync(`git tag -a ${tag} -m "Release ${tag}"`, { stdio: 'inherit' })
    console.log('Created tag', tag)
  } catch (e) {
    console.error('Failed to create tag:', e.message)
    process.exit(1)
  }
  console.log('NOTE: Remember to push the tag: git push origin', tag)
}

main().catch(err => { console.error(err); process.exit(1) })
