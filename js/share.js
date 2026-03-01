// ============================================================
// share.js — Standee export via native canvas compositing
// UPInspect v1.0
//
// Everything is drawn natively on <canvas> using the exact
// colours, fonts and dimensions from views.css.
// html2canvas is NOT used — it re-rasterises fonts itself and
// produces slightly blurry text. Native canvas uses the
// browser's own font renderer at full resolution.
// The QR is drawn via ctx.drawImage() reading all 1200×1200
// native pixels from the same-origin canvas — zero upscaling.
// ============================================================

import { showMessage } from './ui.js';
import { t }           from './i18n.js';

const $ = id => document.getElementById(id);

// ─── Design constants (mirrors views.css exactly) ──────────

const C = {
  // Card
  bg:           '#FFFFFF',
  border:       '#E2E8F0',
  radius:       16,
  padH:         24,   // horizontal padding
  padTop:       24,
  padBot:       20,

  // Logo
  iconBg:       '#0A2463',
  iconRadius:   6,
  iconSize:     24,
  brandColor:   '#0A2463',
  brandFont:    "700 0.9rem 'Space Mono', monospace",

  // Name
  nameColor:    '#1E3A8A',
  nameFont:     "800 1.25rem 'DM Sans', sans-serif",

  // UPI ID
  upiColor:     '#64748B',
  upiFont:      "600 0.82rem 'Space Mono', monospace",

  // Amount
  amountColor:  '#0F172A',
  amountFont:   "800 1.2rem 'DM Sans', sans-serif",

  // QR box
  qrBorder:     '#F1F5F9',
  qrRadius:     12,
  qrPad:        10,
  qrBorderW:    2,

  // Footer
  dividerColor: '#E2E8F0',
  appsColor:    '#64748B',
  appsFont:     "600 0.75rem 'DM Sans', sans-serif",
  promptColor:  '#10B981',
  promptFont:   "700 0.88rem 'DM Sans', sans-serif",
};

// ─── Core renderer ─────────────────────────────────────────

/**
 * Draws the complete standee card onto a native canvas.
 * Uses exact CSS values — no html2canvas, no blur.
 * @returns {Promise<Blob>}
 */
async function getCardBlob() {
  const qrCanvas = $('cardQrCode').querySelector('canvas');
  if (!qrCanvas) throw new Error('QR not generated yet.');

  // Wait for web fonts so measureText() and fillText() are accurate
  await document.fonts.ready;

  const S = 3; // output scale — 3× of the 320px card = 960px wide

  // ── Read live DOM values ────────────────────────────────
  const name   = $('standeeName').textContent.trim()  || t('txtStandeeDefault');
  const upiId  = $('standeeUpiId').textContent.trim();
  const amount = $('standeeAmount').textContent.trim();

  const upiApps  = $('txtUpiApps').textContent.trim();
  const scanText = $('txtScanPrompt').textContent.trim();

  // ── Scale all CSS px values by S ───────────────────────
  const sc = v => Math.round(v * S);

  // Card inner width = 320px (max-width of .standee-outer) - 2×24px pad
  const CARD_W  = 320;
  const INNER_W = CARD_W - C.padH * 2;   // 272px

  // We'll compute card height dynamically as we lay out sections
  // First pass: measure all text heights

  const canvas  = document.createElement('canvas');
  const ctx     = canvas.getContext('2d');
  // Temporarily set a large canvas to measure text
  canvas.width  = sc(CARD_W);
  canvas.height = 2000;

  // ── Font helpers ───────────────────────────────────────
  const setFont = (f) => {
    // Scale the font size within the shorthand string
    ctx.font = f.replace(/([\d.]+)(rem|px)/, (_, n, u) => {
      const px = u === 'rem' ? parseFloat(n) * 16 : parseFloat(n);
      return `${Math.round(px * S)}px`;
    });
  };

  const textLines = (text, maxW) => {
    // Wrap text into lines that fit maxW (already scaled)
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  // ── Layout: measure everything ─────────────────────────
  const LH_NAME   = sc(1.25 * 16 * 1.3);  // line height ≈ font-size × 1.3
  const LH_UPI    = sc(0.82 * 16 * 1.4);
  const LH_AMT    = sc(1.2  * 16 * 1.3);
  const LH_APPS   = sc(0.75 * 16 * 1.4);
  const LH_PROMPT = sc(0.88 * 16 * 1.4);

  setFont(C.nameFont);
  const nameLines = textLines(name, sc(INNER_W));
  const nameH = nameLines.length * LH_NAME + sc(4); // margin-bottom: 4px

  setFont(C.upiFont);
  const upiLines = textLines(upiId, sc(INNER_W));
  const upiH = upiLines.length * LH_UPI + sc(4);

  const amtH = amount ? LH_AMT + sc(2) : 0;

  // QR visual size on the export (maps full 1200px QR canvas)
  const QR_VISUAL = sc(200 + C.qrPad * 2 + C.qrBorderW * 2); // 200px display + padding + border

  // Section heights
  const logoRowH  = sc(C.iconSize + 16);   // icon + margin-bottom:16px
  const headerH   = nameH + upiH + amtH + sc(16); // margin-bottom:16px
  const qrBoxH    = QR_VISUAL;
  const footerH   = sc(20 + 2 + 14) + LH_APPS + sc(6) + LH_PROMPT; // mt+border+pt + content

  const CARD_H = sc(C.padTop) + logoRowH + headerH + qrBoxH + footerH + sc(C.padBot);

  // Resize canvas to final dimensions
  canvas.width  = sc(CARD_W);
  canvas.height = CARD_H;

  // ── Draw card background + border ──────────────────────
  ctx.fillStyle = C.bg;
  roundRect(ctx, 0, 0, sc(CARD_W), CARD_H, sc(C.radius));
  ctx.fill();

  ctx.strokeStyle = C.border;
  ctx.lineWidth   = S; // 1px border × scale
  roundRect(ctx, S * 0.5, S * 0.5, sc(CARD_W) - S, CARD_H - S, sc(C.radius));
  ctx.stroke();

  // ── Draw logo row ──────────────────────────────────────
  let y = sc(C.padTop);
  const cx = sc(CARD_W) / 2;

  // Measure brand text to centre the logo row
  setFont(C.brandFont);
  const brandText  = 'UPInspect';
  const brandW     = ctx.measureText(brandText).width;
  const rowW       = sc(C.iconSize + 7) + brandW; // icon + gap:7px + text
  const rowStartX  = (sc(CARD_W) - rowW) / 2;

  // Icon background box
  const iconX = rowStartX;
  const iconY = y;
  ctx.fillStyle = C.iconBg;
  roundRect(ctx, iconX, iconY, sc(C.iconSize), sc(C.iconSize), sc(C.iconRadius));
  ctx.fill();

  // Icon SVG paths (white, centred in box)
  const iOff   = (sc(C.iconSize) - sc(14)) / 2;
  const iX     = iconX + iOff;
  const iY     = iconY + iOff;
  const cell   = sc(14) / 3; // 3-cell grid
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth   = Math.max(1, Math.round(1.5 * S / 3));
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  // Top-left square
  ctx.beginPath(); roundRect(ctx, iX, iY, cell * 0.9, cell * 0.9, 1); ctx.stroke();
  // Top-right square
  ctx.beginPath(); roundRect(ctx, iX + cell * 1.6, iY, cell * 0.9, cell * 0.9, 1); ctx.stroke();
  // Bottom-left square
  ctx.beginPath(); roundRect(ctx, iX, iY + cell * 1.6, cell * 0.9, cell * 0.9, 1); ctx.stroke();
  // Bottom-right arrow
  ctx.beginPath();
  ctx.moveTo(iX + cell * 1.6,       iY + cell * 1.8);
  ctx.lineTo(iX + cell * 2.5,       iY + cell * 1.8);
  ctx.moveTo(iX + cell * 2.1,       iY + cell * 1.4);
  ctx.lineTo(iX + cell * 2.5,       iY + cell * 1.8);
  ctx.lineTo(iX + cell * 2.1,       iY + cell * 2.2);
  ctx.stroke();

  // Brand text — 'UP' full opacity, 'Inspect' 70%
  const textY    = iconY + (sc(C.iconSize) - sc(0.9 * 16)) / 2;
  const textLeft = rowStartX + sc(C.iconSize + 7);
  setFont(C.brandFont);
  const upW = ctx.measureText('UP').width;
  ctx.fillStyle    = C.brandColor;
  ctx.textBaseline = 'top';
  ctx.textAlign    = 'left';
  ctx.fillText('UP', textLeft, textY);
  ctx.fillStyle    = C.brandColor + 'B3'; // 70% opacity
  ctx.fillText('Inspect', textLeft + upW, textY);

  y += logoRowH;

  // ── Draw header (name / upi / amount) ──────────────────
  setFont(C.nameFont);
  ctx.fillStyle    = C.nameColor;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  for (const line of nameLines) {
    ctx.fillText(line, cx, y);
    y += LH_NAME;
  }
  y += sc(4); // margin-bottom

  setFont(C.upiFont);
  ctx.fillStyle = C.upiColor;
  for (const line of upiLines) {
    ctx.fillText(line, cx, y);
    y += LH_UPI;
  }
  y += sc(4);

  if (amount) {
    setFont(C.amountFont);
    ctx.fillStyle = C.amountColor;
    ctx.fillText(amount, cx, y);
    y += amtH;
  }

  y += sc(16); // header margin-bottom

  // ── Draw QR box ────────────────────────────────────────
  const qrBoxSize = sc(200 + C.qrPad * 2);
  const qrBoxX    = (sc(CARD_W) - qrBoxSize) / 2;

  // Border
  ctx.strokeStyle = C.qrBorder;
  ctx.lineWidth   = sc(C.qrBorderW);
  ctx.fillStyle   = '#FFFFFF';
  roundRect(ctx, qrBoxX, y, qrBoxSize, qrBoxSize, sc(C.qrRadius));
  ctx.fill();
  ctx.stroke();

  // QR pixels — reads all 1200×1200 native pixels directly
  const qrPad = sc(C.qrPad);
  ctx.drawImage(qrCanvas, qrBoxX + qrPad, y + qrPad, qrBoxSize - qrPad * 2, qrBoxSize - qrPad * 2);

  y += qrBoxH;

  // ── Draw footer ────────────────────────────────────────
  // Dashed divider: margin-top:20 + border-top:2 dashed + padding-top:14
  y += sc(20);
  ctx.strokeStyle = C.dividerColor;
  ctx.lineWidth   = sc(2);
  ctx.setLineDash([sc(6), sc(4)]);
  ctx.beginPath();
  ctx.moveTo(sc(C.padH), y);
  ctx.lineTo(sc(CARD_W - C.padH), y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += sc(2) + sc(14);

  setFont(C.appsFont);
  ctx.fillStyle    = C.appsColor;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = `${0.4 * S}px`;
  ctx.fillText(upiApps, cx, y);
  ctx.letterSpacing = '0px';
  y += LH_APPS + sc(6);

  setFont(C.promptFont);
  ctx.fillStyle = C.promptColor;
  ctx.letterSpacing = `${0.2 * S}px`;
  ctx.fillText(scanText, cx, y);
  ctx.letterSpacing = '0px';

  // ── Export ─────────────────────────────────────────────
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('toBlob failed')),
      'image/png'
    )
  );
}

// ─── Utility: roundRect polyfill ───────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

// ─── Download ──────────────────────────────────────────────

export async function downloadStandee() {
  const btn = $('btnDownload');
  if (btn) btn.disabled = true;

  try {
    const blob = await getCardBlob();
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url, download: 'UPInspect-QR.png',
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showMessage(t('msgImageSaved'), 'success');
  } catch (e) {
    console.error('Download error:', e);
    showMessage(t('msgDownloadFailed'), 'error');
  }

  if (btn) btn.disabled = false;
}

// ─── Share ─────────────────────────────────────────────────

export async function shareStandee() {
  const btn = $('btnShare');
  if (btn) btn.disabled = true;

  try {
    const blob = await getCardBlob();
    const file = new File([blob], 'UPInspect-QR.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: 'Scan to Pay', files: [file] });
    } else if (navigator.share) {
      await navigator.share({ title: 'UPInspect QR', text: 'Scan to pay securely' });
    } else {
      await downloadStandee();
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      showMessage(t('msgShareFailed'), 'error');
    }
  }

  if (btn) btn.disabled = false;
}
