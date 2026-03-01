// ============================================================
// scanner.js — QR code scanning (camera + file upload)
// UPInspect v1.0
// ============================================================

import { state, UPI_REGEX } from './state.js';
import { showMessage }       from './ui.js';
import { t, getLang, applyLanguage } from './i18n.js';
import { renderExtractedCard } from './extractor.js';

const $ = id => document.getElementById(id);

// ─── DOM helpers ───────────────────────────────────────────

function setScannerUIState(scanning) {
  $('scannerWrapper').classList.toggle('hidden', !scanning);
  $('btnStartCam').classList.toggle('hidden',  scanning);
  $('btnStopCam').classList.toggle('hidden',  !scanning);
}

// ─── Lifecycle ─────────────────────────────────────────────

function initScanner() {
  if (!state.html5QrCode) {
    state.html5QrCode = new Html5Qrcode('reader');
  }
}

export async function stopScanner() {
  if (state.html5QrCode && state.isScanning) {
    try { await state.html5QrCode.stop(); } catch (_) {}
    state.isScanning = false;
  }
  setScannerUIState(false);
}

export function startScanner() {
  initScanner();
  $('extractedCard').classList.add('hidden');
  setScannerUIState(true);

  const qrboxSize = window.innerWidth < 350 ? 180 : 240;

  state.html5QrCode
    .start(
      { facingMode: 'environment' },
      { fps: 12, qrbox: { width: qrboxSize, height: qrboxSize } },
      (decodedText) => {
        parseQRText(decodedText);
        stopScanner();
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      },
      () => {} // per-frame errors are expected; suppress them
    )
    .then(() => { state.isScanning = true; })
    .catch(() => {
      setScannerUIState(false);
      showMessage(t('msgCameraDenied'), 'error');
    });
}

// ─── File Upload ───────────────────────────────────────────

export function initFileUploadListener() {
  $('qrFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    $('extractedCard').classList.add('hidden');
    initScanner();

    state.html5QrCode
      .scanFile(file, true)
      .then(decodedText => parseQRText(decodedText))
      .catch(() => showMessage(t('msgQrReadError'), 'error'));

    e.target.value = '';
  });
}


// ─── QR Parsing ────────────────────────────────────────────

/**
 * Parse raw QR text and populate the extracted card.
 * Handles both upi://pay URIs and plain UPI IDs.
 * @param {string} text
 */
function parseQRText(text) {
  const trimmed = text.trim();

  if (trimmed.toLowerCase().startsWith('upi://pay')) {
    try {
      const url = new URL(trimmed);
      const pa  = url.searchParams.get('pa') || 'N/A';
      const pn  = url.searchParams.get('pn') || 'N/A';
      const am  = url.searchParams.get('am') || '';

      state.rawAmountVal      = am;
      state.isPaymentLinkMode = false;
      applyLanguage(getLang(), false);
      renderExtractedCard({ pa, pn, am });
    } catch (_) {
      showMessage(t('msgQrParseError'), 'error');
    }
    return;
  }

  if (UPI_REGEX.test(trimmed)) {
    state.rawAmountVal = '';
    renderExtractedCard({ pa: trimmed, pn: 'N/A', am: '' });
    return;
  }

  // Unrecognised
  showMessage(t('msgQrInvalid'), 'error');
}
