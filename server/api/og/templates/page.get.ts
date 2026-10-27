type OgPageSlug = 'search' | 'presskit' | 'quotes' | 'authors' | 'references' | 'tags' | 'about' | 'privacy' | 'terms' | 'licenses'

const pages: Record<OgPageSlug, { title: string; description: string; frTitle: string; frDescription: string; visual: string }> = {
  search: {
    title: 'Search',
    description: 'Find the quote. Follow its source.',
    frTitle: 'Recherche',
    frDescription: 'Trouvez la citation. Remontez à sa source.',
    visual: 'search',
  },
  presskit: {
    title: 'Press kit',
    description: 'Logos and brand assets, ready to share.',
    frTitle: 'Kit presse',
    frDescription: 'Logos et ressources de marque, prêts à partager.',
    visual: 'presskit',
  },
  quotes: {
    title: 'Quotes',
    description: 'Memorable words, gathered with their sources.',
    frTitle: 'Citations',
    frDescription: 'Des mots mémorables, accompagnés de leurs sources.',
    visual: 'quotes',
  },
  authors: {
    title: 'Authors',
    description: 'Discover the voices behind the words.',
    frTitle: 'Auteurs',
    frDescription: 'Découvrez les voix derrière les mots.',
    visual: 'authors',
  },
  references: {
    title: 'References',
    description: 'Follow every quote back to its source.',
    frTitle: 'Références',
    frDescription: 'Retrouvez la source de chaque citation.',
    visual: 'references',
  },
  tags: {
    title: 'Tags',
    description: 'Explore ideas and themes through quotes.',
    frTitle: 'Thèmes',
    frDescription: 'Explorez des idées et des thèmes à travers les citations.',
    visual: 'tags',
  },
  about: {
    title: 'About Verbatims',
    description: 'A thoughtful home for memorable quotes and their sources.',
    frTitle: 'À propos de Verbatims',
    frDescription: 'Un espace dédié aux citations mémorables et à leurs sources.',
    visual: 'about',
  },
  privacy: {
    title: 'Privacy',
    description: 'A clear account of how Verbatims handles your data.',
    frTitle: 'Confidentialité',
    frDescription: 'Comment Verbatims traite vos données, en toute transparence.',
    visual: 'privacy',
  },
  terms: {
    title: 'Terms of Service',
    description: 'The terms for using Verbatims and sharing its content.',
    frTitle: 'Conditions d’utilisation',
    frDescription: 'Les conditions d’utilisation de Verbatims et de partage de son contenu.',
    visual: 'terms',
  },
  licenses: {
    title: 'Licenses & attribution',
    description: 'License details and credits for third-party work.',
    frTitle: 'Licences et attributions',
    frDescription: 'Licences et crédits des logiciels et ressources utilisés.',
    visual: 'licenses',
  },
}

export default defineEventHandler((event) => {
  const slug = getQuery(event).slug as string | undefined
  if (!slug || !Object.hasOwn(pages, slug)) {
    throwServer(404, 'OG page not found')
    return
  }

  const page = pages[slug as OgPageSlug]
  const locale = getQuery(event).locale === 'fr' ? 'fr' : 'en'
  const title = locale === 'fr' ? page.frTitle : page.title
  const description = locale === 'fr' ? page.frDescription : page.description
  const titleSize = getPageTitleSize(title)
  const visual = getVisual(page.visual, locale)
  const html = `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(`${title} — Verbatims`)}</title>
    <link rel="preload" href="/fonts/fraunces-8bfd3893.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/archivo-97a2c112.woff2" as="font" type="font/woff2" crossorigin>
    <style>
      @font-face {
        font-family: 'Fraunces';
        src: url('/fonts/fraunces-8bfd3893.woff2') format('woff2');
        font-weight: 400 800;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'Archivo';
        src: url('/fonts/archivo-97a2c112.woff2') format('woff2');
        font-weight: 400 700;
        font-style: normal;
        font-display: swap;
      }
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; }
      body {
        background: #FAFAF9;
        color: #0C0A09;
        font-family: 'Archivo', Arial, sans-serif;
      }
      .frame {
        display: flex;
        width: 1200px;
        height: 630px;
        flex-direction: column;
        overflow: hidden;
        padding: 54px 74px 42px;
      }
      .brand {
        font-family: 'Fraunces', Georgia, serif;
        font-size: 30px;
        font-weight: 600;
        letter-spacing: -1px;
      }
      main {
        display: flex;
        flex: 1;
        align-items: center;
        gap: 54px;
        padding: 30px 0;
      }
      .copy {
        width: 43%;
        flex-shrink: 0;
      }
      .eyebrow {
        margin: 0 0 18px;
        color: #78716C;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        font-family: 'Fraunces', Georgia, serif;
        font-size: ${titleSize}px;
        font-weight: 550;
        letter-spacing: -0.045em;
        line-height: 0.98;
        overflow-wrap: anywhere;
      }
      .description {
        max-width: 430px;
        margin: 22px 0 0;
        color: #57534E;
        font-size: 22px;
        line-height: 1.4;
      }
      .visual {
        display: flex;
        min-width: 0;
        flex: 1;
        flex-direction: column;
        justify-content: center;
        border-left: 1px solid #D6D3D1;
        padding-left: 48px;
      }
      .search-field {
        display: flex;
        height: 60px;
        align-items: center;
        gap: 18px;
        color: #78716C;
        font-size: 22px;
      }
      .search-icon {
        width: 27px;
        height: 27px;
        flex-shrink: 0;
        color: #78716C;
      }
      .logo-preview {
        display: flex;
        align-items: center;
        flex-direction: column;
        gap: 18px;
      }
      .logo-mark {
        display: grid;
        width: 224px;
        height: 224px;
        place-items: center;
        border-radius: 50%;
        background: #E8E5DC;
      }
      .logo-mark img {
        display: block;
        width: 148px;
        height: 148px;
        object-fit: contain;
      }
      .logo-caption {
        margin: 0;
        color: #78716C;
        font-size: 15px;
        letter-spacing: 0.02em;
      }
      .sample-quote { padding: 30px 0 30px 8px; }
      .quote-mark { color: #A8A29E; font-family: 'Fraunces', Georgia, serif; font-size: 66px; line-height: 0.7; }
      .sample-quote p { max-width: 420px; margin: 14px 0 24px; font-family: 'Fraunces', Georgia, serif; font-size: 33px; line-height: 1.18; }
      .sample-caption, .sample-label { color: #78716C; font-size: 12px; font-weight: 600; letter-spacing: 0.11em; }
      .sample-label { margin: 0 0 22px; }
      .sample-list { padding: 24px 0 24px 8px; }
      .sample-row { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; padding: 15px 0; border-bottom: 1px solid #E7E5E4; }
      .sample-row strong { font-family: 'Fraunces', Georgia, serif; font-size: 25px; font-weight: 500; }
      .sample-row span { color: #78716C; font-size: 14px; }
      .sample-tags { display: flex; flex-wrap: wrap; gap: 12px; align-content: center; min-height: 210px; padding-left: 8px; }
      .sample-tags span { padding: 10px 15px; border: 1px solid #D6D3D1; border-radius: 999px; color: #44403C; font-family: 'Fraunces', Georgia, serif; font-size: 23px; }
      .about-mark { display: flex; min-height: 240px; align-items: center; padding-left: 8px; }
      .about-mark span { font-family: 'Fraunces', Georgia, serif; font-size: 46px; line-height: 1.08; }
      .document-mark { display: flex; width: 250px; height: 310px; flex-direction: column; justify-content: center; gap: 16px; margin: auto; padding: 36px; border: 1px solid #D6D3D1; background: #F5F5F4; }
      .document-mark div { width: 100%; height: 1px; background: #D6D3D1; }
      .document-mark div:nth-child(2) { width: 76%; }
      .document-mark div:nth-child(4) { width: 58%; }
      .document-mark span { margin-top: 16px; color: #78716C; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; }
      .privacy-excerpt { width: 350px; margin: auto; padding: 34px 36px; border: 1px solid #D6D3D1; background: #F5F5F4; }
      .privacy-excerpt-label { margin: 0; color: #78716C; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; }
      .privacy-excerpt blockquote { margin: 30px 0 0; font-family: 'Fraunces', Georgia, serif; font-size: 24px; line-height: 1.2; }
      footer {
        color: #78716C;
        font-size: 15px;
        letter-spacing: 0.02em;
      }
    </style>
  </head>
  <body>
    <div class="frame" role="img" aria-label="${escapeHtml(`${title}. ${description}`)}">
      <div class="brand">verbatims</div>
      <main>
        <section class="copy">
          <h1>${escapeHtml(title)}</h1>
          <p class="description">${escapeHtml(description)}</p>
        </section>
        <section class="visual" aria-hidden="true">${visual}</section>
      </main>
      <footer>verbatims.cc</footer>
    </div>
  </body>
</html>`

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=600')
  return html
})

function getSearchVisual(locale: 'en' | 'fr'): string {
  const placeholder = locale === 'fr' ? 'Citation, auteur ou référence' : 'Quote text, author, or reference'
  return `<div class="search-field">
    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8"></circle>
      <path d="m16 16 4.2 4.2"></path>
    </svg>
    <span>${placeholder}</span>
  </div>`
}

function getPresskitVisual(locale: 'en' | 'fr'): string {
  const caption = locale === 'fr' ? 'Le logo de Verbatims · PNG' : 'The Verbatims mark · PNG'
  return `<div class="logo-preview">
    <div class="logo-mark"><img src="/images/v-letter.png" alt=""></div>
    <p class="logo-caption">${caption}</p>
  </div>`
}

function getVisual(kind: string, locale: 'en' | 'fr'): string {
  if (kind === 'search') return getSearchVisual(locale)
  if (kind === 'presskit') return getPresskitVisual(locale)

  const isFrench = locale === 'fr'

  const visuals: Record<string, string> = {
    quotes: `<div class="sample-quote"><span class="quote-mark">“</span><p>${isFrench ? 'Des mots à retenir, avec leurs sources à portée de main.' : 'Words worth keeping, with the source close at hand.'}</p><span class="sample-caption">${isFrench ? 'CITATION · AUTEUR · RÉFÉRENCE' : 'QUOTE · AUTHOR · REFERENCE'}</span></div>`,
    authors: `<div class="sample-list"><p class="sample-label">${isFrench ? 'VOIX DE LA COLLECTION' : 'VOICES IN THE COLLECTION'}</p><div class="sample-row"><strong>Virginia Woolf</strong><span>${isFrench ? 'auteure' : 'author'}</span></div><div class="sample-row"><strong>James Baldwin</strong><span>${isFrench ? 'écrivain' : 'writer'}</span></div><div class="sample-row"><strong>Ursula K. Le Guin</strong><span>${isFrench ? 'auteure' : 'author'}</span></div></div>`,
    references: `<div class="sample-list"><p class="sample-label">${isFrench ? 'SOURCES DES CITATIONS' : 'SOURCES THAT GIVE WORDS CONTEXT'}</p><div class="sample-row"><strong>${isFrench ? 'Livres' : 'Books'}</strong><span>01</span></div><div class="sample-row"><strong>${isFrench ? 'Films' : 'Films'}</strong><span>02</span></div><div class="sample-row"><strong>${isFrench ? 'Discours' : 'Speeches'}</strong><span>03</span></div></div>`,
    tags: `<div class="sample-tags"><span>${isFrench ? 'amour' : 'love'}</span><span>${isFrench ? 'courage' : 'courage'}</span><span>${isFrench ? 'temps' : 'time'}</span><span>${isFrench ? 'espoir' : 'hope'}</span></div>`,
    about: `<div class="about-mark"><span>${isFrench ? 'Des mots,<br>leurs<br>origines.' : 'Words<br>with their<br>origins.'}</span></div>`,
    document: `<div class="document-mark"><div></div><div></div><div></div><div></div><span>VERBATIMS</span></div>`,
    terms: `<div class="privacy-excerpt"><p class="privacy-excerpt-label">${isFrench ? 'EXTRAIT DES CONDITIONS' : 'FROM THE TERMS'}</p><blockquote>“Include author name and source reference when available.”</blockquote></div>`,
    licenses: `<div class="sample-list"><p class="sample-label">${locale === 'fr' ? 'CODE & CRÉDITS' : 'CODE & CREDITS'}</p><div class="sample-row"><strong>MIT</strong><span>${locale === 'fr' ? 'code source' : 'source code'}</span></div><div class="sample-row"><strong>CC BY-SA 4.0</strong><span>OpenMoji</span></div></div>`,
    privacy: `<div class="privacy-excerpt"><p class="privacy-excerpt-label">${locale === 'fr' ? 'NOTRE POLITIQUE' : 'OUR POLICY'}</p><blockquote>${locale === 'fr' ? '« Open source. Pas de profilage. Conçu pour la confidentialité. »' : '“Open source. No profiling. Privacy-first by design.”'}</blockquote></div>`,
  }

  return visuals[kind] || visuals.document || ''
}

function getPageTitleSize(title: string): number {
  if (title.length > 20) return 50
  if (title.length > 14) return 60
  if (title.length > 10) return 72
  return 88
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
