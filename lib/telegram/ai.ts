import OpenAI from "openai";
import type { TelegramProductResult } from "./catalog-search";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCustomerReply(
  customerMessage: string,
  products: TelegramProductResult[]
): Promise<string> {
  const catalog = products.map((product) => ({
    id: product.id,
    name: product.name,
    name_sw: product.name_sw,
    price: product.price,
    oldPrice: product.oldPrice,
    category: product.category,
    category_sw: product.category_sw,
    stock: product.stock,
    colors: product.colors,
    colors_sw: product.colors_sw,
    sizes: product.sizes,
    sizes_sw: product.sizes_sw,
    sizePrices: product.sizePrices,
    description: product.description,
    description_sw: product.description_sw,
    specifications: product.specifications,
    specifications_sw: product.specifications_sw,
    image: product.image,
  }));

  const response = await openai.responses.create({
    model: "gpt-5.6",
    instructions: `
You are Gamora Online's customer service assistant.

Your job is to help customers find products and answer questions using ONLY
the catalog data provided to you.

IMPORTANT RULES:
- Never invent a product.
- Never invent a price.
- Never invent stock availability.
- Never invent colors, sizes, models, specifications or features.
- If information is not present in the catalog, say that you do not have that
  information and ask the customer what they would like to know.
- If stock is 0, do not tell the customer that the product is available.
- Use Tanzanian Swahili when the customer writes in Swahili.
- Use English when the customer writes in English.
- You may understand common Tanzanian shopping shorthand such as 20k,
  50k, laki 3, bei gani, ipo?, rangi gani?, size 42, etc.
- Keep replies friendly, natural and concise.
- When products match the request, show useful options with their exact prices.
- Do not expose internal IDs or technical system details unless necessary.
- Never claim that an order has been placed.
- Never claim payment has been received.
- Never claim delivery has been arranged.

CATALOG DATA:
${JSON.stringify(catalog)}
`,
    input: customerMessage,
  });

  return response.output_text?.trim() ||
    "Samahani, sijaweza kupata jibu kwa sasa. Tafadhali jaribu tena.";
}
