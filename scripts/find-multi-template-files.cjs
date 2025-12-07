#!/usr/bin/env node
const fs = require('fs')
const fg = require('fast-glob')

async function run() {
  const files = await fg(['**/*.vue', '!**/node_modules/**', '!**/.git/**', '!**/.nuxt/**'])
  const problemFiles = []

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    // Find the first root template block in the SFC (if any)
    const firstOpen = content.indexOf('<template')
    if (firstOpen === -1) continue

    const firstOpenEnd = content.indexOf('>', firstOpen)
    if (firstOpenEnd === -1) continue

    // match nested <template> tags inside the first block
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

    // If we find any additional <template> after the first template's closing, it's a second root-level template
    const secondOpen = content.indexOf('<template', firstTemplateEnd)
    if (secondOpen !== -1) problemFiles.push({ file, secondOpen })
  }

  if (problemFiles.length === 0) {
    console.log('No files with >1 top-level <template> found.')
    return
  }

  console.log('Files with multiple top-level <template> blocks:')
  for (const p of problemFiles) console.log(` - ${p.file} (${p.topCount} top-level templates)`)
}

run().catch(e => { console.error(e); process.exit(1) })
