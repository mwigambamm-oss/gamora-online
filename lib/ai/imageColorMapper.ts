import {
  pipeline,
  env,
  type ZeroShotImageClassificationOutput,
} from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = false;

let classifierPromise: ReturnType<typeof pipeline> | null = null;

async function getClassifier() {
  if (!classifierPromise) {
    classifierPromise = pipeline(
      "zero-shot-image-classification",
      "Xenova/clip-vit-base-patch32"
    );
  }

  return classifierPromise;
}

function normalizeColor(color: string) {
  return color.trim().toLowerCase();
}

function colorPrompt(color: string) {
  return `a product that is ${color}`;
}

export async function analyzeProductImageColors(
  images: string[],
  colors: string[]
): Promise<
  Record<
    string,
    {
      images: string[];
      confidence: number;
    }
  >
> {
  const validImages = images.filter(Boolean);
  const validColors = colors
    .map((c) => c?.trim())
    .filter(Boolean);

  if (!validImages.length || !validColors.length) {
    return {};
  }

  const classifier = await getClassifier();

  const result: Record<
    string,
    {
      images: string[];
      confidence: number;
    }
  > = {};

  for (const imageUrl of validImages) {
    try {
      const predictions = (await (classifier as any)(
        imageUrl,
        validColors.map(colorPrompt)
      )) as ZeroShotImageClassificationOutput;

      if (!Array.isArray(predictions) || !predictions.length) {
        continue;
      }

      const best = predictions[0];

      if (!best?.label || typeof best.score !== "number") {
        continue;
      }

      const colorIndex = validColors.findIndex(
        (color) => colorPrompt(color) === best.label
      );

      if (colorIndex === -1) {
        continue;
      }

      const color = validColors[colorIndex];

      // Avoid confidently assigning weak visual matches.
      if (best.score < 0.35) {
        continue;
      }

      if (!result[color]) {
        result[color] = {
          images: [],
          confidence: best.score,
        };
      }

      result[color].images.push(imageUrl);

      result[color].confidence = Math.max(
        result[color].confidence,
        best.score
      );
    } catch (error) {
      console.error(
        `Local color analysis failed for image ${imageUrl}:`,
        error
      );
    }
  }

  // Remove duplicate URLs.
  for (const color of Object.keys(result)) {
    result[color].images = [
      ...new Set(result[color].images),
    ];
  }

  return result;
}
