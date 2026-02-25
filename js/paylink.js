// ============================================================
// paylink.js — Payment-link page extras
//
// When the page is opened via a ?pa= URL, two extra buttons
// appear below the verified card:
//   · "Scan | Upload QR"     → takes user to the Scan tab
//   · "Create Your UPI Link" → takes user to the Create tab
//
// No duplicate scanner or generator UI — we just navigate to
// the existing tabs.
// ============================================================

import { navToTools } from './router.js';

// ─── Show the two action buttons ───────────────────────────

export function showPayLinkButtons() {
  document.getElementById('plActionButtons').classList.remove('hidden');
}

// ─── Navigation handlers ───────────────────────────────────

/** "Scan | Upload QR" → reveal full nav + go to Scan tab */
export function plGoScan() {
  document.getElementById('bottomNav').classList.remove('hidden');
  document.getElementById('toolTabs').classList.remove('hidden');
  navToTools('scanTab');
}

/** "Create Your UPI Link" → reveal full nav + go to Create tab */
export function plGoCreate() {
  document.getElementById('bottomNav').classList.remove('hidden');
  document.getElementById('toolTabs').classList.remove('hidden');
  navToTools('createTab');
}
