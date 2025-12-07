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

  // Fix cases like: from "~/types"import { ... }
  content = content.replace(/(from\s+['"]~\/types['"])\s*(?=(import|export)\b)/g, '$1\n')

  // Fix cases like: from '#auth-utils'export default ...
  content = content.replace(/(from\s+['"]#auth-utils['"])\s*(?=(import|export)\b)/g, '$1\n')

  if (content !== original) {
    report.push(file)
    if (apply) fs.writeFileSync(file, content, 'utf8')
  }
}

if (!report.length) console.log('No spacing fixes required.')
else {
  console.log(`${report.length} files would be fixed:`)
  report.forEach(f => console.log(' -', f))
  if (!apply) console.log('\nDry run — re-run with --apply')
}

process.exit(0)
