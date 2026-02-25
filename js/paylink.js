// ============================================================
// paylink.js — Payment-link page extras
//
// When the page is opened via a ?pa= URL:
//  - scanTab and createTab cards are hidden (no duplicate buttons)
//  - Two action buttons appear below the verified card:
//      · "Scan | Upload QR"     → reveals scanTab, shows full nav
//      · "Create Your UPI Link" → reveals createTab, shows full nav
// ============================================================

import { navToTools } from './router.js';

// ─── Reveal the two action buttons ─────────────────────────

export function showPayLinkButtons() {
  document.getElementById('plActionButtons').classList.remove('hidden');
}

// ─── Navigation handlers ───────────────────────────────────

/** Restore full UI and go to Scan tab */
export function plGoScan() {
  _restoreFullUI();
  navToTools('scanTab');
}

/** Restore full UI and go to Create tab */
export function plGoCreate() {
  _restoreFullUI();
  navToTools('createTab');
}

// ─── Internal ──────────────────────────────────────────────

function _restoreFullUI() {
  document.getElementById('bottomNav').classList.remove('hidden');
  document.getElementById('toolTabs').classList.remove('hidden');
  // tab content visibility is managed by router/switchToolTab
}
