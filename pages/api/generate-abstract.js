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
    // Summarize if too long
    let summarizedAbstract = abstractText;
    if (abstractText.length > 800) {
      const summaryResponse = await openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
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

    // Build final prompt
    let finalPrompt = `Create a social media friendly visual abstract infographic based on this research summary: ${summarizedAbstract}`;

    // Truncate if too long
    if (finalPrompt.length > 1000) {
      finalPrompt = finalPrompt.substring(0, 999);
    }

    // Correct DALL-E call
    const dalleResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
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
