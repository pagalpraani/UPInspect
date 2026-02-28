// ============================================================
// i18n.js — Bilingual translation strings (EN / HI)
// UPInspect v1.0
// ============================================================

export const translations = {
  en: {
    // Home
    txtEyebrow:      'UPI Security Tool',
    txtHeroTitle:    'Decode. Verify.',
    txtHeroAccent:   'Pay with clarity.',
    txtHeroSub:      'Extract UPI IDs from any QR code and complete payments with complete transparency. No blind payments.',
    txtGridScan:     'Scan & Pay',
    txtGridScanSub:  'Inspect any QR safely',
    txtGridCreate:   'Create QR & Links',
    txtGridCreateSub:'Share payment requests',
    txtTrustTitle:   '100% Local & Private',
    txtTrustDesc:    "UPInspect runs entirely in your browser. Your UPI ID and payment data never touch a server — ever.",

    // Nav
    txtNavHome:  'Home',
    txtNavTools: 'Tools',
    txtNavAbout: 'About',

    // Tools tabs
    txtTabScan:   'Scan & Pay',
    txtTabCreate: 'Create Links & QR',

    // Scanner buttons
    txtStartCam:  'Scan QR',
    txtStopCam:   'Stop',
    txtUploadImg: 'Upload QR',

    // Extracted card
    extractTitle:       'Payment Verified',
    txtPaymentRequest:  'Payment Request',
    lblUpi:     'UPI ID',
    lblMerchant:'Merchant',
    lblAmount:  'Fixed Amount',
    txtCopy:    'Copy UPI ID',
    txtPay:     'Pay Now',

    // Generator
    txtGenQR:      'Generate QR Card',
    txtGenLinkBtn: 'Copy Link',
    txtDownload:   'Save Image',
    txtShareGen:   'Share',

    // About
    txtAboutTitle:   'About UPInspect',
    txtAbout1:       "Built to eliminate blind UPI payments. Always know exactly who you're paying before your banking app takes over.",
    txtAbout2:       'Merchants can generate clean QR cards and shareable payment links. Users can inspect them safely before paying.',
    txtPrivacyTitle: 'Privacy Pledge',
    txtPledge1:      'No data is ever sent to a server.',
    txtPledge2:      'Works entirely in your browser.',
    txtPledge3:      'Zero tracking, open logic.',
  },

  hi: {
    // Home
    txtEyebrow:      'यूपीआई सुरक्षा उपकरण',
    txtHeroTitle:    'डिकोड। सत्यापित करें।',
    txtHeroAccent:   'स्पष्टता से भुगतान करें।',
    txtHeroSub:      'किसी भी क्यूआर से यूपीआई आईडी निकालें और पूरी पारदर्शिता के साथ भुगतान पूरा करें।',
    txtGridScan:     'स्कैन और भुगतान',
    txtGridScanSub:  'सुरक्षित निरीक्षण करें',
    txtGridCreate:   'क्यूआर और लिंक बनाएं',
    txtGridCreateSub:'भुगतान अनुरोध साझा करें',
    txtTrustTitle:   '100% स्थानीय और निजी',
    txtTrustDesc:    'UPInspect पूरी तरह से आपके ब्राउज़र में चलता है। आपकी यूपीआई आईडी कभी सर्वर तक नहीं पहुँचती।',

    // Nav
    txtNavHome:  'होम',
    txtNavTools: 'उपकरण',
    txtNavAbout: 'बारे में',

    // Tools tabs
    txtTabScan:   'स्कैन और भुगतान',
    txtTabCreate: 'लिंक और क्यूआर बनाएं',

    // Scanner buttons
    txtStartCam:  'क्यूआर स्कैन करें',
    txtStopCam:   'बंद करें',
    txtUploadImg: 'क्यूआर अपलोड',

    // Extracted card
    extractTitle:       'भुगतान सत्यापित',
    txtPaymentRequest:  'भुगतान अनुरोध',
    lblUpi:     'यूपीआई आईडी',
    lblMerchant:'व्यापारी',
    lblAmount:  'निश्चित राशि',
    txtCopy:    'यूपीआई आईडी कॉपी करें',
    txtPay:     'भुगतान करें',

    // Generator
    txtGenQR:      'क्यूआर कार्ड बनाएं',
    txtGenLinkBtn: 'लिंक कॉपी करें',
    txtDownload:   'छवि सहेजें',
    txtShareGen:   'साझा करें',

    // About
    txtAboutTitle:   'UPInspect के बारे में',
    txtAbout1:       'अंधे यूपीआई भुगतान को खत्म करने के लिए बनाया गया।',
    txtAbout2:       'व्यापारी QR कार्ड और लिंक बना सकते हैं। उपयोगकर्ता भुगतान से पहले सुरक्षित रूप से निरीक्षण कर सकते हैं।',
    txtPrivacyTitle: 'गोपनीयता प्रतिज्ञा',
    txtPledge1:      'कोई डेटा सर्वर पर नहीं भेजा जाता।',
    txtPledge2:      'पूरी तरह आपके ब्राउज़र में।',
    txtPledge3:      'शून्य ट्रैकिंग।',
  },
};

/**
 * Apply the current language to all translatable DOM elements.
 * @param {string} lang - 'en' | 'hi'
 * @param {boolean} isPaymentLinkMode
 */
export function applyLanguage(lang, isPaymentLinkMode) {
  const t = translations[lang];

  // Update every element whose id matches a translation key.
  // This always runs in full — payment-link mode is NOT a skip condition.
  // Labels like lblUpi / lblMerchant / lblAmount are included here.
  Object.keys(t).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = t[id];
  });

  // In payment-link mode the badge title says "Payment Request" not "Payment Verified"
  if (isPaymentLinkMode) {
    const el = document.getElementById('extractTitle');
    if (el) el.textContent = t.txtPaymentRequest;
  }

  // Update lang toggle button label (shows opposite language to switch to)
  document.getElementById('langBtn').textContent = lang === 'en' ? 'हिं' : 'EN';
}
