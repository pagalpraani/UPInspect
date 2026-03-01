// ============================================================
// share.js — QR Standee Native Canvas Export
// UPInspect v1.0
// ============================================================

import { showMessage } from './ui.js';
import { t }           from './i18n.js';

const $ = id => document.getElementById(id);

/**
 * Downloads the currently rendered QR standee as a PNG image.
 */
export async function downloadStandee() {
  const dataUrl = await renderStandeeToCanvas();
  if (!dataUrl) return;

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `UPInspect-QR-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showMessage(t('msgImageSaved'), 'success');
}

/**
 * Uses the Web Share API to share the QR standee as an image file.
 * Fallbacks to standard share if files are not supported.
 */
export async function shareStandee() {
  const dataUrl = await renderStandeeToCanvas();
  if (!dataUrl) return;

  try {
    const res  = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], 'upinspect-qr.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'UPI Payment QR',
        text:  'Scan to pay via any UPI app.',
        files: [file]
      });
    } else if (navigator.share) {
      await navigator.share({
        title: 'UPI Payment QR',
        text:  'Scan to pay via any UPI app. (Image sharing not supported on this browser)'
      });
    } else {
      showMessage('Sharing not supported on this browser', 'error');
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error(err);
      showMessage('Share failed', 'error');
    }
  }
}

/**
 * Composites the QR code and text into a native Canvas.
 * This avoids cross-origin/taint issues common with html2canvas.
 *
 * @returns {Promise<string|null>} Base64 data URL
 */
async function renderStandeeToCanvas() {
  const btn = $('btnDownload');
  if (btn) btn.style.opacity = '0.5';

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Canvas size (3x resolution of the 320x460 card)
    const W = 960;
    const H = 1380;
    canvas.width  = W;
    canvas.height = H;

    // 1. Background
    ctx.fillStyle = '#0f172a'; // matches .qr-standee
    ctx.fillRect(0, 0, W, H);

    // 2. Wait for fonts to be ready so text renders correctly
    await document.fonts.ready;

    // Helper for text rendering
    const drawText = (text, x, y, font, color, align = 'center') => {
      if (!text) return;
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = 'top';
      ctx.fillText(text, x, y);
    };

    // 3. Logo / Brand Row
    // Draw UPInspect text
    const brandY = 80;
    ctx.font = 'bold 54px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const brandName = 'UPInspect';
    const textWidth = ctx.measureText(brandName).width;
    const textX = (W / 2) + 20; // Shift right to make room for icon

    // Draw 'UP'
    ctx.fillStyle = '#ffffff';
    ctx.fillText('UP', textX - textWidth/2, brandY);
    // Draw 'Inspect' (simulating the span opacity)
    const upWidth = ctx.measureText('UP').width;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'left';
    ctx.fillText('Inspect', textX - textWidth/2 + upWidth, brandY);

    // Draw the icon path natively (simplified approximation of the logo)
    const iconSize = 48;
    const iconX = textX - textWidth/2 - iconSize - 20;
    const iconY = brandY + 3;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    // Top-left rect
    ctx.roundRect(iconX, iconY, 14, 14, 3);
    // Top-right rect
    ctx.roundRect(iconX + 22, iconY, 14, 14, 3);
    // Bottom-left rect
    ctx.roundRect(iconX, iconY + 22, 14, 14, 3);
    ctx.stroke();

    // Bottom-right arrow
    ctx.beginPath();
    ctx.moveTo(iconX + 22, iconY + 36);
    ctx.lineTo(iconX + 28, iconY + 36);
    ctx.lineTo(iconX + 28, iconY + 36 + 6);
    ctx.moveTo(iconX + 28, iconY + 36 - 6);
    ctx.lineTo(iconX + 36, iconY + 36 + 2);
    ctx.stroke();

    // 4. Header block (Name, UPI, Amount)
    const headerStartY = 220;
    drawText(
      $('standeeName').textContent || t('msgStandeeDefault'),
      W / 2,
      headerStartY,
      'bold 60px "DM Sans", sans-serif',
      '#ffffff'
    );

    drawText(
      $('standeeUpiId').textContent,
      W / 2,
      headerStartY + 85,
      '42px "Space Mono", monospace',
      'rgba(255, 255, 255, 0.7)'
    );

    const amount = $('standeeAmount').textContent;
    if (amount) {
      drawText(
        amount,
        W / 2,
        headerStartY + 155,
        '60px "Space Mono", monospace',
        '#10b981' // emerald-500
      );
    }

    // 5. Render the QR code canvas
    // The qr-code-styling library creates a canvas inside #cardQrCode
    const qrContainer = $('cardQrCode');
    const qrCanvas = qrContainer.querySelector('canvas');

    if (!qrCanvas) {
      throw new Error('QR code canvas not found');
    }

    // Target size for QR on the card
    const qrSize = 640;
    const qrX = (W - qrSize) / 2;
    // Push down slightly if amount is present
    const qrY = amount ? headerStartY + 260 : headerStartY + 180;

    // Draw the rounded white background box for the QR code
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40, 24);
    ctx.fill();

    // Draw the actual QR canvas data
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    // 6. Footer block (Apps, Prompt)
    const footerY = H - 180;

    drawText(
      $('txtUpiApps').textContent,
      W / 2,
      footerY,
      '500 40px "DM Sans", sans-serif',
      'rgba(255, 255, 255, 0.9)'
    );

    drawText(
      $('txtScanPrompt').textContent,
      W / 2,
      footerY + 65,
      '36px "DM Sans", sans-serif',
      'rgba(255, 255, 255, 0.5)'
    );

    // Restore button opacity and return data URL
    if (btn) btn.style.opacity = '1';
    return canvas.toDataURL('image/png');

  } catch (err) {
    console.error('Canvas export error:', err);
    showMessage(t('msgExportError') || 'Failed to save image', 'error');
    if (btn) btn.style.opacity = '1';
    return null;
  }
}
