import OpenAI from 'openai';
import { generateQRCode } from '../../lib/generateQRCode';
import { mergeImages } from '../../lib/mergeImages';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { doi, abstractText, citation } = req.body;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const dalleResponse = await openai.images.generate({
      prompt: `Create a social media friendly visual abstract infographic based on this research abstract: ${abstractText}`,
      n: 1,
      size: '1600x900',
    });

    const imageURL = dalleResponse.data[0].url;
    const qrCodeBuffer = await generateQRCode('https://doi.org/' + doi);
    const finalImageUrl = await mergeImages(imageURL, qrCodeBuffer);

    res.status(200).json({ imageURL: finalImageUrl });
  } catch (err) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: 'Failed to generate visual abstract.' });
  }
}
