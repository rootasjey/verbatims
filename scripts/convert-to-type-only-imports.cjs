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

  // ONLY match import lines whose module is exactly '~/types'
  content = content.replace(/^([ \t]*)import\s+\{([^}]+)\}\s+from\s+(['"])~\/types\3\s*;?/gm, (m, indent, inner, quote) => {
    changed = true
    return `${indent}import type {${inner}} from ${quote}~/types${quote}`
  })

  // ONLY match import lines whose module is exactly '#auth-utils'
  content = content.replace(/^([ \t]*)import\s+\{([^}]+)\}\s+from\s+(['"])#auth-utils\3\s*;?/gm, (m, indent, inner, quote) => {
    changed = true
    return `${indent}import type {${inner}} from ${quote}#auth-utils${quote}`
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
