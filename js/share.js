// ============================================================
// share.js — Standee image download & native share
// UPInspect v2.0
//
// Renders the standee card directly onto a <canvas> instead of
// using html2canvas. This avoids all canvas-taint security errors
// and produces a pixel-perfect, full-resolution PNG every time.
// ============================================================

import { state }       from './state.js';
import { showMessage } from './ui.js';

const $ = id => document.getElementById(id);

// ─── Native canvas renderer ────────────────────────────────

async function getCardBlob() {
  const name     = $('standeeName').textContent.trim();
  const upiId    = $('standeeUpiId').textContent.trim();
  const amount   = $('standeeAmount').textContent.trim();
  const qrCanvas = $('cardQrCode').querySelector('canvas');
  if (!qrCanvas) throw new Error('QR canvas not found');

  const SCALE  = 3;
  const CW     = 320 * SCALE;
  const PAD    = 24 * SCALE;
  const RADIUS = 16 * SCALE;

  // Row heights
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
           + NAME_H + 6*SCALE + UPI_H + AMT_GAP + AMT_H
           + HDR_MB + QR_WRAP_H
           + FOOTER_MB + FOOTER_PT + APPS_H + 6*SCALE + SCAN_H
           + PAD;

  const cv = document.createElement('canvas');
  cv.width  = CW;
  cv.height = CH;
  const ctx = cv.getContext('2d');

  // ── Card background ──────────────────────────────────
  ctx.fillStyle = '#FFFFFF';
  rr(ctx, 0, 0, CW, CH, RADIUS); ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth   = 1 * SCALE;
  rr(ctx, 0, 0, CW, CH, RADIUS); ctx.stroke();

  let y = PAD;

  // ── Logo row ─────────────────────────────────────────
  const ICON = 24 * SCALE;
  const brandText = 'UPInspect';
  ctx.font = `700 ${Math.round(14.4*SCALE)}px "Space Mono",monospace`;
  const textW = ctx.measureText(brandText).width;
  const gap   = 7 * SCALE;
  const rowW  = ICON + gap + textW;
  const rowX  = (CW - rowW) / 2;

  ctx.fillStyle = '#0A2463';
  rr(ctx, rowX, y, ICON, ICON, 6*SCALE); ctx.fill();
  drawIcon(ctx, rowX, y, ICON);

  ctx.fillStyle    = '#0A2463';
  ctx.textBaseline = 'middle';
  ctx.textAlign    = 'left';
  ctx.fillText(brandText, rowX + ICON + gap, y + ICON/2);

  y += LOGO_H + LOGO_MB;

  // ── Merchant name ────────────────────────────────────
  ctx.fillStyle    = '#1E3A8A';
  ctx.font         = `800 ${Math.round(20*SCALE)}px "DM Sans",sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(ellipsis(ctx, name, CW - PAD*2), CW/2, y);
  y += NAME_H + 6*SCALE;

  // ── UPI ID ───────────────────────────────────────────
  ctx.fillStyle = '#64748B';
  ctx.font      = `600 ${Math.round(13.1*SCALE)}px "Space Mono",monospace`;
  ctx.fillText(ellipsis(ctx, upiId, CW - PAD*2), CW/2, y);
  y += UPI_H;

  // ── Amount ───────────────────────────────────────────
  if (amount) {
    y += AMT_GAP;
    ctx.fillStyle = '#0F172A';
    ctx.font      = `800 ${Math.round(19.2*SCALE)}px "DM Sans",sans-serif`;
    ctx.fillText(amount, CW/2, y);
    y += AMT_H;
  }

  y += HDR_MB;

  // ── QR wrapper ───────────────────────────────────────
  const qx = (CW - QR_SIZE - QR_PAD*2) / 2;
  const qw  = QR_SIZE + QR_PAD*2;

  ctx.fillStyle = '#FFFFFF';
  rr(ctx, qx, y, qw, QR_WRAP_H, 12*SCALE); ctx.fill();
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth   = 2 * SCALE;
  rr(ctx, qx, y, qw, QR_WRAP_H, 12*SCALE); ctx.stroke();

  // Draw QR — native 1200px canvas pixels, zero upscaling
  ctx.drawImage(qrCanvas, qx + QR_PAD, y + QR_PAD, QR_SIZE, QR_SIZE);

  y += QR_WRAP_H + FOOTER_MB;

  // ── Dashed divider ───────────────────────────────────
  ctx.setLineDash([6*SCALE, 4*SCALE]);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth   = 2 * SCALE;
  ctx.beginPath();
  ctx.moveTo(PAD, y); ctx.lineTo(CW - PAD, y);
  ctx.stroke();
  ctx.setLineDash([]);

  y += FOOTER_PT;

  // ── UPI apps ─────────────────────────────────────────
  ctx.fillStyle    = '#64748B';
  ctx.font         = `600 ${Math.round(12*SCALE)}px "DM Sans",sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText('GPay  •  PhonePe  •  Paytm  •  BHIM', CW/2, y);
  y += APPS_H + 6*SCALE;

  // ── Scan prompt ──────────────────────────────────────
  ctx.fillStyle = '#10B981';
  ctx.font      = `700 ${Math.round(14.1*SCALE)}px "DM Sans",sans-serif`;
  ctx.fillText('Scan to pay with any UPI app', CW/2, y);

  return new Promise(resolve => cv.toBlob(resolve, 'image/png'));
}

// ── Helpers ────────────────────────────────────────────────

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);  ctx.arcTo(x+w, y,   x+w, y+r,   r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x+r, y+h);  ctx.arcTo(x, y+h,   x, y+h-r,  r);
  ctx.lineTo(x, y+r);    ctx.arcTo(x, y,     x+r, y,     r);
  ctx.closePath();
}

function ellipsis(ctx, text, max) {
  if (ctx.measureText(text).width <= max) return text;
  while (text.length > 0 && ctx.measureText(text + '…').width > max)
    text = text.slice(0, -1);
  return text + '…';
}

function drawIcon(ctx, bx, by, size) {
  const s = size / 24;
  ctx.save();
  ctx.strokeStyle = '#FFFFFF';
  ctx.fillStyle   = '#FFFFFF';
  ctx.lineWidth   = 1.5 * s;
  ctx.lineJoin    = 'round';
  // 3 corner squares
  [[3,3],[14,3],[3,14]].forEach(([cx,cy]) => {
    ctx.strokeRect(bx+cx*s, by+cy*s, 7*s, 7*s);
    ctx.fillRect(bx+(cx+2)*s, by+(cy+2)*s, 3*s, 3*s);
  });
  // Data path
  ctx.beginPath();
  ctx.moveTo(bx+14*s, by+14*s);
  ctx.lineTo(bx+17*s, by+14*s);
  ctx.lineTo(bx+17*s, by+17*s);
  ctx.stroke();
  for (let i=0; i<3; i++)
    ctx.fillRect(bx+(17+i)*s, by+(17+i)*s, 1.5*s, 1.5*s);
  ctx.restore();
}

// ─── Download ──────────────────────────────────────────────

export async function downloadStandee() {
  const btn = $('btnDownload');
  btn.disabled = true;
  try {
    const blob = await getCardBlob();
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url, download: 'UPInspect-QR.png'
    });
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showMessage(state.currentLang === 'en' ? 'Image saved!' : 'छवि सहेजी गई!', 'success');
  } catch (e) {
    console.error('Download error:', e);
    showMessage(state.currentLang === 'en' ? 'Download failed' : 'डाउनलोड विफल', 'error');
  }
  btn.disabled = false;
}

// ─── Share ─────────────────────────────────────────────────

export async function shareStandee() {
  const btn = $('btnShare');
  btn.disabled = true;
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
    if (e.name !== 'AbortError')
      showMessage(state.currentLang === 'en' ? 'Share failed' : 'साझा विफल', 'error');
  }
  btn.disabled = false;
}
