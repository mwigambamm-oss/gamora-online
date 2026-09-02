import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function translateToSwahili(text: string): Promise<string> {
  if (!text?.trim()) return "";

  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: `Translate the following ecommerce product content from English to natural Tanzanian Swahili.

Rules:
- Keep product names, model numbers, brand names and technical specifications unchanged where appropriate.
- Do not translate brand names.
- Keep numbers, RAM, SSD, screen sizes and model numbers accurate.
- Return only the Swahili translation, with no explanation.

Text:
${text}`,
  });

  return response.output_text.trim();
}
