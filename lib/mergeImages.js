import sharp from 'sharp';

/**
 * Merges a background image and a QR code image into one.
 * @param {string} backgroundImageUrl - The URL of the background image.
 * @param {string} qrCodeDataUrl - The data URL of the QR code.
 * @returns {Promise<string>} - A Promise that resolves to a new merged image as a data URL.
 */
export async function mergeImages(backgroundImageUrl, qrCodeDataUrl) {
  try {
    // Fetch both images
    const bgBuffer = await fetch(backgroundImageUrl).then(res => res.arrayBuffer());
    const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

    const mergedBuffer = await sharp(Buffer.from(bgBuffer))
      .composite([
        {
          input: qrBuffer,
          gravity: 'southeast',
          top: 50,
          left: 50,
        },
      ])
      .png()
      .toBuffer();

    // Convert mergedBuffer back to base64 data URL
    const mergedDataUrl = `data:image/png;base64,${mergedBuffer.toString('base64')}`;
    return mergedDataUrl;
  } catch (err) {
    console.error('Error merging images:', err);
    throw err;
  }
}
