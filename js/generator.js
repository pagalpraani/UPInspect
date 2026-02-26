// ============================================================
// generator.js — QR card & payment link generation
// UPInspect v2.0
// ============================================================

import { state, UPI_REGEX, BASE_PAY_URL } from './state.js';
import { showMessage }                      from './ui.js';

const $ = id => document.getElementById(id);

// ─── Validation ────────────────────────────────────────────

/**
 * Read and validate the create-form fields.
 * Returns { pa, pn, am } on success, or null on failure.
 */
function getFormValues() {
  const pa = $('newUpiId').value.trim().toLowerCase();
  const pn = $('newName').value.trim();
  const am = $('newAmount').value.trim();

  if (!UPI_REGEX.test(pa)) {
    showMessage(
      state.currentLang === 'en'
        ? 'Enter a valid UPI ID (e.g. name@upi)'
        : 'मान्य यूपीआई आईडी दर्ज करें',
      'error'
    );
    $('newUpiId').classList.add('invalid');
    return null;
  }

  if (am && (isNaN(parseFloat(am)) || parseFloat(am) < 0)) {
    showMessage(
      state.currentLang === 'en'
        ? 'Enter a valid amount'
        : 'मान्य राशि दर्ज करें',
      'error'
    );
    return null;
  }

  return { pa, pn, am };
}

// ─── Live validation ───────────────────────────────────────

export function validateUpiLive() {
  const input = $('newUpiId');
  const val   = input.value.trim();

  if (val.length === 0) {
    input.classList.remove('valid', 'invalid');
  } else if (UPI_REGEX.test(val)) {
    input.classList.replace('invalid', 'valid') || input.classList.add('valid');
  } else {
    input.classList.replace('valid', 'invalid') || input.classList.add('invalid');
  }
}

// ─── QR Card ───────────────────────────────────────────────

export function generateQRCard() {
  const data = getFormValues();
  if (!data) return;

  const { pa, pn, am } = data;
  const upiString = buildUpiString(pa, pn, am);

  // Render standee text
  $('standeeName').textContent   = pn || (state.currentLang === 'en' ? 'UPI Payment' : 'यूपीआई भुगतान');
  $('standeeUpiId').textContent  = pa;
  $('standeeAmount').textContent = am ? `₹ ${parseFloat(am).toFixed(2)}` : '';

  // Clear previous QR and render new one
  $('cardQrCode').innerHTML = '';
  new QRCodeStyling({
    width:  240,
    height: 240,
    type:   'canvas',
    data:   upiString,
    qrOptions:         { errorCorrectionLevel: 'M' },
    dotsOptions:       { color: '#000000', type: 'square' },
    backgroundOptions: { color: '#FFFFFF' },
    margin: 0,
  }).append($('cardQrCode'));

  // Show result areas
  $('qrStandee').classList.remove('hidden');
  $('cardActions').classList.remove('hidden');
  $('qrStandee').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ─── Payment Link ──────────────────────────────────────────

export function generateLink() {
  const data = getFormValues();
  if (!data) return;

  const { pa, pn, am } = data;
  let url = `${BASE_PAY_URL}?pa=${encodeURIComponent(pa)}`;
  if (pn) url += `&pn=${encodeURIComponent(pn)}`;
  if (am) url += `&am=${encodeURIComponent(am)}`;

  navigator.clipboard
    .writeText(url)
    .then(() =>
      showMessage(
        state.currentLang === 'en' ? 'Payment link copied!' : 'लिंक कॉपी किया गया!',
        'success'
      )
    )
    .catch(() => showMessage('Copy failed', 'error'));
}

// ─── Reset ─────────────────────────────────────────────────

export function resetCreateForm() {
  ['newUpiId', 'newName', 'newAmount'].forEach(id => {
    $(`${id}`).value = '';
  });
  $('newUpiId').classList.remove('valid', 'invalid');
  $('qrStandee').classList.add('hidden');
  $('cardActions').classList.add('hidden');
}

// ─── Internal helpers ──────────────────────────────────────

function buildUpiString(pa, pn, am) {
  let s = `upi://pay?pa=${pa}&pn=${encodeURIComponent(pn)}&cu=INR`;
  if (am) s += `&am=${am}`;
  return s;
}
