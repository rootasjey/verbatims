import { constants } from 'node:fs'
import { access, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const templatesDirectory = path.join(repoRoot, 'docs/design/dribbble/templates')
const supportedTemplates = ['author', 'reference', 'homepage']
const argumentsList = process.argv.slice(2)

function printUsage() {
  console.log(`Usage:
  bun run dribbble:render -- <content.json>
  bun run dribbble:render -- --template <${supportedTemplates.join('|')}> <content.json>

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

if (selectedTemplate && !supportedTemplates.includes(selectedTemplate)) {
  throw new Error(`Unknown template "${selectedTemplate}". Expected one of: ${supportedTemplates.join(', ')}.`)
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

const templatePath = path.join(templatesDirectory, `${templateName}.html`)
const template = await readFile(templatePath, 'utf8')
const outputDirectory = path.dirname(dataPath)
const htmlPath = path.join(outputDirectory, data.output.html)
const pngPath = path.join(outputDirectory, data.output.png)

async function findChromeExecutable() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_BIN,
    puppeteer.executablePath(),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
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

const chromeExecutable = await findChromeExecutable()

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character])

const inlineMarkdown = value => String(value)
  .split('\n')
  .map(line => escapeHtml(line).replace(/\*([^*]+)\*/g, '<em>$1</em>'))
  .join('<br>')

const link = ({ label, url }) => `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`

const iconPaths = {
  'moon-stars': 'M240 96a8 8 0 0 1-8 8h-16v16a8 8 0 0 1-16 0v-16h-16a8 8 0 0 1 0-16h16V72a8 8 0 0 1 16 0v16h16a8 8 0 0 1 8 8m-96-40h8v8a8 8 0 0 0 16 0v-8h8a8 8 0 0 0 0-16h-8v-8a8 8 0 0 0-16 0v8h-8a8 8 0 0 0 0 16m72.77 97a8 8 0 0 1 1.43 8A96 96 0 1 1 95.07 37.8a8 8 0 0 1 10.6 9.06a88.07 88.07 0 0 0 103.47 103.47a8 8 0 0 1 7.63 2.67m-19.39 14.88c-1.79.09-3.59.14-5.38.14A104.11 104.11 0 0 1 88 64c0-1.79 0-3.59.14-5.38a80 80 0 1 0 109.24 109.24Z',
  quill: 'M248 92.68a15.86 15.86 0 0 0-4.69-11.31l-68.68-68.69a16 16 0 0 0-22.63 0l-28.43 28.43l-58 21.77a16.06 16.06 0 0 0-10.22 12.35L32.11 214.68A8 8 0 0 0 40 224a8.4 8.4 0 0 0 1.32-.11l139.44-23.24a16 16 0 0 0 12.35-10.17l21.77-58L243.31 104A15.87 15.87 0 0 0 248 92.68m-69.87 92.19L63.32 204l47.37-47.37a28 28 0 1 0-11.32-11.32L52 192.7L71.13 77.86L126 57.29L198.7 130ZM112 132a12 12 0 1 1 12 12a12 12 0 0 1-12-12m96-15.32L139.31 48l24-24L232 92.68Z',
  flask: 'M221.69 199.77L160 96.92V40h8a8 8 0 0 0 0-16H88a8 8 0 0 0 0 16h8v56.92L34.31 199.77A16 16 0 0 0 48 224h160a16 16 0 0 0 13.72-24.23Zm-110.83-96.52a7.93 7.93 0 0 0 1.14-4.11V40h32v59.14a7.93 7.93 0 0 0 1.14 4.11L183.36 167c-12 2.37-29.07 1.37-51.75-10.11c-15.91-8.05-31.05-12.32-45.22-12.81ZM48 208l28.54-47.58c14.25-1.74 30.31 1.85 47.82 10.72c19 9.61 35 12.88 48 12.88a69.9 69.9 0 0 0 19.55-2.7L208 208Z',
  lightning: 'M215.79 118.17a8 8 0 0 0-5-5.66L153.18 90.9l14.66-73.33a8 8 0 0 0-13.69-7l-112 120a8 8 0 0 0 3 13l57.63 21.61l-14.62 73.25a8 8 0 0 0 13.69 7l112-120a8 8 0 0 0 1.94-7.26M109.37 214l10.47-52.38a8 8 0 0 0-5-9.06L62 132.71l84.62-90.66l-10.46 52.38a8 8 0 0 0 5 9.06l52.8 19.8Z'
}

function renderIcon(name, className = '') {
  if (!Object.hasOwn(iconPaths, name)) {
    throw new Error(`Unknown icon "${name}". Available icons: ${Object.keys(iconPaths).join(', ')}.`)
  }

  const path = iconPaths[name]
  const classAttribute = className ? ` class="${escapeHtml(className)}"` : ''
  return `<svg${classAttribute} viewBox="0 0 256 256" aria-hidden="true" focusable="false"><path fill="currentColor" d="${path}" /></svg>`
}

function authorValues(content) {
  const works = content.selectedWorks
  const workCards = works.map(work => `
              <figure class="book">
                <img src="${escapeHtml(work.image)}" alt="${escapeHtml(work.alt)}">
                <figcaption><strong><em>${escapeHtml(work.title)}</em></strong>${escapeHtml(work.year)}</figcaption>
              </figure>`).join('').trim()
  const workCredits = works.map(work => link({ label: work.creditLabel, url: work.creditUrl })).join(', ')

  return {
    PAGE_TITLE: content.page.title,
    PAGE_ARIA_LABEL: content.page.ariaLabel,
    EDITION: content.page.edition,
    HEADING: content.page.heading,
    DEK: content.page.dek,
    FEATURE_ARIA_LABEL: content.page.featureAriaLabel,
    PORTRAIT_SRC: content.portrait.image,
    PORTRAIT_ALT: content.portrait.alt,
    PORTRAIT_CAPTION: content.portrait.caption,
    AUTHOR_KICKER: content.author.kicker,
    AUTHOR_HEADLINE: content.author.headline,
    AUTHOR_ROLE_HTML: inlineMarkdown(content.author.role),
    AUTHOR_BIO_HTML: inlineMarkdown(content.author.bio),
    QUOTE_ICON_HTML: renderIcon(content.icons.quote, 'quote-icon'),
    QUOTE: content.quote.text,
    ATTRIBUTION_NAME: content.quote.attributionName,
    ATTRIBUTION_DETAIL_HTML: inlineMarkdown(content.quote.attributionDetail),
    SELECTED_WORKS_HTML: workCards,
    PORTRAIT_CREDIT_LABEL: content.credits.portraitLabel,
    PORTRAIT_CREDIT: content.credits.portrait,
    WORK_CREDITS_LABEL: content.credits.worksLabel,
    WORK_CREDITS_HTML: workCredits,
    RIGHTS: content.credits.rights,
    FOOTER_TAGLINE: content.footerTagline
  }
}

function referenceValues(content) {
  const quoteIcons = content.icons.quoteSequence
  if (!Array.isArray(quoteIcons) || quoteIcons.length === 0) {
    throw new Error('reference content.icons.quoteSequence must contain at least one icon name.')
  }

  const voices = content.voices.items.map(voice => `
              <div class="voice${voice.current ? ' current' : ''}">
                <strong>${escapeHtml(voice.name)}</strong>
                <span>${escapeHtml(voice.description)}</span>
              </div>`).join('\n              <span class="voice-arrow" aria-hidden="true">→</span>').trim()

  return {
    PAGE_TITLE: content.page.title,
    PAGE_ARIA_LABEL: content.page.ariaLabel,
    EDITION: content.page.edition,
    HEADING: content.page.heading,
    DEK: content.page.dek,
    FEATURE_ARIA_LABEL: content.page.featureAriaLabel,
    IMAGE_SRC: content.image.src,
    IMAGE_ALT: content.image.alt,
    IMAGE_CAPTION: content.image.caption,
    REFERENCE_KICKER: content.reference.kicker,
    HEADLINE_HTML: content.reference.headlineLines.map(escapeHtml).join('<br>'),
    REFERENCE_ROLE_HTML: inlineMarkdown(content.reference.role),
    REFERENCE_BIO_HTML: inlineMarkdown(content.reference.bio),
    QUOTE_ICON_LABEL: content.icons.quoteGroupLabel,
    QUOTE_ICONS_HTML: quoteIcons.map(name => renderIcon(name)).join('\n              '),
    QUOTE: content.quote.text,
    ATTRIBUTION_NAME: content.quote.attributionName,
    ATTRIBUTION_DETAIL_HTML: inlineMarkdown(content.quote.attributionDetail),
    VOICES_HEADING: content.voices.heading,
    VOICES_HTML: voices,
    IMAGE_CREDIT_LABEL: content.credits.imageLabel,
    IMAGE_CREDIT: content.credits.image,
    FOOTER_TAGLINE: content.footerTagline
  }
}

function homepageValues(content) {
  return {
    PAGE_TITLE: content.page.title,
    PAGE_ARIA_LABEL: content.page.ariaLabel,
    EDITION: content.page.edition,
    HEADING: content.page.heading,
    DEK: content.page.dek,
    HERO_IMAGE_SRC: content.image.src,
    HERO_IMAGE_ALT: content.image.alt,
    CREDIT_LABEL: content.credits.label,
    CREDIT: content.credits.credit,
    RIGHTS: content.credits.rights
  }
}

const valueMaps = {
  author: authorValues,
  reference: referenceValues,
  homepage: homepageValues
}

const valueMap = valueMaps[templateName]?.(data)
if (!valueMap) {
  throw new Error(`No renderer is registered for template "${templateName}".`)
}

const html = template.replace(/\{\{\{([A-Z_]+)\}\}\}|\{\{([A-Z_]+)\}\}/g, (match, rawKey, escapedKey) => {
  const key = rawKey ?? escapedKey
  if (!(key in valueMap)) throw new Error(`Missing template value "${key}".`)
  return rawKey ? valueMap[key] : escapeHtml(valueMap[key])
})

if (/\{\{\{?[A-Z_]+\}\}\}?/.test(html)) {
  throw new Error('The rendered HTML still contains an unfilled template placeholder.')
}

await writeFile(htmlPath, html)

const browser = await puppeteer.launch({ headless: true, executablePath: chromeExecutable })

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 1 })
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0', timeout: 45000 })
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map(image => image.decode()))
  })

  const failedImages = await page.evaluate(() => [...document.images]
    .filter(image => !image.complete || image.naturalWidth === 0)
    .map(image => image.currentSrc || image.src))
  if (failedImages.length) {
    throw new Error(`Images failed to load:\n${failedImages.join('\n')}`)
  }

  await page.screenshot({ path: pngPath, type: 'png' })
} finally {
  await browser.close()
}

console.log(`Rendered ${path.relative(repoRoot, htmlPath)}`)
console.log(`Rendered ${path.relative(repoRoot, pngPath)} (1600 × 1200)`)
