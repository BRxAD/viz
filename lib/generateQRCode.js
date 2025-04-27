import QRCode from 'qrcode';

/**
 * Generates a QR code as a data URL.
 * @param {string} url - The URL to encode into the QR code.
 * @returns {Promise<string>} - A Promise that resolves to a data URL representing the QR code.
 */
export async function generateQRCode(url) {
  try {
    const qrDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 200,
    });
    return qrDataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
}
