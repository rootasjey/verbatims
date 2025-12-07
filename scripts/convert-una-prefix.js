#!/usr/bin/env node
/**
 * scripts/convert-una-prefix.js
 *
 * Codemod to convert Una UI component tags from prefix U -> N across .vue template blocks.
 * Usage:
 *   node scripts/convert-una-prefix.js        # dry-run: prints report
 *   node scripts/convert-una-prefix.js --apply  # perform changes
 *
 * This script will:
 * - Traverse .vue files in the repo
 * - For each <template>...</template> block run replacements:
 *    - PascalCase tags: <UButton ...> -> <NButton ...> and closing tags accordingly
 *    - Kebab-case tags: <u-button ...> -> <n-button ...>
 * - Will not change occurrences outside template blocks
 */

const fs = require('fs')
const path = require('path')
const fg = require('fast-glob')

const args = process.argv.slice(2)
const apply = args.includes('--apply')

function transformTemplate(templateContent) {
  let changed = false
  let out = templateContent

  // PascalCase open tags: <UButton ...
  out = out.replace(/<\s*U([A-Z][A-Za-z0-9_]*)\b/g, (m, p1) => {
    changed = true
    return `<N${p1}`
  })

  // PascalCase closing tags: </UButton>
  out = out.replace(/<\/\s*U([A-Z][A-Za-z0-9_]*)\s*>/g, (m, p1) => {
    changed = true
    return `</N${p1}>`
  })

  // Kebab-case open tags: <u-button
  out = out.replace(/<\s*u-([a-z0-9\-]+)\b/gi, (m, p1) => {
    changed = true
    return `<n-${p1.toLowerCase()}`
  })

  // Kebab-case closing tags: </u-button>
  out = out.replace(/<\/\s*u-([a-z0-9\-]+)\s*>/gi, (m, p1) => {
    changed = true
    return `</n-${p1.toLowerCase()}>`
  })

  return { out, changed }
}

async function run() {
  const patterns = ['**/*.vue', '!node_modules', '!**/.git/**', '!**/.nuxt/**']
  const files = await fg(patterns, { dot: true })

  const report = []

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')

    // Find all template blocks, replace only inside template
    const templateRegex = /<template(\s[^>]*)?>([\s\S]*?)<\/template>/g
    let match
    let newContent = content
    let fileChanged = false

    let lastIndex = 0
    const pieces = []

    while ((match = templateRegex.exec(content)) !== null) {
      const [fullMatch, attrs = '', inner] = match
      const start = match.index
      const end = templateRegex.lastIndex

      // push leading chunk
      pieces.push(content.slice(lastIndex, start))

      const { out, changed } = transformTemplate(inner)
      fileChanged = fileChanged || changed

      // push replaced template block
      pieces.push(`<template${attrs}>${out}</template>`)

      lastIndex = end
    }

    if (lastIndex > 0) {
      pieces.push(content.slice(lastIndex))
      newContent = pieces.join('')
    }

    if (fileChanged) {
      report.push({ file })
      if (apply) {
        fs.writeFileSync(file, newContent, 'utf8')
      }
    }
  }

  // print summary
  if (report.length === 0) {
    console.log('No matches found for U->N conversion in templates.')
    return
  }

  console.log(`${report.length} files affected:`)
  for (const r of report) console.log('  -', r.file)

  if (!apply) {
    console.log('\nDry run — no files changed. Re-run with --apply to write changes.')
  } else {
    console.log('\nApplied updates to files above.')
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
