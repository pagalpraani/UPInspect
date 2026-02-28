# UPInspect v2.0

> Decode. Verify. Pay with clarity.

A privacy-first UPI QR code inspection and payment link generator.  
Runs 100% locally in the browser — no server, no tracking.

---

## Project Structure

```
upinspect/
├── index.html          ← HTML shell (markup only, no inline JS or CSS)
├── README.md           ← Readme
├── _redirects           ← Redirect for Cloudflare Pages
│
├── css/
│   ├── tokens.css      ← Design tokens (CSS variables) & reset
│   ├── animations.css  ← Keyframe animations
│   ├── layout.css      ← Body, container, top-bar, bottom-nav, views
│   ├── components.css  ← Shared UI: cards, inputs, buttons, tabs, toast
│   └── views.css       ← Per-view styles: Home, Scanner, Standee, About
│
└── js/
    ├── main.js         ← Entry point: boot, URL routing, global bridge
    ├── state.js        ← Shared state object & constants
    ├── i18n.js         ← Translation strings (EN/HI) & applyLanguage()
    ├── ui.js           ← Toast notifications & theme toggle
    ├── router.js       ← App view switching & tab routing
    ├── scanner.js      ← Camera scanning & file-upload QR reading
    ├── extractor.js    ← Extracted card rendering & UPI pay/copy actions
    ├── generator.js    ← QR card & payment link generation
    └── share.js        ← Standee image download & Web Share API
```

---

## Running Locally

Because the JS uses ES modules (`type="module"`), you need a local
HTTP server — simply opening `index.html` as a `file://` URL will
cause CORS errors on the module imports.

```bash
# Python (built-in)
python3 -m http.server 8080

# Node (npx)
npx serve .

# VS Code
Install the "Live Server" extension, then click "Go Live"
```

Then open `http://localhost:8080` in your browser.

---

## Adding a New Language

1. Open `js/i18n.js`
2. Add a new key (e.g. `mr`) to the `translations` object with all the same keys as `en`
3. Update `toggleLang()` in `js/main.js` to cycle through the new language

---

## Third-party Libraries

| Library | Version | Purpose |
|---|---|---|
| html5-qrcode | latest | Camera & file QR scanning |
| qr-code-styling | 1.5.0 | Styled QR code rendering |
| html2canvas | 1.4.1 | Standee PNG export |

---

## License

MIT
