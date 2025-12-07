#!/usr/bin/env node
const fs = require('fs')
const fg = require('fast-glob')

const patterns = [
  'server/**/*.ts',
  'server/**/*.js',
  '!node_modules',
  '!**/.git/**',
  '!**/.nuxt/**'
]

const files = fg.sync(patterns, { dot: true })
const apply = process.argv.includes('--apply')

function transform(content) {
  let changed = false
  // replace import from '~/types' or "~/types" with import type
  content = content.replace(/(^\s*)import\s+\{([^}]+)\}\s+from\s+(['"]~\/types['"])*/gm, (m, indent, inner, src) => {
    changed = true
    // if it's already an import type, leave alone
    if (/import\s+type/.test(m)) return m
    // return import type
    return `${indent}import type {${inner}} from ${src || "'~/types'"}`
  })

  // also handle #auth-utils (User type) — similar pattern
  content = content.replace(/(^\s*)import\s+\{([^}]+)\}\s+from\s+(['"]#auth-utils['"])*/gm, (m, indent, inner, src) => {
    changed = true
    if (/import\s+type/.test(m)) return m
    return `${indent}import type {${inner}} from ${src || "'#auth-utils'"}`
  })

  return { content, changed }
}

const report = []

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8')
  const { content, changed } = transform(original)
  if (changed) report.push(file)
  if (changed && apply) fs.writeFileSync(file, content, 'utf8')
}

if (!report.length) console.log('No matching imports found to convert to type-only.')
else {
  console.log(`${report.length} files to update:`)
  report.forEach(f => console.log(' -', f))
  if (!apply) console.log('\nDry run — re-run with --apply to write changes')
}

process.exit(0)
