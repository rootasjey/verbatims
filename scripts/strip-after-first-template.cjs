#!/usr/bin/env node
const fs = require('fs')
const fg = require('fast-glob')

const args = process.argv.slice(2)
const apply = args.includes('--apply')

async function run() {
  const files = await fg(['**/*.vue', '!**/node_modules/**', '!**/.git/**', '!**/.nuxt/**'])
  const candidates = []

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')

    const firstOpen = content.indexOf('<template')
    if (firstOpen === -1) continue
    const firstOpenEnd = content.indexOf('>', firstOpen)
    if (firstOpenEnd === -1) continue

    // find matching close for first template accounting nested templates
    let cursor = firstOpenEnd + 1
    let depth = 1
    while (depth > 0) {
      const nextOpen = content.indexOf('<template', cursor)
      const nextClose = content.indexOf('</template>', cursor)
      if (nextClose === -1) { depth = -1; break }
      if (nextOpen !== -1 && nextOpen < nextClose) { depth++; cursor = nextOpen + 1 } else { depth--; cursor = nextClose + '</template>'.length }
    }
    if (cursor === -1) continue

    const firstTemplateEnd = cursor

    // find next <script> or <style> or end of file
    const nextScript = content.indexOf('<script', firstTemplateEnd)
    const nextStyle = content.indexOf('<style', firstTemplateEnd)
    let nextBoundary = content.length
    if (nextScript !== -1 && nextStyle !== -1) nextBoundary = Math.min(nextScript, nextStyle)
    else if (nextScript !== -1) nextBoundary = nextScript
    else if (nextStyle !== -1) nextBoundary = nextStyle

    const between = content.slice(firstTemplateEnd, nextBoundary)
    if (between.trim().length > 0) {
      candidates.push({ file, start: firstTemplateEnd, end: nextBoundary, excerpt: between.slice(0, 200).replace(/\n/g, '\n') })
    }
  }

  if (candidates.length === 0) {
    console.log('No extraneous markup after first <template> found.')
    return
  }

  console.log(`${candidates.length} files contain markup between first </template> and the next script/style tag:`)
  for (const c of candidates) {
    console.log(`\n--- ${c.file} ---\n${c.excerpt}\n`)
  }

  if (!apply) {
    console.log('\nDry-run. Re-run with --apply to strip extraneous markup between template and script/style.')
    return
  }

  for (const c of candidates) {
    const content = fs.readFileSync(c.file, 'utf8')
    const newContent = content.slice(0, c.start) + content.slice(c.end)
    fs.writeFileSync(c.file, newContent, 'utf8')
    console.log('Stripped extraneous content from', c.file)
  }
}

run().catch(err => { console.error(err); process.exit(1) })
