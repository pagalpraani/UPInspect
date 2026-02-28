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
├── _redirects                  ← Cloudflare Pages SPA routing rule
├── LICENSE                     ← Licence 
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
    ├── state.js                ← Shared state object & constants
    ├── i18n.js                 ← Translation strings (EN/HI) & applyLanguage()
    ├── ui.js                   ← Toast notifications & theme toggle
    ├── router.js               ← App view switching & tab routing
    ├── scanner.js              ← Camera scanning & file-upload QR reading
    ├── extractor.js            ← Extracted card rendering & UPI pay/copy actions
    ├── generator.js            ← QR card & payment link generation
    └── share.js                ← Standee PNG export via native canvas rendering
```

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
3. Set build command to **none**, output directory to **`/`** (or repo root)
4. The `_redirects` file handles SPA routing automatically:
   ```
   /* /index.html 200
   ```

---

## Adding a New Language

1. Open `js/i18n.js`
2. Add a new key (e.g. `mr` for Marathi) to the `translations` object with all the same keys as `en`
3. Update `toggleLang()` in `js/main.js` to cycle through the new language
4. Update the `langBtn` label logic in `applyLanguage()` inside `js/i18n.js`

---

## Third-party Libraries

| Library | Version | Purpose |
|---|---|---|
| [html5-qrcode](https://github.com/mebjas/html5-qrcode) | latest | Camera & file QR scanning |
| [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) | 1.5.0 | Styled QR code canvas rendering |
| [html2canvas](https://html2canvas.hertzen.com) | 1.4.1 | Loaded but replaced — standee export now uses native canvas compositing |

> **Note on image export:** The standee save/share flow bypasses html2canvas entirely. It composites the card directly onto a `<canvas>` using native 2D APIs and reads the QR pixel data via `ctx.drawImage()`. This avoids canvas taint security errors and produces a pixel-perfect 3× resolution PNG.

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