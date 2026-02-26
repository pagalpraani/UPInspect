// ============================================================
// paylink.js — Payment-link page extras
//
// Layout when opened via ?pa= URL:
//   [ Scan | Upload QR        ]  → navigates to Tools > Scan tab
//   [ Create Your UPI Link    ]  → navigates to Tools > Create tab
//   [ ✓ Payment Verified card ]
// ============================================================

import { switchAppView, switchToolTab } from './router.js';

// ─── Show the action buttons ────────────────────────────────

export function showPayLinkButtons() {
  document.getElementById('plActionButtons').classList.remove('hidden');
}

// ─── Button handlers — full navigation to Tools tabs ────────

export function plGoScan() {
  // Restore full UI first
  document.getElementById('bottomNav').classList.remove('hidden');
  document.getElementById('toolTabs').classList.remove('hidden');
  document.getElementById('scanTab').classList.remove('hidden');
  // Navigate to Tools view, Scan tab active
  switchAppView('tools');
  switchToolTab('scanTab', document.getElementById('tabScan'));
}

export function plGoCreate() {
  // Restore full UI first
  document.getElementById('bottomNav').classList.remove('hidden');
  document.getElementById('toolTabs').classList.remove('hidden');
  document.getElementById('createTab').classList.remove('hidden');
  // Navigate to Tools view, Create tab active
  switchAppView('tools');
  switchToolTab('createTab', document.getElementById('tabCreate'));
}
