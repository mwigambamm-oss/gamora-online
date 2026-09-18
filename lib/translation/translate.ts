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


export async function translateSpecificationsToSwahili(
  specifications: Record<string, string>
): Promise<Record<string, string>> {
  if (!specifications || Object.keys(specifications).length === 0) {
    return {};
  }

  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(specifications)) {
    const translated = await translateToSwahili(`${key}: ${value}`);
    const separator = translated.indexOf(":");

    if (separator !== -1) {
      const translatedKey = translated.slice(0, separator).trim();
      const translatedValue = translated.slice(separator + 1).trim();

      if (translatedKey && translatedValue) {
        result[translatedKey] = translatedValue;
        continue;
      }
    }

    result[key] = await translateToSwahili(value);
  }

  return result;
}
