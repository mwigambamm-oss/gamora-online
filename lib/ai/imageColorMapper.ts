const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.6-flash";

export type ImageColorMapping = {
  [color: string]: {
    images: string[];
    confidence: number;
  };
};

type AnalysisResult = {
  image_index: number;
  color: string | null;
  confidence: number;
};

function extractJson(text: string): string {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return cleaned.slice(start, end + 1);
  }

  return cleaned;
}

function normalizeMimeType(contentType: string | null): string {
  const mime = (contentType || "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (
    mime === "image/jpeg" ||
    mime === "image/png" ||
    mime === "image/webp" ||
    mime === "image/gif"
  ) {
    return mime;
  }

  return "image/jpeg";
}

async function imageUrlToInlineData(imageUrl: string) {
  const response = await fetch(imageUrl, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch product image: ${response.status} ${response.statusText}`
    );
  }

  const mimeType = normalizeMimeType(
    response.headers.get("content-type")
  );

  const buffer = await response.arrayBuffer();

  return {
    mimeType,
    data: Buffer.from(buffer).toString("base64"),
  };
}

export async function analyzeProductImageColors(
  images: string[],
  colors: string[]
): Promise<ImageColorMapping> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to .env.local."
    );
  }

  const cleanImages = images.filter(
    (image): image is string =>
      typeof image === "string" && image.trim().length > 0
  );

  const cleanColors = colors
    .filter(
      (color): color is string =>
        typeof color === "string" && color.trim().length > 0
    )
    .map((color) => color.trim());

  if (cleanImages.length === 0 || cleanColors.length === 0) {
    return {};
  }

  const imageParts: Array<{
    type: "text" | "image";
    text?: string;
    mime_type?: string;
    data?: string;
  }> = [];

  for (let index = 0; index < cleanImages.length; index++) {
    const imageUrl = cleanImages[index];
    const inlineData = await imageUrlToInlineData(imageUrl);

    imageParts.push({
      type: "text",
      text: `IMAGE_INDEX: ${index}`,
    });

    imageParts.push({
      type: "image",
      mime_type: inlineData.mimeType,
      data: inlineData.data,
    });
  }

  const prompt = `
You are an expert visual product-variant classifier for an ecommerce marketplace.

The product has ONLY these allowed color variants:

${cleanColors.map((color, index) => `${index + 1}. ${color}`).join("\n")}

You will receive product images. Each image is preceded by an IMAGE_INDEX.

Your job is to inspect the ACTUAL PRODUCT visually and determine which allowed color variant the product represents.

STRICT VISUAL RULES:

1. Look at the actual physical product, not the filename, URL, image index, packaging, text, watermark, or background.
2. Ignore background colors.
3. Ignore tables, walls, floors, hands, clothing, boxes and other unrelated objects.
4. Judge the dominant visible color of the actual product.
5. Match ONLY to one of the allowed colors.
6. NEVER invent another color.
7. If the product is clearly BLACK, choose "Black".
8. If the product is clearly SILVER, choose "Silver".
9. Do not assume that all images show the same color.
10. Different images may represent different color variants.
11. If an image contains a product but the color cannot reliably be determined, return null for that image.
12. Analyze EVERY image exactly once.
13. Return exactly one result for every IMAGE_INDEX.
14. Confidence must be between 0 and 1.
15. Do not use the image filename to infer color.
16. Do not copy or invent URLs. Return only the numeric IMAGE_INDEX.

IMPORTANT:
If the allowed colors include visually different variants such as Black and Silver, actively compare the actual product color in every image before deciding.

Return ONLY valid JSON:

{
  "results": [
    {
      "image_index": 0,
      "color": "Silver",
      "confidence": 0.98
    },
    {
      "image_index": 1,
      "color": "Black",
      "confidence": 0.97
    }
  ]
}

For an uncertain image:

{
  "image_index": 2,
  "color": null,
  "confidence": 0.35
}
`;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        input: [
          {
            type: "text",
            text: prompt,
          },
          ...imageParts,
        ],
      }),
      cache: "no-store",
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Gemini API error ${response.status}: ${responseText}`
    );
  }

  let responseJson: any;

  try {
    responseJson = JSON.parse(responseText);
  } catch {
    throw new Error("Gemini returned invalid API JSON.");
  }

  const raw =
    responseJson?.steps
      ?.filter((step: any) => step?.type === "model_output")
      ?.flatMap((step: any) => step?.content || [])
      ?.filter((content: any) => content?.type === "text")
      ?.map((content: any) => content?.text || "")
      .join("")
      .trim() || "";

  if (!raw) {
    throw new Error(
      "Gemini returned an empty image analysis response."
    );
  }

  let parsed: { results?: AnalysisResult[] };

  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    console.error("GEMINI IMAGE COLOR INVALID JSON:", raw);
    throw new Error(
      "Gemini returned invalid color mapping JSON."
    );
  }

  if (!Array.isArray(parsed.results)) {
    throw new Error(
      "Gemini response does not contain a results array."
    );
  }

  const mapping: ImageColorMapping = {};

  for (const result of parsed.results) {
    if (
      !result ||
      typeof result.image_index !== "number" ||
      !Number.isInteger(result.image_index) ||
      result.image_index < 0 ||
      result.image_index >= cleanImages.length ||
      typeof result.confidence !== "number"
    ) {
      continue;
    }

    if (!result.color) {
      continue;
    }

    const matchedColor = cleanColors.find(
      (color) =>
        color.toLowerCase().trim() ===
        result.color?.toLowerCase().trim()
    );

    if (!matchedColor) {
      continue;
    }

    const imageUrl = cleanImages[result.image_index];

    if (!mapping[matchedColor]) {
      mapping[matchedColor] = {
        images: [],
        confidence: 0,
      };
    }

    if (!mapping[matchedColor].images.includes(imageUrl)) {
      mapping[matchedColor].images.push(imageUrl);
    }

    mapping[matchedColor].confidence = Math.max(
      mapping[matchedColor].confidence,
      Math.max(0, Math.min(1, result.confidence))
    );
  }

  return mapping;
}
