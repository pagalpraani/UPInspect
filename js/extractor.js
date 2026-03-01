// ============================================================
// extractor.js — Render extracted UPI data & payment actions
// UPInspect v1.0
// ============================================================

import { state }       from './state.js';
import { showMessage } from './ui.js';
import { t }           from './i18n.js';
import { t }           from './i18n.js';

const $ = id => document.getElementById(id);

/**
 * Populate and reveal the extracted-card UI.
 * @param {{ pa: string, pn: string, am: string }} data
 */
export function renderExtractedCard({ pa, pn, am }) {
  $('valUpiId').textContent   = pa;
  $('valMerchant').textContent = pn;

  if (am) {
    $('valAmount').textContent = `₹ ${parseFloat(am).toFixed(2)}`;
    $('groupAmount').classList.remove('hidden');
  } else {
    $('groupAmount').classList.add('hidden');
  }

  const card = $('extractedCard');
  card.classList.remove('hidden');
  // Don't scroll on payment-link page — it pushes the nav out of view
  if (!state.isPaymentLinkMode) {
    card.scrollIntoView({ behavior: 'smooth' });
  }
}


/**
 * Copy the displayed UPI ID to the clipboard.
 */
export function copyUPI() {
  const upiId = $('valUpiId').textContent;
  if (!upiId || upiId === 'N/A' || upiId === '—') return;

  navigator.clipboard
    .writeText(upiId)
    .then(() => showMessage(t('msgUpiCopied'), 'success'))
    .catch(() => showMessage(t('msgCopyFailed'), 'error'));
}

/**
 * Open the native UPI payment deep-link.
 */
export function openUPI() {
  const pa = $('valUpiId').textContent;
  const pn = $('valMerchant').textContent;
  if (!pa || pa === '—' || pa === 'N/A') return;

  let link = `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&cu=INR`;
  if (state.rawAmountVal) link += `&am=${state.rawAmountVal}`;
  window.open(link, '_self');
}
