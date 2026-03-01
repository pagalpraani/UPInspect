# UPInspect

> Decode. Verify. Pay Safely.

A privacy-first UPI QR code inspection and payment link generator.  
Runs 100% locally in the browser — no server, no tracking, no data collection.

🌐 **Live:** [upinspect.pages.dev](https://upinspect.pages.dev)

---

## What It Does

Most UPI QR scans blindly redirect you to a payment app with no chance to verify the details. UPInspect adds a transparent step in between:

**Scan → Inspect → Choose → Pay**

- **Decode & Inspect** — Extract and view the UPI ID, merchant name, and requested amount from any QR code before paying
- **Scan or Upload** — Use your device camera for live scanning, or upload a saved QR screenshot from your gallery
- **Flexible Payments** — Tap "Pay Now" to open your preferred UPI app, or copy the UPI ID for manual high-value transfers
- **Create & Share** — Generate custom UPI payment links and professional QR standee cards
- **100% On-Device** — Your scanned codes and payment data never leave your browser

---

## Project Structure

```
upinspect/
├── index.html                  ← Single-page app shell (all views inline)
├── LICENSE                     ← MIT License
├── _redirects                  ← Cloudflare Pages SPA routing rule
├── wrangler.jsonc              ← Cloudflare Workers config
│
├── assets/
│   └── favicon/
│       ├── favicon.svg         ← SVG icon (scalable)
│       ├── favicon.ico         ← Multi-size ICO (16/32/48px)
│       ├── favicon-32.png      ← PNG fallback
│       ├── apple-touch-icon.png← iOS home screen (180px)
│       ├── icon-192.png        ← Android PWA icon
│       ├── icon-512.png        ← Android PWA splash + OG image
│       └── site.webmanifest    ← PWA manifest
│
├── css/
│   ├── tokens.css              ← Design tokens (CSS variables) & reset
│   ├── animations.css          ← Keyframe animations
│   ├── layout.css              ← Body, container, top-bar, bottom-nav, views
│   ├── components.css          ← Shared UI: cards, inputs, buttons, tabs, toast
│   └── views.css               ← Per-view styles: Home, Scanner, Standee, About
│
└── js/
    ├── main.js                 ← Entry point: boot, URL routing, global bridge
    ├── state.js                ← Shared state & constants (no language state)
    ├── router.js               ← App view switching & tab routing
    ├── ui.js                   ← Toast notifications & theme toggle
    ├── scanner.js              ← Camera scanning & file-upload QR reading
    ├── extractor.js            ← Extracted card rendering, copy & pay actions
    ├── generator.js            ← QR card & payment link generation
    ├── share.js                ← Standee PNG export via native canvas (no html2canvas)
    ├── paylink.js              ← Payment link page logic
    ├── i18n.js                 ← Language loader, t() helper, applyLanguage()
    └── locales/
        ├── en.js               ← English strings (98 keys)
        └── hi.js               ← Hindi strings (98 keys)
```

---

## Multi-Language Support

UPInspect supports English and Hindi with a modular locale system. Adding a new language takes 3 steps:

**1. Create the locale file**

```
js/locales/mr.js   ← copy en.js, translate all values, keep all keys identical
```

**2. Register it in `js/i18n.js`**

```js
import mr from './locales/mr.js';

const LOCALES = { en, hi, mr };       // add to registry
const CYCLE   = ['en', 'hi', 'mr'];   // add to toggle cycle
```

**3. Done.** The toggle button cycles through all languages automatically.

### How translations work

| Mechanism | Usage |
|---|---|
| `id` matching | `<span id="txtNavHome">` — updated by key lookup |
| `data-i18n` | `<span data-i18n="txtOptional">` — for nested text nodes |
| `data-i18n-placeholder` | `<input data-i18n-placeholder="txtLabelUpiId">` |
| `data-i18n-label` | `<label data-i18n-label="txtLabelName">` — updates text node only, preserves child elements |

In JS files, always use `t('key')` for translated strings — never hardcode `state.currentLang === 'en' ? ... : ...` ternaries. Language state lives in `i18n.js` only, accessed via `getLang()`.

---

## Payment Link URLs

UPInspect uses clean path-based URLs for shareable payment links:

```
https://upinspect.pages.dev/{upi-id}/{name}/{amount}

# Examples
https://upinspect.pages.dev/rahul@upi/Rahul%20Traders/500
https://upinspect.pages.dev/shop@okaxis/My%20Shop
```

| Segment | Required | Description |
|---|---|---|
| `upi-id` | ✅ | UPI ID (e.g. `name@upi`) — `@` is kept readable |
| `name` | Optional | Merchant or payee name |
| `amount` | Optional | Pre-filled amount in ₹ |

When opened, the link shows a verified payment card with **Pay Now** and **Copy UPI ID** options. No app install required.

---

## Running Locally

Because the JS uses ES modules (`type="module"`), you need a local HTTP server — opening `index.html` as a `file://` URL will cause CORS errors on module imports.

```bash
# Python (built-in)
python3 -m http.server 8080

# Node
npx serve .

# VS Code
# Install "Live Server" extension → click "Go Live"
```

Then open `http://localhost:8080` in your browser.

---

## Deploying to Cloudflare Pages

1. Push the repo to GitHub
2. Connect it to [Cloudflare Pages](https://pages.cloudflare.com)
3. Set build command to **none**, output directory to **`/`** (repo root)
4. The `_redirects` file handles SPA routing automatically:
   ```
   /* /index.html 200
   ```

---

## Third-party Libraries

| Library | Version | Purpose |
|---|---|---|
| [html5-qrcode](https://github.com/mebjas/html5-qrcode) | latest | Camera & file QR scanning |
| [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) | 1.5.0 | Styled QR code canvas rendering |
| [html2canvas](https://html2canvas.hertzen.com) | 1.4.1 | Loaded but unused — standee export uses native canvas |

> **Note on image export:** The standee save/share flow bypasses html2canvas entirely. It draws the card natively onto a `<canvas>` using the exact colours and layout from `views.css`, then composites the QR via `ctx.drawImage()` reading the full 1200×1200 source pixels directly. This produces a crisp, pixel-perfect 3× PNG with no blur.

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Samsung Internet |
|---|---|---|---|---|
| QR Camera Scan | ✅ | ✅ | ✅ | ✅ |
| File Upload Scan | ✅ | ✅ | ✅ | ✅ |
| Save Image | ✅ | ✅ | ✅ | ✅ |
| Native Share (files) | ✅ | ❌ | ✅ | ✅ |
| PWA Install | ✅ | ❌ | ✅ | ✅ |

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
