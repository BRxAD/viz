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

    // Build final prompt
    let finalPrompt = `Create a clean, minimal, social media friendly visual abstract infographic based on this research summary: ${summarizedAbstract}. 
Do NOT generate any fake text or hallucinated letters. Use clean visuals, icons, and shapes only. Avoid fake paragraphs or distorted writing. The layout should be visually clear, infographic-style, with labeled sections.`;

    if (finalPrompt.length > 1000) {
      finalPrompt = finalPrompt.substring(0, 999);
    }

    // Generate image using gpt-4o
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: finalPrompt,
            },
          ],
        },
      ],
      tool_choice: {
        type: "function",
        function: {
          name: "generate_image",
          arguments: JSON.stringify({
            prompt: finalPrompt,
            size: "1024x1024",
            style: "vivid",
            response_format: "url",
          }),
        },
      },
    });

    // Correctly parse image URL
    const contents = chatResponse.choices[0].message.content;

    if (!contents || !Array.isArray(contents)) {
      throw new Error('No content array found in chat response.');
    }

    const imageContent = contents.find(c => c.type === "image_url");

    if (!imageContent || !imageContent.image_url || !imageContent.image_url.url) {
      throw new Error('No image URL found in message content.');
    }

    const imageURL = imageContent.image_url.url;

    // Merge QR code
    const qrCodeBuffer = await generateQRCode('https://doi.org/' + doi);
    const finalImageUrl = await mergeImages(imageURL, qrCodeBuffer);

    res.status(200).json({ imageURL: finalImageUrl });

  } catch (err) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: 'Failed to generate visual abstract.' });
  }
}


