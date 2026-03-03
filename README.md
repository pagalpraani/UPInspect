# 🔍 UPInspect

> **Decode. Verify. Pay Safely.**

A privacy-first UPI QR code inspector and payment link generator.  
Runs 100% locally in the browser — no server, no tracking, no data collection.

🌐 **Live:** [upinspect.pages.dev](https://upinspect.pages.dev)

---

## ✨ What It Does

Most UPI QR scans blindly redirect you to a payment app with no chance to verify the details. UPInspect adds a transparent step in between:

**Scan → Inspect → Choose → Pay**

* **Decode & Inspect** — Extract and view the UPI ID, merchant name, and requested amount from any QR code before paying.
* **Scan or Upload** — Use your device camera for live scanning, or upload a saved QR screenshot from your gallery.
* **Torch Toggle** — Built-in torch control for scanning in low-light environments (on supported devices).
* **Flexible Payments** — Tap "Pay Now" to open your preferred UPI app, or copy the UPI ID for manual high-value transfers.
* **Editable Amount** — Modify the pre-filled amount on scanned QR codes before paying.
* **Create & Share** — Generate custom UPI payment links and professional QR standee cards.
* **Shareable Links** — Every standee share includes a tappable payment link so recipients can pay without scanning.
* **100% On-Device** — Your scanned codes and payment data never leave your browser.

---

## 🛡️ Security First

* **URI injection blocked:** `Number()` (not `parseFloat()`) is used to parse amounts. `Number('100&pa=attacker@upi')` returns `NaN` and is safely rejected.
* **Strict Encoding:** UPI ID and amount are wrapped in `encodeURIComponent()` before being placed in any URI or QR string.
* **Amount validation:** Amounts below ₹1 are silently omitted from QR codes and payment links.
* **No network requests:** All QR decoding, generation, and image export happen entirely on-device.

---

## 🛠️ Technical Details & Developer Guide

<details>
  <summary><b>🔗 Payment Link URLs</b></summary>

  UPInspect uses clean path-based URLs for shareable payment links:

  ```text
  [https://upinspect.pages.dev/](https://upinspect.pages.dev/){upi-id}/{name}/{amount}
  
  # Examples
  [https://upinspect.pages.dev/rahul@upi/Rahul%20Traders/500](https://upinspect.pages.dev/rahul@upi/Rahul%20Traders/500)
  [https://upinspect.pages.dev/shop@okaxis/My%20Shop](https://upinspect.pages.dev/shop@okaxis/My%20Shop)
  [https://upinspect.pages.dev/pay@upi/500](https://upinspect.pages.dev/pay@upi/500)
  ```

  | Segment | Required | Description |
  |---|---|---|
  | `upi-id` | ✅ | UPI ID (e.g. `name@upi`) — `@` is kept readable |
  | `name` | Optional | Merchant or payee name |
  | `amount` | Optional | Pre-filled amount in ₹ (numeric segment auto-detected) |

  The router auto-detects whether the second segment is a name or an amount, so both `/pa/500` and `/pa/name/500` resolve correctly.
  
  When opened, the link shows a verified payment card with **Pay Now** and **Copy UPI ID** options. No app install required.
</details>

<details>
  <summary><b>🌍 Multi-Language Support</b></summary>

  UPInspect supports English and Hindi with a modular locale system. Adding a new language takes 3 steps:

  **1. Create the locale file**
  ```text
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

  > **Pro-tip:** In JS files, always use `t('key')` for translated strings — never hardcode `state.currentLang === 'en' ? ... : ...` ternaries. Language state lives in `i18n.js` only, accessed via `getLang()`.
</details>

<details>
  <summary><b>💻 Running Locally & Cloudflare Deployment</b></summary>

  ### Running Locally
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

  ### Deploying to Cloudflare Pages
  1. Push the repo to GitHub
  2. Connect it to [Cloudflare Pages](https://pages.cloudflare.com)
  3. Set build command to **none**, output directory to **`/`** (repo root)
  4. The `_redirects` file handles SPA routing. Asset directories are passed through first, then payment link paths fall through to `index.html`:

  ```text
  /css/* /css/:splat     200
  /js/* /js/:splat      200
  /assets/* /assets/:splat  200
  
  /:seg1             /index.html  200
  /:seg1/:seg2       /index.html  200
  /:seg1/:seg2/:seg3 /index.html  200
  ```
  > *Asset passthrough rules must come before the catch-all rules — Cloudflare matches the first rule that applies.*
</details>

<details>
  <summary><b>📚 Third-Party Libraries & Browser Support</b></summary>

  ### Libraries
  | Library | Version | Purpose |
  |---|---|---|
  | [html5-qrcode](https://github.com/mebjas/html5-qrcode) | latest | Camera QR scanning |
  | [jsQR](https://github.com/cozmo/jsQR) | 1.4.0 | File upload QR decoding (cross-browser, including Firefox) |
  | [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) | 1.5.0 | Styled QR code canvas rendering |
  | [Google Analytics 4](https://analytics.google.com) | — | Anonymous visitor analytics |

  > **Note on image export:** The standee save/share flow uses native canvas compositing — not `html2canvas`. The card is drawn directly onto a `<canvas>` using the exact colours and layout from `views.css`, then the QR is composited via `ctx.drawImage()` reading the full 1200×1200 source pixels directly. This produces a crisp, pixel-perfect 3× PNG with no font re-rasterisation and no blur.
  
  > **Note on file upload scanning:** `html5-qrcode`'s `scanFile()` uses `createImageBitmap()` internally, which behaves inconsistently in Firefox. File uploads are decoded using `jsQR` directly via `canvas.getImageData()` — this works identically across all browsers.

  ### Browser Support
  | Feature | Chrome | Firefox | Safari | Samsung Internet |
  |---|---|---|---|---|
  | QR Camera Scan | ✅ | ✅ | ✅ | ✅ |
  | File Upload Scan | ✅ | ✅ | ✅ | ✅ |
  | Torch Toggle | ✅ | ✅ * | ✅ * | ✅ |
  | Inverted QR (dark mode) | ✅ | ✅ | ✅ | ✅ |
  | Save Image | ✅ | ✅ | ✅ | ✅ |
  | Share with Image | ✅ | ❌ † | ✅ | ✅ |
  | PWA Install | ✅ | ❌ | ✅ | ✅ |
  | OS Theme Detection | ✅ | ✅ | ✅ | ✅ |

  *\* Torch support depends on device hardware capability, not just the browser.* *† Firefox Android does not support file sharing via the Web Share API. Tapping Share downloads the image and opens a text share sheet with the payment link included in the caption.*
</details>

<details>
  <summary><b>📂 Project Structure</b></summary>

  ```text
  upinspect/
  ├── index.html                   ← Single-page app shell (all views inline)
  ├── LICENSE                      ← GPL-3.0 License
  ├── _redirects                   ← Cloudflare Pages SPA routing rules
  ├── wrangler.toml                ← Cloudflare Pages config
  │
  ├── assets/
  │   └── favicon/
  │       ├── favicon.svg          ← SVG icon (scalable, gradient background)
  │       ├── favicon.ico          ← Multi-size ICO (16/32/48px)
  │       ├── favicon-32.png       ← PNG fallback (32px)
  │       ├── favicon-96.png       ← PNG fallback (96px)
  │       ├── apple-touch-icon.png ← iOS home screen (180px, rounded corners)
  │       ├── icon-192.png         ← Android PWA icon (192px, maskable)
  │       ├── icon-512.png         ← Android PWA splash (512px, maskable)
  │       └── site.webmanifest     ← PWA manifest
  │
  ├── css/
  │   ├── tokens.css               ← Design tokens (CSS variables) & reset
  │   ├── animations.css           ← Keyframe animations
  │   ├── layout.css               ← Body, container, top-bar, bottom-nav, views
  │   ├── components.css           ← Shared UI: cards, inputs, buttons, tabs, toast
  │   └── views.css                ← Per-view styles: Home, Scanner, Standee, About
  │
  └── js/
      ├── main.js                  ← Entry point: boot, URL routing, global bridge
      ├── state.js                 ← Shared state & constants
      ├── router.js                ← App view switching & tab routing
      ├── ui.js                    ← Toast notifications, theme toggle (OS preference aware)
      ├── scanner.js               ← Camera scanning, torch toggle, file-upload QR reading
      ├── extractor.js             ← Extracted card rendering, editable amount, copy & pay
      ├── generator.js             ← QR card & payment link generation
      ├── share.js                 ← Standee PNG export via native canvas (no html2canvas)
      ├── paylink.js               ← Payment link landing page logic
      ├── i18n.js                  ← Language loader, t() helper, applyLanguage()
      └── locales/
          ├── en.js                ← English strings (105 keys)
          └── hi.js                ← Hindi strings (105 keys)
  ```
</details>

---

## ⚖️ License

This project is licensed under the GPL-3.0 License — see the [LICENSE](LICENSE) file for details.
