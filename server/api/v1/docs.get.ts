export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verbatims API v1 — Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .banner {
      background: #0C0A09;
      color: #FAFAF9;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #292524;
    }
    .banner h1 { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }
    .banner span { font-size: 13px; color: #A8A29E; }
    .banner a { color: #3C82F6; text-decoration: none; font-size: 13px; }
    .banner a:hover { text-decoration: underline; }
    redoc { display: block; }
  </style>
</head>
<body>
  <div class="banner">
    <div>
      <h1>Verbatims API v1</h1>
      <span>REST API for quotes, authors, references, and collections</span>
    </div>
    <div>
      <a href="/api/v1/openapi.json" target="_blank">OpenAPI JSON</a>
    </div>
  </div>
  <div id="redoc-container"></div>

  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  <script>
    Redoc.init('/api/v1/openapi.json', {
      scrollYOffset: 56,
      hideDownloadButton: true,
      expandResponses: '200,201',
      theme: {
        colors: {
          primary: { main: '#3C82F6' },
          success: { main: '#22C55E' },
          warning: { main: '#FAA533' },
          error: { main: '#EF4444' },
        },
        sidebar: {
          backgroundColor: '#FAFAF9',
          textColor: '#292524',
        },
        rightPanel: {
          backgroundColor: '#0C0A09',
        },
      },
    }, document.getElementById('redoc-container'));
  </script>
</body>
</html>`
})
