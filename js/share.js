// ============================================================
// share.js — Standee image download & native share
// UPInspect v2.0
// ============================================================

import { state }       from './state.js';
import { showMessage } from './ui.js';

const $ = id => document.getElementById(id);

// ─── Canvas capture ────────────────────────────────────────

/**
 * Render the standee element to a PNG Blob (3× resolution).
 * @returns {Promise<Blob>}
 */
async function getCardBlob() {
  const canvas = await html2canvas($('qrStandee'), {
    scale:           Math.max(4, window.devicePixelRatio * 2),
    backgroundColor: '#FFFFFF',
    logging:         false,
    useCORS:         true,
    allowTaint:      true,
    imageTimeout:    0,
  });
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

// ─── Download ──────────────────────────────────────────────

export async function downloadStandee() {
  const btn = $('btnDownload');
  btn.disabled = true;

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

    showMessage(
      state.currentLang === 'en' ? 'Image saved!' : 'छवि सहेजी गई!',
      'success'
    );
  } catch (_) {
    showMessage(
      state.currentLang === 'en' ? 'Download failed' : 'डाउनलोड विफल',
      'error'
    );
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
      // Full native share with file attachment
      await navigator.share({ title: 'Scan to Pay', files: [file] });
    } else if (navigator.share) {
      // Fallback: share as text/link only
      await navigator.share({ title: 'UPInspect QR', text: 'Scan to pay securely' });
    } else {
      // No Web Share API — trigger a download instead
      await downloadStandee();
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      showMessage(
        state.currentLang === 'en' ? 'Share failed' : 'साझा विफल',
        'error'
      );
    }
  }

  btn.disabled = false;
}
