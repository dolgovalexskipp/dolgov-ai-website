#!/usr/bin/env node
// Encrypt an HTML page behind a password gate.
// Produces a self-contained static HTML that decrypts client-side via WebCrypto
// (PBKDF2-SHA256 100k iterations + AES-GCM 256).
//
// Usage:
//   node _tools/encrypt-page.js <source.html> <password> <output.html> [--title "Page Title"]

const fs = require('fs');
const path = require('path');
const { webcrypto } = require('crypto');
const crypto = webcrypto;

async function encrypt(plaintext, password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password),
    'PBKDF2', false, ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, ['encrypt']
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  const b64 = (buf) => Buffer.from(buf).toString('base64');
  return { salt: b64(salt), iv: b64(iv), ct: b64(ciphertext) };
}

function renderGate(payload, title) {
  const payloadJson = JSON.stringify(payload);
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>${title}</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%233a754d'/></svg>">
  <style>
    @font-face { font-family: 'Lufga'; src: url('/fonts/Lufga-Regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }
    @font-face { font-family: 'Lufga'; src: url('/fonts/Lufga-SemiBold.woff2') format('woff2'); font-weight: 600; font-display: swap; }
    @font-face { font-family: 'Lufga'; src: url('/fonts/Lufga-Bold.woff2') format('woff2'); font-weight: 700; font-display: swap; }
    :root {
      --paper: #f6f0e6;
      --paper-2: #fdfbf7;
      --ink: #10100f;
      --muted: #67635d;
      --line: rgba(16,16,15,0.09);
      --green-900: #173a28;
      --green-700: #3a754d;
      --green-100: #e7efe8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Lufga', system-ui, sans-serif;
      color: var(--ink); background: var(--paper);
      -webkit-font-smoothing: antialiased;
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
    }
    .card {
      max-width: 420px; width: 100%;
      background: var(--paper-2);
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 40px 36px;
      box-shadow: 0 20px 60px rgba(16,16,15,0.05);
    }
    .kicker {
      display: inline-block;
      font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.18em;
      color: var(--green-900);
      background: var(--green-100);
      padding: 5px 12px;
      border-radius: 999px;
      margin-bottom: 18px;
    }
    h1 {
      font-size: 22px; line-height: 1.25;
      letter-spacing: -0.015em;
      font-weight: 700;
      margin-bottom: 10px;
    }
    p.hint {
      font-size: 14.5px; color: var(--muted);
      line-height: 1.55;
      margin-bottom: 22px;
    }
    label {
      display: block;
      font-size: 12px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.14em;
      color: var(--green-900);
      margin-bottom: 8px;
    }
    input[type="password"] {
      width: 100%;
      padding: 13px 16px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--paper);
      font-family: inherit;
      font-size: 16px;
      color: var(--ink);
      transition: border-color 0.15s, background 0.15s;
    }
    input[type="password"]:focus {
      outline: none;
      border-color: var(--green-700);
      background: #fff;
    }
    button {
      width: 100%;
      margin-top: 14px;
      padding: 14px;
      background: var(--green-900);
      color: var(--paper-2);
      border: none;
      border-radius: 999px;
      font-family: inherit;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, transform 0.15s;
    }
    button:hover { background: #0d2318; }
    button:active { transform: translateY(1px); }
    .err {
      margin-top: 14px;
      padding: 10px 14px;
      background: #fdecec;
      border: 1px solid #f3c6c6;
      border-radius: 10px;
      font-size: 13.5px;
      color: #8f2222;
      display: none;
    }
    .err.show { display: block; }
    .foot {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--line);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--muted);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="kicker">Личный документ</span>
    <h1>Персональная сессия</h1>
    <p class="hint">Страница закрыта паролем. Введите пароль, который пришёл вам в сообщении.</p>
    <form onsubmit="event.preventDefault(); unlock();" autocomplete="off">
      <label for="pwd">Пароль</label>
      <input type="password" id="pwd" autofocus autocomplete="off" spellcheck="false">
      <button type="submit">Открыть</button>
      <div class="err" id="err">Пароль не подошёл. Попробуйте ещё раз.</div>
    </form>
    <div class="foot">Долгов, Эй Ай и партнёры</div>
  </div>

<script>
const PAYLOAD = ${payloadJson};

async function unlock() {
  const pwd = document.getElementById('pwd').value;
  const err = document.getElementById('err');
  err.classList.remove('show');
  if (!pwd) return;

  const b64ToBytes = (s) => {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  };

  const salt = b64ToBytes(PAYLOAD.salt);
  const iv = b64ToBytes(PAYLOAD.iv);
  const ct = b64ToBytes(PAYLOAD.ct);

  try {
    const enc = new TextEncoder();
    const km = await crypto.subtle.importKey('raw', enc.encode(pwd), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      km,
      { name: 'AES-GCM', length: 256 },
      false, ['decrypt']
    );
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    const plaintext = new TextDecoder().decode(plainBuf);
    document.open();
    document.write(plaintext);
    document.close();
  } catch (e) {
    err.classList.add('show');
    document.getElementById('pwd').select();
  }
}
</script>
</body>
</html>
`;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Usage: node encrypt-page.js <source.html> <password> <output.html> [--title "Title"]');
    process.exit(1);
  }
  const [source, password, output] = args;
  let title = 'Личный документ · Долгов, Эй Ай и партнёры';
  const titleIdx = args.indexOf('--title');
  if (titleIdx !== -1 && args[titleIdx + 1]) title = args[titleIdx + 1];

  const sourceAbs = path.resolve(source);
  const outputAbs = path.resolve(output);
  if (!fs.existsSync(sourceAbs)) {
    console.error(`Source not found: ${sourceAbs}`);
    process.exit(1);
  }

  const plaintext = fs.readFileSync(sourceAbs, 'utf-8');
  const payload = await encrypt(plaintext, password);
  const html = renderGate(payload, title);
  fs.writeFileSync(outputAbs, html, 'utf-8');
  console.log(`Encrypted: ${sourceAbs}`);
  console.log(`       → : ${outputAbs}`);
  console.log(`Size    : ${(html.length / 1024).toFixed(1)} KB`);
  console.log(`Password: (not printed — use the one you passed)`);
}

main().catch(e => { console.error(e); process.exit(1); });
