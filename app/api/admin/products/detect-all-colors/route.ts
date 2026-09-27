import { NextResponse } from "next/server";
import {
  getProducts,
  updateProduct,
} from "@/lib/products";
import {
  detectProductColors,
} from "@/lib/product-color/detector";

export async function POST() {
  const products = await getProducts();

  let success = 0;
  let failed = 0;
  let skipped = 0;

  const results: any[] = [];

  for (const product of products) {
    const images = [
      ...(product.images || []),
      ...(product.image ? [product.image] : []),
    ].filter(
      (image): image is string =>
        typeof image === "string" &&
        image.trim().length > 0
    );

    const uniqueImages = [...new Set(images)];

    console.log(
      `[COLOUR ${product.id}] ${product.name} — ${uniqueImages.length} images`
    );

    if (!uniqueImages.length) {
      skipped++;
      results.push({
        id: product.id,
        name: product.name,
        status: "skipped",
        colors: [],
      });
      continue;
    }

    try {
      const result =
        await detectProductColors(uniqueImages);

      if (
        !result.success ||
        !result.image_detections.length
      ) {
        failed++;
        results.push({
          id: product.id,
          name: product.name,
          status: "failed",
          colors: [],
          error:
            result.error ||
            "No colours detected",
        });
        continue;
      }

      const imageColorMap: Record<
        string,
        {
          images: string[];
          confidence: number;
        }
      > = {};

      for (const detection of result.image_detections) {
        if (
          !detection.image ||
          !detection.detectedColor
        ) {
          continue;
        }

        const color =
          detection.detectedColor.trim();

        if (!color) continue;

        if (!imageColorMap[color]) {
          imageColorMap[color] = {
            images: [],
            confidence:
              Number(detection.confidence) || 0,
          };
        }

        imageColorMap[color].images.push(
          detection.image
        );

        imageColorMap[color].confidence =
          Math.max(
            imageColorMap[color].confidence,
            Number(detection.confidence) || 0
          );
      }

      for (const color of Object.keys(imageColorMap)) {
        imageColorMap[color].images = [
          ...new Set(
            imageColorMap[color].images
          ),
        ];
      }

      const colors = [
        ...new Set(
          result.image_detections
            .map((item) =>
              item.detectedColor?.trim()
            )
            .filter(
              (color): color is string =>
                Boolean(color)
            )
        ),
      ];

      if (!colors.length) {
        failed++;
        results.push({
          id: product.id,
          name: product.name,
          status: "failed",
          colors: [],
          error: "No usable colours detected",
        });
        continue;
      }

      await updateProduct(product.id, {
        colors,
        image_color_map: imageColorMap,
      });

      success++;

      results.push({
        id: product.id,
        name: product.name,
        status: "success",
        images: uniqueImages.length,
        colors,
        image_color_map: imageColorMap,
      });

      console.log(
        `[COLOUR ${product.id}] SAVED: ${colors.join(", ")}`
      );
    } catch (error) {
      failed++;

      results.push({
        id: product.id,
        name: product.name,
        status: "failed",
        colors: [],
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }
  }

  return NextResponse.json({
    success: true,
    total: products.length,
    successful: success,
    failed,
    skipped,
    results,
  });
}
