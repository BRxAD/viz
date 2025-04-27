import { createCanvas, loadImage } from 'canvas';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function mergeImages(baseImagePath, qrCodeBuffer) {
  try {
    const baseImage = await loadImage(baseImagePath);
    const qrCodeImage = await loadImage(qrCodeBuffer);

    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext('2d');

    // Draw original image first
    ctx.drawImage(baseImage, 0, 0, baseImage.width, baseImage.height);

    // Size of QR code relative to base image size
    const qrSize = Math.floor(baseImage.width * 0.12); // 12% width

    // Padding from edges
    const padding = Math.floor(baseImage.width * 0.02);

    // Draw QR code bottom right
    ctx.drawImage(
      qrCodeImage,
      baseImage.width - qrSize - padding,
      baseImage.height - qrSize - padding,
      qrSize,
      qrSize
    );

    // Save to a temp file
    const outputFileName = `/tmp/final_image_${uuidv4()}.png`;
    await writeFile(outputFileName, canvas.toBuffer('image/png'));

    // For serving as URL, return a local path to the public folder if needed
    return outputFileName;
  } catch (error) {
    console.error('Error merging images:', error);
    throw error;
  }
}

