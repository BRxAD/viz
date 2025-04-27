import OpenAI from "openai";
import { generateQRCode } from "../../lib/generateQRCode";
import { createCanvas, loadImage } from "canvas";
import { writeFile } from "fs/promises";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { doi, abstractText, citation } = req.body;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Summarize if too long
    let summarizedAbstract = abstractText;
    if (abstractText.length > 800) {
      const summaryResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert scientific writer. Summarize research abstracts into <= 800 characters while keeping key ideas clear and accurate.',
          },
          {
            role: 'user',
            content: abstractText,
          },
        ],
        max_tokens: 400,
      });

      summarizedAbstract = summaryResponse.choices[0].message.content.trim();
    }

    // Build prompt
    const finalPrompt = `Create a clean, minimal infographic representing the following study:
${summarizedAbstract}

Use icons, arrows, simple shapes.
No fake text, no hallucinated letters.
Minimalistic, social-media ready style.`;

    // Generate image using gpt-image-1
    const imgResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
    });

    const imageBase64 = imgResponse.data[0].b64_json;
    if (!imageBase64) {
      throw new Error('No base64 image received.');
    }

    const mainImageBuffer = Buffer.from(imageBase64, "base64");

    // Load both main image and QR code
    const [mainImage, qrImage] = await Promise.all([
      loadImage(mainImageBuffer),
      generateQRCode('https://doi.org/' + doi),
    ]);

    // Create canvas for final merge
    const canvas = createCanvas(mainImage.width, mainImage.height);
    const ctx = canvas.getContext('2d');

    // Draw the main image
    ctx.drawImage(mainImage, 0, 0);

    // Draw QR code bottom-right with margin
    const qrSize = 100; // QR code width/height
    const margin = 20; // Margin from edges
    ctx.drawImage(qrImage, canvas.width - qrSize - margin, canvas.height - qrSize - margin, qrSize, qrSize);

    // Convert final merged image to base64
    const finalBuffer = canvas.toBuffer('image/png');

    // Optionally save to disk for testing
    // await writeFile("output.png", finalBuffer);

    // Return as base64 to frontend
    res.status(200).json({ image: finalBuffer.toString('base64') });

  } catch (err) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: 'Failed to generate visual abstract.' });
  }
}



