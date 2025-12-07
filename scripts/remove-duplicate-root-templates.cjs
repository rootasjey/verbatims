#!/usr/bin/env node
const fs = require('fs')
const fg = require('fast-glob')

const args = process.argv.slice(2)
const apply = args.includes('--apply')

async function run() {
  const files = await fg(['**/*.vue', '!**/node_modules/**', '!**/.git/**', '!**/.nuxt/**'])
  const changes = []

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    const firstOpen = content.indexOf('<template')
    if (firstOpen === -1) continue
    const firstOpenEnd = content.indexOf('>', firstOpen)
    if (firstOpenEnd === -1) continue

    // find matching closing for first template (account nested <template>)
    let cursor = firstOpenEnd + 1
    let depth = 1
    while (depth > 0) {
      const nextOpen = content.indexOf('<template', cursor)
      const nextClose = content.indexOf('</template>', cursor)
      if (nextClose === -1) { depth = -1; break }
      if (nextOpen !== -1 && nextOpen < nextClose) { depth++; cursor = nextOpen + 1 } else { depth--; cursor = nextClose + '</template>'.length }
    }
    if (cursor === -1 || cursor <= firstOpen) continue

    const firstTemplateEnd = cursor
    const secondOpen = content.indexOf('<template', firstTemplateEnd)
    if (secondOpen === -1) continue

    // find matching end for second template
    let sCursor = content.indexOf('>', secondOpen)
    if (sCursor === -1) continue
    sCursor = sCursor + 1
    let sDepth = 1
    while (sDepth > 0) {
      const nextOpen = content.indexOf('<template', sCursor)
      const nextClose = content.indexOf('</template>', sCursor)
      if (nextClose === -1) { sDepth = -1; break }
      if (nextOpen !== -1 && nextOpen < nextClose) { sDepth++; sCursor = nextOpen + 1 } else { sDepth--; sCursor = nextClose + '</template>'.length }
    }
    if (sCursor === -1) continue

    const secondEnd = sCursor

    changes.push({ file, start: secondOpen, end: secondEnd, excerpt: content.slice(Math.max(0, secondOpen - 80), Math.min(content.length, secondEnd + 80)).replace(/\n/g, '\n') })
  }

  if (changes.length === 0) {
    console.log('No duplicate root-level <template> blocks detected.')
    return
  }

  console.log(`${changes.length} files with duplicate root templates:`)
  for (const c of changes) {
    console.log(`\n--- ${c.file} ---`)
    console.log(c.excerpt)
  }

  if (!apply) {
    console.log('\nDry run — use --apply to remove duplicate blocks.')
    return
  }

  for (const c of changes) {
    const content = fs.readFileSync(c.file, 'utf8')
    const newContent = content.slice(0, c.start) + content.slice(c.end)
    fs.writeFileSync(c.file, newContent, 'utf8')
    console.log('Removed duplicate template block from', c.file)
  }
}

run().catch(e => { console.error(e); process.exit(1) })
