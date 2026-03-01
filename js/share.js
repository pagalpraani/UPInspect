// ============================================================
// share.js — Standee image export & native share
// UPInspect v1.0
// ============================================================

import { showMessage } from './ui.js';
import { t }           from './i18n.js';

const $ = id => document.getElementById(id);

// ─── Core renderer ─────────────────────────────────────────

/**
 * Composites the live #qrStandee element into a high-res PNG Blob.
 * @returns {Promise<Blob>}
 */
async function getCardBlob() {
  const standee  = $('qrStandee');
  const qrWrap   = $('cardQrCode');
  const qrCanvas = qrWrap.querySelector('canvas');

  if (!qrCanvas) throw new Error('QR canvas not found — generate a QR first.');

  const SCALE = 3;

  // Measure live positions before hiding anything
  const standeeRect = standee.getBoundingClientRect();
  const qrRect      = qrWrap.getBoundingClientRect();

  // ── Step 1: capture background without the QR ──────────
  qrWrap.style.visibility = 'hidden';
  const bgCanvas = await html2canvas(standee, {
    scale:           SCALE,
    backgroundColor: '#FFFFFF',
    logging:         false,
    useCORS:         false,
    allowTaint:      false,
    imageTimeout:    0,
    // Removed strict width/height to let html2canvas use integer bounds
  });
  qrWrap.style.visibility = '';

  // ── Step 2: composite onto fresh canvas ────────────────
  const out = document.createElement('canvas');
  const ctx = out.getContext('2d');

  // Set output canvas to the exact dimensions html2canvas generated
  out.width  = bgCanvas.width;
  out.height = bgCanvas.height;

  // Disable image smoothing to guarantee no anti-aliasing blur on the copy
  ctx.imageSmoothingEnabled = false;

  // Draw standee background EXACTLY 1:1
  ctx.drawImage(bgCanvas, 0, 0);

  // ── Step 3: draw QR pixels directly (same-origin) ──────
  // Calculate the actual effective scale html2canvas used to ensure perfect QR placement
  const effectiveScaleX = bgCanvas.width  / standeeRect.width;
  const effectiveScaleY = bgCanvas.height / standeeRect.height;

  const qrX = Math.round((qrRect.left - standeeRect.left) * effectiveScaleX);
  const qrY = Math.round((qrRect.top  - standeeRect.top)  * effectiveScaleY);
  const qrW = Math.round(qrRect.width  * effectiveScaleX);
  const qrH = Math.round(qrRect.height * effectiveScaleY);

  // White fill for the qrWrap padding area
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrX, qrY, qrW, qrH);

  // QR pixels — reads all 1200×1200 native pixels, zero upscaling
  ctx.drawImage(qrCanvas, qrX, qrY, qrW, qrH);

  return new Promise((resolve, reject) =>
    out.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/png')
  );
}

// ─── Download ──────────────────────────────────────────────

export async function downloadStandee() {
  const btn = $('btnDownload');
  if (btn) btn.disabled = true;

  try {
    const blob = await getCardBlob();
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href:     url,
      download: 'UPInspect-QR.png',
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
      // Native share with image attachment (Android, iOS Safari)
      await navigator.share({ title: 'Scan to Pay', files: [file] });
    } else if (navigator.share) {
      // Share API exists but no file support — share text only
      await navigator.share({ title: 'UPInspect QR', text: 'Scan to pay securely' });
    } else {
      // No share API — fall back to download
      await downloadStandee();
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      showMessage(t('msgShareFailed'), 'error');
    }
  }

  if (btn) btn.disabled = false;
}
