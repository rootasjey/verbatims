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
    const openRe = /<template(\s[^>]*)?>/g

    let match
    const blocks = []
    while ((match = openRe.exec(content)) !== null) {
      const attrs = match[1] || ''
      const startOpen = match.index
      let cursor = openRe.lastIndex
      let depth = 1

      while (depth > 0) {
        const nextOpen = content.indexOf('<template', cursor)
        const nextClose = content.indexOf('</template>', cursor)
        if (nextClose === -1) {
          // malformed file, abort
          break
        }

        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++
          cursor = nextOpen + 1
        } else {
          depth--
          cursor = nextClose + '</template>'.length
        }
      }

      const endClose = cursor
      if (endClose > startOpen) {
        const innerStart = match.index + match[0].length
        const inner = content.slice(innerStart, endClose - '</template>'.length)
        blocks.push({ startOpen, attrs, innerStart, inner, endClose })
      }
    }

    if (blocks.length > 0) {
      // reconstruct content replacing the transformed template blocks
      let outPieces = []
      let last = 0
      for (const b of blocks) {
        outPieces.push(content.slice(last, b.startOpen))
        const { out, changed } = transformTemplate(b.inner)
        fileChanged = fileChanged || changed
        outPieces.push(`<template${b.attrs}>${out}</template>`)
        last = b.endClose
      }
      outPieces.push(content.slice(last))
      newContent = outPieces.join('')
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
