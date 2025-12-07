#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const fg = require('fast-glob')

const args = process.argv.slice(2)
const apply = args.includes('--apply')

function transformTemplate(templateContent) {
  let changed = false
  let out = templateContent

  out = out.replace(/<\s*U([A-Z][A-Za-z0-9_]*)\b/g, (m, p1) => {
    changed = true
    return `<N${p1}`
  })
  out = out.replace(/<\/\s*U([A-Z][A-Za-z0-9_]*)\s*>/g, (m, p1) => {
    changed = true
    return `</N${p1}>`
  })
  out = out.replace(/<\s*u-([a-z0-9\-]+)\b/gi, (m, p1) => {
    changed = true
    return `<n-${p1.toLowerCase()}`
  })
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

    // Find template blocks safely (handles nested <template> ... </template> blocks)
    let newContent = content
    let fileChanged = false
    // Safer approach: exclude <script> and <style> blocks from modifications,
    // process the rest of the file and replace U-prefixed tags across the markup
    // (handles cases with complicated nesting or duplicated blocks safely).
    const placeholderBlocks = []
    let working = content

    // Extract script and style blocks so we don't accidentally change code or css
    const blockRe = /<(script|style)([\s\S]*?)>([\s\S]*?)<\/\1>/gi
    working = working.replace(blockRe, (m) => {
      const key = `__BLOCK_PLACEHOLDER_${placeholderBlocks.length}__`
      placeholderBlocks.push(m)
      return key
    })

    // Run replacements on the rest of the file
    const { out, changed } = transformTemplate(working)
    fileChanged = fileChanged || changed
    newContent = out

    // Restore script/style blocks
    for (let i = 0; i < placeholderBlocks.length; i++) {
      newContent = newContent.replace(`__BLOCK_PLACEHOLDER_${i}__`, placeholderBlocks[i])
    }

    if (fileChanged) {
      report.push({ file })
      if (apply) {
        fs.writeFileSync(file, newContent, 'utf8')
      }
    }
  }

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
