export default defineEventHandler(async (event) => {
  const title = 'Verbatims — Universal Quotes Service'

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <link rel="preload" href="/fonts/b22137e4.woff2" as="font" type="font/woff2" crossorigin>
    <style>
      /* Self-hosted font for reliability in OG rendering */
      @font-face {
        font-family: 'Gambetta';
        src: url('/fonts/b22137e4.woff2') format('woff2'),
             url('/fonts/b41f87c0.ttf') format('truetype');
        font-weight: 400 800;
        font-style: normal;
        font-display: swap;
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        width: 1200px;
        height: 630px;
        background: #000000;
        color: #f8fafc;
        font-family: 'Gambetta', Georgia, 'Times New Roman', serif;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        position: relative;
        overflow: hidden;
      }
      
      .verbatims-stack {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 0;
        position: relative;
      }

      .verbatims-border {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 0;
        height: 100vh;
        border-left: 2.5px dashed #444;
        opacity: 0.7;
      }
      
      .verbatims-text {
        font-size: 140px;
        font-weight: 400;
        letter-spacing: -2px;
        line-height: 0.85;
        text-transform: lowercase;
        color: #f8fafc;
      }
      
      .verbatims-text:nth-child(1) {
        opacity: 1;
      }
      
      .verbatims-text:nth-child(2) {
        opacity: 0.6;
        margin-top: -10px;
      }
        
      .verbatims-text:nth-child(3) {
        opacity: 0.3;
        font-weight: 00;
        margin-top: -15px;
      }
      
      .tagline {
        position: absolute;
        bottom: 60px;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        font-size: 18px;
        font-weight: 400;
        letter-spacing: 3px;
        background: rgba(255, 255, 255, 1.0);
        text-transform: uppercase;
        color: rgba(0, 0, 0, 0.5);
        padding: 6px 12px;
        text-align: center;
      }
      
      /* Subtle accent */
      .accent {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 0;
        border-bottom: 2px dashed #444;
        opacity: 0.7;
      }
    </style>
  </head>
  <body>
    <div class="verbatims-stack" style="position: relative; width: 100%; height: 100%;">
      <div class="verbatims-border" style="left: 120px;"></div>
      <div style="display: flex; flex-direction: column; align-items: center; position: relative; z-index: 1; width: 100%;">
        <div class="verbatims-text">verbatims</div>
        <div class="verbatims-text">verbatims</div>
        <div class="verbatims-text">verbatims</div>
      </div>
      <div class="verbatims-border" style="right: 120px; left: auto;"></div>
    </div>
    
    <div class="tagline">Modern Quotes Service</div>
    <div class="accent"></div>
  </body>
</html>`

  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=600')
  return html
})

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}