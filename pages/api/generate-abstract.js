import OpenAI from "openai";
import { writeFile } from "fs/promises";
import { generateQRCode } from "../../lib/generateQRCode";
import { mergeImages } from "../../lib/mergeImages";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { doi, abstractText, citation } = req.body;

  try {
    // Prepare a CLEAN concise prompt for GPT-Image-1
    const finalPrompt = `
Create a professional 16:9 visual abstract infographic. 
Title: brief title
- Methods section (left): concise summary of methods.
- Results section (center): key numeric finding.
- Implications section (right): main conclusion for practice.
- Use modern minimalist design with navy blue, neon pink, and white colors.
- Add relevant icons: microscope for Methods, chart or patient for Results, lightbulb for Implications.
- Ensure text is large, clean, readable, not garbled.
- Leave some white space at bottom right for QR code.

METHODS: ${abstractText.slice(0, 300)} 
RESULTS: ${abstractText.slice(300, 600)} 
IMPLICATIONS: ${citation.slice(0, 300)}
`;

    // Create the image
    const imgResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: finalPrompt,
      n: 1,
      size: "1536x1024",  // Landscape 16:9
      output_format: "png",
      background: "opaque",
      quality: "high"
    });

    const base64Image = imgResponse.data[0].b64_json;

    // Save temporary image
    const tempImagePath = "/tmp/generated_image.png";
    const imageBuffer = Buffer.from(base64Image, "base64");
    await writeFile(tempImagePath, imageBuffer);

    // Generate QR code
    const qrBuffer = await generateQRCode('https://doi.org/' + doi);

    // Merge QR code into the image
    const finalImageUrl = await mergeImages(tempImagePath, qrBuffer);

    res.status(200).json({ imageURL: finalImageUrl });
  } catch (err) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: 'Failed to generate visual abstract.' });
  }
}



