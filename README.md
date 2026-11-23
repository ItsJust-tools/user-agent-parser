# User-Agent Parser

Paste a User-Agent string and instantly see the browser, engine, operating system and device class it describes — with bot detection and shareable links.

**Live:** [user-agent-parser.itsjust.tools](https://user-agent-parser.itsjust.tools)

## Features

- Live parsing of any User-Agent string: browser name and version, rendering engine, OS and version
- Device classification: desktop, mobile or tablet
- Bot, crawler and automation detection with a dedicated warning notice
- Pretty-printed JSON summary with copy-to-clipboard
- One-click presets for common real-world User-Agents (Chrome, Firefox, Safari, Edge, Android, Googlebot, curl, Headless Chrome)
- "Use my user agent" button prefills your current browser's User-Agent
- Shareable state via URL, `.itsjust.json` import/export and image/PDF export
- Saved parse history with copy support
- 100% client-side — no data ever leaves your browser

## Keyboard shortcuts

| Key | Action            |
| --- | ----------------- |
| `P` | Use my user agent |
| `C` | Copy JSON summary |
| `X` | Clear input       |

## Development

```bash
npm install
npm run build -w @itsjust/core   # build shared core first
npm run dev
npm test
```

## Deployment

```bash
docker build -t itsjust-user-agent-parser .
docker run -p 3000:3000 itsjust-user-agent-parser
```

## License

MIT
