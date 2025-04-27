import { Configuration, OpenAIApi } from 'openai';
import { generateQRCode } from '../../lib/generateQRCode';
import { mergeImages } from '../../lib/mergeImages';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { abstractText, citation } = req.body;

  const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
  const openai = new OpenAIApi(configuration);

  try {
    const dalleResponse = await openai.createImage({
      prompt: `Create a social media friendly visual abstract infographic based on this research abstract: ${abstractText}`,
      n: 1,
      size: '1024x1024',
    });

    const imageURL = dalleResponse.data.data[0].url;
    const qrCodeBuffer = await generateQRCode('https://doi.org/' + req.body.doi);
    const finalImageUrl = await mergeImages(imageURL, qrCodeBuffer);

    res.status(200).json({ imageURL: finalImageUrl });
  } catch (err) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: 'Failed to generate visual abstract.' });
  }
}
