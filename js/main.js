// ============================================================
// main.js — Application entry point & bootstrap
// UPInspect v2.0
// ============================================================

import { state }                          from './state.js';
import { restoreTheme, toggleTheme }      from './ui.js';
import { applyLanguage }                  from './i18n.js';
import { switchAppView, navToTools,
         switchToolTab }                  from './router.js';
import { startScanner, stopScanner,
         initFileUploadListener }         from './scanner.js';
import { copyUPI, openUPI,
         renderExtractedCard }            from './extractor.js';
import { validateUpiLive, generateQRCard,
         generateLink, resetCreateForm }  from './generator.js';
import { downloadStandee, shareStandee } from './share.js';
import { showPayLinkButtons,
         plGoScan, plGoCreate }           from './paylink.js';

// ─── Boot ──────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => {
  // 1. Restore persisted preferences
  restoreTheme();
  if (localStorage.getItem('lang')) {
    state.currentLang = localStorage.getItem('lang');
  }

  // 2. Handle payment-link mode (URL params)
  const params = new URLSearchParams(window.location.search);
  const pa = params.get('pa');

  if (pa) {
    state.isPaymentLinkMode = true;
    const am = params.get('am') || '';
    const pn = params.get('pn') || 'Unknown';
    state.rawAmountVal = am;

    // Show tools view but hide nav & tabs — looks like a standalone page
    switchAppView('tools');
    document.getElementById('toolTabs').classList.add('hidden');
    document.getElementById('bottomNav').classList.add('hidden');

    // Populate the verified card
    renderExtractedCard({ pa, pn, am });

    // Show the two action buttons below the card
    showPayLinkButtons();
  }

  // 3. Apply translations
  applyLanguage(state.currentLang, state.isPaymentLinkMode);

  // 4. Bind file-upload listener
  initFileUploadListener();

  // 5. Expose functions needed by inline HTML event handlers
  exposeGlobals();
});

// ─── Global bridge ─────────────────────────────────────────
// Since the HTML uses onclick="..." attributes, we attach
// the module functions to window so they remain reachable.
// In a build-tool setup these would be removed in favour of
// addEventListener bindings, but this keeps the HTML clean
// without requiring a bundler.

function exposeGlobals() {
  Object.assign(window, {
    // Theme / lang
    toggleTheme,
    toggleLang,

    // Routing
    switchAppView,
    navToTools,
    switchToolTab,

    // Scanner
    startScanner,
    stopScanner,

    // Extracted card
    copyUPI,
    openUPI,

    // Generator
    validateUpiLive,
    generateQRCard,
    generateLink,
    resetCreateForm,

    // Share
    downloadStandee,
    shareStandee,

    // Payment-link navigation
    plGoScan,
    plGoCreate,
  });
}

// ─── Language toggle ───────────────────────────────────────

function toggleLang() {
  state.currentLang = state.currentLang === 'en' ? 'hi' : 'en';
  localStorage.setItem('lang', state.currentLang);
  applyLanguage(state.currentLang, state.isPaymentLinkMode);
}
