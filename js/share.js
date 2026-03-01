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

  if (!qrCanvas) throw new Error('QR canvas not found.');

  // Use exact physical pixel density
  const SCALE = window.devicePixelRatio || 2;

  // Force layout to integer pixel grid
  const rect = standee.getBoundingClientRect();
  const width  = Math.round(rect.width);
  const height = Math.round(rect.height);

  // Temporarily remove any transforms (very important)
  const previousTransform = standee.style.transform;
  standee.style.transform = 'none';

  // Hide QR for background capture
  qrWrap.style.visibility = 'hidden';

  const bgCanvas = await html2canvas(standee, {
    scale: SCALE,
    width,
    height,
    backgroundColor: '#FFFFFF',
    logging: false,
    useCORS: false,
    allowTaint: false,
  });

  qrWrap.style.visibility = '';
  standee.style.transform = previousTransform || '';

  // Create output canvas
  const out = document.createElement('canvas');
  const ctx = out.getContext('2d');

  out.width  = bgCanvas.width;
  out.height = bgCanvas.height;

  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(bgCanvas, 0, 0);

  // Calculate correct scale
  const effectiveScaleX = bgCanvas.width  / width;
  const effectiveScaleY = bgCanvas.height / height;

  const qrRect = qrWrap.getBoundingClientRect();

  const qrX = Math.round((qrRect.left - rect.left) * effectiveScaleX);
  const qrY = Math.round((qrRect.top  - rect.top)  * effectiveScaleY);
  const qrW = Math.round(qrRect.width  * effectiveScaleX);
  const qrH = Math.round(qrRect.height * effectiveScaleY);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrX, qrY, qrW, qrH);
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
