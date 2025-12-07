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

      pieces.push(content.slice(lastIndex, start))

      const { out, changed } = transformTemplate(inner)
      fileChanged = fileChanged || changed

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
