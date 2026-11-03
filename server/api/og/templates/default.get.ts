export default defineEventHandler((event) => {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=1200, initial-scale=1">
    <title>Verbatims</title>
    <link rel="preload" href="/fonts/fraunces-8bfd3893.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="/fonts/poetsenone-cbe208f0.woff2" as="font" type="font/woff2" crossorigin>
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
        font-family: 'Poetsen One';
        src: url('/fonts/poetsenone-cbe208f0.woff2') format('woff2');
        font-weight: 400;
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
      body { background: #FAFAF9; color: #0C0A09; }
      .frame {
        display: flex;
        width: 1200px;
        height: 630px;
        align-items: center;
        flex-direction: column;
        justify-content: center;
        gap: 18px;
      }
      .brand {
        font-family: 'Poetsen One', sans-serif;
        font-size: 112px;
        font-weight: 700;
        font-style: italic;
        letter-spacing: 0.1rem;
        line-height: 1.1;
      }
      .tagline {
        color: #57534E;
        font-family: 'Fraunces', Georgia, serif;
        font-size: 22px;
        font-weight: 500;
        line-height: 1.4;
      }
    </style>
  </head>
  <body>
    <div class="frame" role="img" aria-label="Verbatims">
      <span class="brand">verbatims</span>
      <span class="tagline">Share memorable quotes with their sources</span>
    </div>
  </body>
</html>`

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=600')
  return html
})
