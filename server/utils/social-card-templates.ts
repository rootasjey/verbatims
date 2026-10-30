export const socialCardTemplates = {
  author: String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1200, initial-scale=1">
<title>{{DOCUMENT_TITLE}} — Verbatims social card</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400;1,9..144,500;1,9..144,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../templates/minimal.css">
</head>
<body>
<main class="card" aria-label="Verbatims author card: {{TITLE}}">
  <figure>
    <img src="{{IMAGE_SRC}}" alt="{{IMAGE_ALT}}" style="object-position:{{IMAGE_POSITION}}">
    <span class="wordmark">verbatims</span>
    <div class="copy"><h1>{{TITLE}}</h1><p class="date"{{DATE_HIDDEN}}>{{DATE}}</p>{{{PHRASE_HTML}}}</div>
  </figure>
</main>
</body>
</html>`,
  reference: String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1200, initial-scale=1">
<title>{{DOCUMENT_TITLE}} — Verbatims social card</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400;1,9..144,500;1,9..144,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../templates/minimal.css">
</head>
<body>
<main class="card" aria-label="Verbatims work card: {{TITLE}}">
  <figure>
    <img src="{{IMAGE_SRC}}" alt="{{IMAGE_ALT}}" style="object-position:{{IMAGE_POSITION}}">
    <span class="wordmark">verbatims</span>
    <div class="copy"><h1>{{TITLE}}</h1><p class="date"{{DATE_HIDDEN}}>{{DATE}}</p>{{{PHRASE_HTML}}}</div>
  </figure>
</main>
</body>
</html>`,
  theme: String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1200, initial-scale=1">
<title>{{DOCUMENT_TITLE}} — Verbatims theme</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400;1,9..144,500;1,9..144,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../templates/theme.css">
</head>
<body>
<main class="card" aria-label="Verbatims theme card: {{TITLE}}">
  <img class="artwork" src="{{IMAGE_SRC}}" alt="{{IMAGE_ALT}}" style="object-position:{{IMAGE_POSITION}}">
  <section class="copy">
    <h1>{{HEADLINE}}</h1>
    <p class="date"{{DATE_HIDDEN}}>{{DATE}}</p>
    <p class="wordmark">verbatims.cc</p>
  </section>
</main>
</body>
</html>`
} as const

export const minimalCardStyles = String.raw`:root { --stone:#d1d0c5; --paper:#f0eee6; }
* { box-sizing:border-box; }
html,body { width:1200px; height:1200px; margin:0; overflow:hidden; }
body { background:var(--stone); color:var(--paper); font-family:Archivo,Arial,sans-serif; -webkit-font-smoothing:antialiased; }
.card { position:relative; width:1200px; height:1200px; padding:32px; }
figure { position:relative; width:100%; height:100%; margin:0; overflow:hidden; border-radius:28px; background:#272822; }
figure img { display:block; width:100%; height:100%; object-fit:cover; object-position:center center; filter:grayscale(1) brightness(.88); }
figure:after { content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgb(18 19 16 / 28%) 0%, transparent 25%, transparent 53%, rgb(18 19 16 / 22%) 68%, rgb(18 19 16 / 82%) 100%); pointer-events:none; }
.wordmark { position:absolute; z-index:1; top:56px; left:58px; font:italic 600 36px/1 Fraunces,Georgia,serif; letter-spacing:-.06em; color:#fffdf6; text-shadow:0 1px 12px rgb(0 0 0 / 24%); }
.copy { position:absolute; z-index:1; left:62px; right:62px; bottom:62px; }
h1 { margin:0; font:500 92px/.98 Fraunces,Georgia,serif; letter-spacing:-.055em; color:#fffdf6; text-shadow:0 2px 18px rgb(0 0 0 / 24%); }
.date { margin:8px 0 0; color:rgb(255 253 246 / 72%); font-size:16px; line-height:1.25; letter-spacing:.08em; text-transform:uppercase; text-shadow:0 1px 10px rgb(0 0 0 / 35%); }
.phrase { margin:10px 0 0; font-size:26px; line-height:1.35; letter-spacing:.005em; color:rgb(255 253 246 / 88%); text-shadow:0 1px 10px rgb(0 0 0 / 35%); }`

export const themeCardStyles = String.raw`:root {
  --paper: #f8f7f4;
  --ink: #201d1a;
  --muted: #706c68;
}

* {
  box-sizing: border-box;
}

html,
body {
  width: 1200px;
  height: 1200px;
  margin: 0;
  overflow: hidden;
}

body {
  background: var(--paper);
  color: var(--ink);
  font-family: Archivo, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.card {
  display: flex;
  width: 1200px;
  height: 1200px;
  padding: 32px;
  flex-direction: column;
}

.artwork {
  display: block;
  width: 100%;
  height: 930px;
  flex: 0 0 930px;
  border-radius: 28px;
  background: #ddd9d2;
  object-fit: cover;
}

.copy {
  display: flex;
  min-height: 0;
  padding: 18px 48px 0;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

h1 {
  display: -webkit-box;
  max-width: 100%;
  margin: 0;
  overflow: hidden;
  font: 500 58px/1.05 Fraunces, Georgia, serif;
  letter-spacing: -.045em;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.date {
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 28px;
  line-height: 1.2;
  letter-spacing: .08em;
}

.wordmark {
  margin: 22px 0 0;
  color: #625e5a;
  font-size: 19px;
  line-height: 1;
  letter-spacing: .16em;
}

.date[hidden] {
  display: none;
}`
