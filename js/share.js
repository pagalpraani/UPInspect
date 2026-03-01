// ============================================================
// share.js — Standee export via native canvas compositing
// UPInspect v1.0
//
// Draws the complete standee card natively on <canvas> using
// hardcoded layout constants that mirror views.css exactly.
// The QR is composited via ctx.drawImage() — same-origin,
// reads all 1200×1200 native pixels, zero upscaling, zero blur.
// html2canvas is intentionally NOT used (re-rasterises fonts).
// ============================================================

import { showMessage } from './ui.js';
import { t }           from './i18n.js';

const $ = id => document.getElementById(id);

// ─── Canvas renderer ───────────────────────────────────────

async function getCardBlob() {
  const name     = $('standeeName').textContent.trim()  || t('txtStandeeDefault');
  const upiId    = $('standeeUpiId').textContent.trim();
  const amount   = $('standeeAmount').textContent.trim();
  const qrCanvas = $('cardQrCode').querySelector('canvas');

  if (!qrCanvas) throw new Error('QR canvas not found — generate a QR first.');

  // Wait for web fonts so fillText() uses the correct typeface
  await document.fonts.ready;

  const SCALE = 3;
  const CW    = 320 * SCALE;
  const PAD   = 24  * SCALE;
  const RADIUS = 16 * SCALE;

  // ── Row heights (mirrors views.css) ──────────────────
  const LOGO_H    = 24 * SCALE;
  const LOGO_MB   = 16 * SCALE;
  const NAME_H    = 30 * SCALE;
  const UPI_H     = 20 * SCALE;
  const AMT_H     = amount ? 28 * SCALE : 0;
  const AMT_GAP   = amount ? 8  * SCALE : 0;
  const HDR_MB    = 16 * SCALE;
  const QR_PAD    = 10 * SCALE;
  const QR_SIZE   = 200 * SCALE;
  const QR_WRAP_H = QR_SIZE + QR_PAD * 2;
  const FOOTER_MB = 20 * SCALE;
  const FOOTER_PT = 14 * SCALE;
  const APPS_H    = 18 * SCALE;
  const SCAN_H    = 20 * SCALE;

  const CH = PAD + LOGO_H + LOGO_MB
           + NAME_H + 6 * SCALE + UPI_H + AMT_GAP + AMT_H
           + HDR_MB + QR_WRAP_H
           + FOOTER_MB + FOOTER_PT + APPS_H + 6 * SCALE + SCAN_H
           + PAD;

  const cv  = document.createElement('canvas');
  cv.width  = CW;
  cv.height = CH;
  const ctx = cv.getContext('2d');

  // ── Card background + border ─────────────────────────
  ctx.fillStyle = '#FFFFFF';
  rr(ctx, 0, 0, CW, CH, RADIUS); ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth   = 1 * SCALE;
  rr(ctx, 0, 0, CW, CH, RADIUS); ctx.stroke();

  let y = PAD;

  // ── Logo row ─────────────────────────────────────────
  const ICON  = 24 * SCALE;
  const brandText = 'UPInspect';
  ctx.font = `700 ${Math.round(14.4 * SCALE)}px "Space Mono",monospace`;
  const textW = ctx.measureText(brandText).width;
  const gap   = 7 * SCALE;
  const rowW  = ICON + gap + textW;
  const rowX  = (CW - rowW) / 2;

  ctx.fillStyle = '#0A2463';
  rr(ctx, rowX, y, ICON, ICON, 6 * SCALE); ctx.fill();
  drawIcon(ctx, rowX, y, ICON);

  ctx.fillStyle    = '#0A2463';
  ctx.textBaseline = 'middle';
  ctx.textAlign    = 'left';
  ctx.fillText(brandText, rowX + ICON + gap, y + ICON / 2);

  y += LOGO_H + LOGO_MB;

  // ── Merchant name ────────────────────────────────────
  ctx.fillStyle    = '#1E3A8A';
  ctx.font         = `800 ${Math.round(20 * SCALE)}px "DM Sans",sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(ellipsis(ctx, name, CW - PAD * 2), CW / 2, y);
  y += NAME_H + 6 * SCALE;

  // ── UPI ID ───────────────────────────────────────────
  ctx.fillStyle = '#64748B';
  ctx.font      = `600 ${Math.round(13.1 * SCALE)}px "Space Mono",monospace`;
  ctx.fillText(ellipsis(ctx, upiId, CW - PAD * 2), CW / 2, y);
  y += UPI_H;

  // ── Amount (optional) ────────────────────────────────
  if (amount) {
    y += AMT_GAP;
    ctx.fillStyle = '#0F172A';
    ctx.font      = `800 ${Math.round(19.2 * SCALE)}px "DM Sans",sans-serif`;
    ctx.fillText(amount, CW / 2, y);
    y += AMT_H;
  }

  y += HDR_MB;

  // ── QR wrapper box ───────────────────────────────────
  const qx = (CW - QR_SIZE - QR_PAD * 2) / 2;
  const qw  = QR_SIZE + QR_PAD * 2;

  ctx.fillStyle = '#FFFFFF';
  rr(ctx, qx, y, qw, QR_WRAP_H, 12 * SCALE); ctx.fill();
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth   = 2 * SCALE;
  rr(ctx, qx, y, qw, QR_WRAP_H, 12 * SCALE); ctx.stroke();

  // QR pixels — reads all 1200×1200 native canvas pixels directly
  ctx.drawImage(qrCanvas, qx + QR_PAD, y + QR_PAD, QR_SIZE, QR_SIZE);

  y += QR_WRAP_H + FOOTER_MB;

  // ── Dashed divider ───────────────────────────────────
  ctx.setLineDash([6 * SCALE, 4 * SCALE]);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth   = 2 * SCALE;
  ctx.beginPath();
  ctx.moveTo(PAD, y); ctx.lineTo(CW - PAD, y);
  ctx.stroke();
  ctx.setLineDash([]);

  y += FOOTER_PT;

  // ── UPI apps line ────────────────────────────────────
  ctx.fillStyle    = '#64748B';
  ctx.font         = `600 ${Math.round(12 * SCALE)}px "DM Sans",sans-serif`;
  ctx.textBaseline = 'top';
  ctx.textAlign    = 'center';
  ctx.fillText($('txtUpiApps').textContent.trim(), CW / 2, y);
  y += APPS_H + 6 * SCALE;

  // ── Scan prompt ──────────────────────────────────────
  ctx.fillStyle = '#10B981';
  ctx.font      = `700 ${Math.round(14.1 * SCALE)}px "DM Sans",sans-serif`;
  ctx.fillText($('txtScanPrompt').textContent.trim(), CW / 2, y);

  return new Promise((resolve, reject) =>
    cv.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/png')
  );
}

// ─── Helpers ───────────────────────────────────────────────

/** Clip text with ellipsis if it exceeds maxWidth pixels. */
function ellipsis(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(out + '…').width > maxW) {
    out = out.slice(0, -1);
  }
  return out + '…';
}

/** Draw the UPInspect QR-corner icon inside the brand icon box. */
function drawIcon(ctx, bx, by, size) {
  const p = size * 0.18;  // padding inside the box
  const x = bx + p;
  const y = by + p;
  const s = size - p * 2; // drawable area
  const c = s / 3;        // cell size

  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth   = Math.max(1, size * 0.08);
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  // Three corner squares (top-left, top-right, bottom-left)
  [[0, 0], [c * 2, 0], [0, c * 2]].forEach(([ox, oy]) => {
    ctx.beginPath();
    ctx.rect(x + ox, y + oy, c * 0.85, c * 0.85);
    ctx.stroke();
  });

  // Bottom-right: outward arrow
  ctx.beginPath();
  ctx.moveTo(x + c * 2,        y + s * 0.72);
  ctx.lineTo(x + s,            y + s * 0.72);
  ctx.moveTo(x + s * 0.75,     y + s * 0.55);
  ctx.lineTo(x + s,            y + s * 0.72);
  ctx.lineTo(x + s * 0.75,     y + s * 0.89);
  ctx.stroke();

  ctx.restore();
}

/** roundRect with polyfill for older browsers. */
function rr(ctx, x, y, w, h, r) {
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
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
      // Native share with image — Android, iOS Safari
      await navigator.share({ title: 'Scan to Pay', files: [file] });
    } else if (navigator.share) {
      // Share API present but no file support
      await navigator.share({ title: 'UPInspect QR', text: 'Scan to pay securely' });
    } else {
      // No share API — fall back to download
      await downloadStandee();
      return; // downloadStandee re-enables btn
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      showMessage(t('msgShareFailed'), 'error');
    }
  }

  if (btn) btn.disabled = false;
}
