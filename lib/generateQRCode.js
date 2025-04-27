import QRCode from 'qrcode';

export async function generateQRCode(url) {
  try {
    const qrBuffer = await QRCode.toBuffer(url, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    return qrBuffer;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw error;
  }
}
