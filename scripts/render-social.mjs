import { constants } from 'node:fs'
import { access, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const templatesDirectory = path.join(repoRoot, 'docs/design/social/templates')
const supportedTemplates = ['author', 'reference', 'theme']
const argumentsList = process.argv.slice(2)

function printUsage() {
  console.log(`Usage:
  bun run social:render -- <content.json>
  bun run social:render -- --template <${supportedTemplates.join('|')}> <content.json>

The template is inferred from content.json unless --template is provided.`)
}

let selectedTemplate
let dataArgument

for (let index = 0; index < argumentsList.length; index += 1) {
  const argument = argumentsList[index]

  if (argument === '--help' || argument === '-h') {
    printUsage()
    process.exit(0)
  }

  if (argument === '--template') {
    selectedTemplate = argumentsList[index + 1]
    index += 1
    continue
  }

  if (argument.startsWith('--template=')) {
    selectedTemplate = argument.slice('--template='.length)
    continue
  }

  if (argument.startsWith('-')) {
    throw new Error(`Unknown option "${argument}". Use --help to see available options.`)
  }

  if (dataArgument) {
    throw new Error('Only one content JSON file can be rendered at a time.')
  }

  dataArgument = argument
}

if (!dataArgument) {
  printUsage()
  process.exit(1)
}

const dataPath = path.resolve(process.cwd(), dataArgument)
const data = JSON.parse(await readFile(dataPath, 'utf8'))
const templateName = selectedTemplate ?? data.template
if (!supportedTemplates.includes(templateName)) {
  throw new Error(`Unknown template "${templateName}". Expected one of: ${supportedTemplates.join(', ')}.`)
}
if (selectedTemplate && data.template !== selectedTemplate) {
  throw new Error(`Content declares template "${data.template}", but --template selects "${selectedTemplate}".`)
}

function requireText(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`)
  }
  return value
}

const title = requireText(data.title, 'title')
const imageUrl = new URL(requireText(data.image?.src, 'image.src'))
if (!['http:', 'https:'].includes(imageUrl.protocol)) {
  throw new Error('image.src must use http or https.')
}
const imageAlt = requireText(data.image?.alt, 'image.alt')
const imagePosition = data.image.position ?? 'center center'
if (!/^(?:center|left|right|\d+(?:\.\d+)?%)(?:\s+(?:center|top|bottom|\d+(?:\.\d+)?%))?$/.test(imagePosition)) {
  throw new Error(`Unsupported image.position "${imagePosition}".`)
}
if (data.date !== undefined && (typeof data.date !== 'string' || !data.date.trim())) {
  throw new Error('date must be a non-empty string when provided.')
}
if (data.phrase !== undefined && (typeof data.phrase !== 'string' || !data.phrase.trim())) {
  throw new Error('phrase must be a non-empty string when provided.')
}
if (!data.output || !/^[\w-]+\.html$/.test(data.output.html ?? '') || !/^[\w-]+\.png$/.test(data.output.png ?? '')) {
  throw new Error('output.html and output.png must be simple filenames ending in .html and .png.')
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character])

const templatePath = path.join(templatesDirectory, `${templateName}.html`)
const template = await readFile(templatePath, 'utf8')
const outputDirectory = path.dirname(dataPath)
const htmlPath = path.join(outputDirectory, data.output.html)
const pngPath = path.join(outputDirectory, data.output.png)
const phraseHtml = data.phrase ? `<p class="phrase">${escapeHtml(data.phrase)}</p>` : ''
const values = {
  DOCUMENT_TITLE: escapeHtml(title),
  TITLE: escapeHtml(title),
  IMAGE_SRC: escapeHtml(imageUrl.href),
  IMAGE_ALT: escapeHtml(imageAlt),
  IMAGE_POSITION: imagePosition,
  DATE_HIDDEN: data.date ? '' : ' hidden',
  DATE: data.date ? escapeHtml(data.date) : '',
  PHRASE_HTML: phraseHtml,
  HEADLINE: escapeHtml(data.headline ?? `Discover our ${title} theme`)
}

const html = template.replace(/\{\{\{([A-Z_]+)\}\}\}|\{\{([A-Z_]+)\}\}/g, (match, rawKey, escapedKey) => {
  const key = rawKey ?? escapedKey
  if (!(key in values)) throw new Error(`Missing template value "${key}".`)
  return values[key]
})
if (/\{\{\{?[A-Z_]+\}\}\}?/.test(html)) {
  throw new Error('The rendered HTML still contains an unfilled template placeholder.')
}
await writeFile(htmlPath, html)

async function findChromeExecutable() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_BIN,
    puppeteer.executablePath(),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK)
      return candidate
    } catch {
      // Try the next known browser location.
    }
  }

  throw new Error('Chrome was not found. Install Puppeteer Chrome or set PUPPETEER_EXECUTABLE_PATH.')
}

const browser = await puppeteer.launch({ headless: true, executablePath: await findChromeExecutable() })
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1200, height: 1200, deviceScaleFactor: 1 })
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0', timeout: 45000 })
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map(image => image.decode()))
  })
  const failedImages = await page.evaluate(() => [...document.images]
    .filter(image => !image.complete || image.naturalWidth === 0)
    .map(image => image.currentSrc || image.src))
  if (failedImages.length) throw new Error(`Images failed to load:\n${failedImages.join('\n')}`)

  await page.screenshot({ path: pngPath, type: 'png' })
} finally {
  await browser.close()
}

console.log(`Rendered ${path.relative(repoRoot, htmlPath)}`)
console.log(`Rendered ${path.relative(repoRoot, pngPath)} (1200 × 1200)`)
