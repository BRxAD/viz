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
Do NOT generate any fake text or hallucinated letters. Use clean visuals, icons, shapes only. Avoid fake paragraphs or distorted writing. The layout should be visually clear.`;

    // Truncate if too long
    if (finalPrompt.length > 1000) {
      finalPrompt = finalPrompt.substring(0, 999);
    }

    // Image generation using gpt-4o tool call
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
      tools: [
        {
          type: "function",
          function: {
            name: "generate_image",
            description: "Generate a clean visual abstract image",
            parameters: {
              type: "object",
              properties: {
                prompt: {
                  type: "string",
                  description: "Detailed description of image content",
                },
                size: {
                  type: "string",
                  enum: ["1024x1024", "1792x1024", "1024x1792"],
                  description: "Size of image",
                },
                style: {
                  type: "string",
                  enum: ["vivid", "natural"],
                  description: "Visual style of the image",
                },
                response_format: {
                  type: "string",
                  enum: ["url"],
                  description: "The format in which the generated image will be returned",
                },
              },
              required: ["prompt", "size", "style", "response_format"],
            },
          },
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
// Correct way to extract generated image URL
const toolCalls = chatResponse.choices[0]?.message?.tool_calls;

if (!toolCalls || toolCalls.length === 0) {
  throw new Error('No tool calls found in chat completion response.');
}

const toolCall = toolCalls[0];
const functionArguments = JSON.parse(toolCall.function.arguments);

// Correct key might be "image_url" not "url"
const imageURL = functionArguments.image_url || functionArguments.url;

if (!imageURL) {
  throw new Error('No image URL found in tool call function output.');
};

    const qrCodeBuffer = await generateQRCode('https://doi.org/' + doi);
    const finalImageUrl = await mergeImages(imageURL, qrCodeBuffer);

    res.status(200).json({ imageURL: finalImageUrl });
  } catch (err) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: 'Failed to generate visual abstract.' });
  }
}

