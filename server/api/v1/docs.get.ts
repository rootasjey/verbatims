export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'text/html; charset=utf-8')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verbatims API v1 — Documentation</title>
</head>
<body>
  <div id="scalar-container"></div>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  <script>
    Scalar.createApiReference('#scalar-container', {
      url: '/api/v1/openapi.json',
      darkMode: true,
      layout: 'modern',
      hideDownloadButton: true,
      withDefaultFonts: false,
      theme: 'purple',
    })
  </script>
</body>
</html>`
})
