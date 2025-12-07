#!/usr/bin/env node
const fs = require('fs')
const fg = require('fast-glob')

const patterns = ['server/**/*.{ts,js}', '!node_modules', '!**/.git/**', '!**/.nuxt/**']
const files = fg.sync(patterns, { dot: true })
const apply = process.argv.includes('--apply')

const report = []

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8')
  let content = original

  // Replace occurrences of `if (error.statusCode)` with a safe narrowing
  content = content.replace(/\bif\s*\(\s*error\.statusCode\s*\)/g, 'if ((error as any).statusCode)')

  if (content !== original) {
    report.push(file)
    if (apply) fs.writeFileSync(file, content, 'utf8')
  }
}

if (!report.length) console.log('No error.statusCode checks found.')
else {
  console.log(`${report.length} files would be updated`)
  report.forEach(f => console.log(' -', f))
  if (!apply) console.log('\nDry-run — re-run with --apply')
}

process.exit(0)
