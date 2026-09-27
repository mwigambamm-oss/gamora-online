import {
  getProducts,
  updateProduct,
} from "../lib/products";

import {
  detectProductColors,
} from "../lib/product-color/detector";

async function main() {
  console.log("========================================");
  console.log(" GAMORA - AUTO PRODUCT COLOUR DETECTOR");
  console.log("========================================");
  console.log("");

  const products = await getProducts();

  console.log(`Products found: ${products.length}`);
  console.log("");

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (let index = 0; index < products.length; index++) {
    const product = products[index];

    const images = [
      ...(product.images || []),
      ...(product.image ? [product.image] : []),
    ].filter(
      (image): image is string =>
        typeof image === "string" &&
        image.trim().length > 0
    );

    const uniqueImages = [
      ...new Set(images),
    ];

    console.log(
      `[${index + 1}/${products.length}] ${product.id} - ${product.name}`
    );
    console.log(
      `  Images: ${uniqueImages.length}`
    );

    if (!uniqueImages.length) {
      console.log("  SKIPPED: no images");
      console.log("");
      skipped++;
      continue;
    }

    try {
      const result =
        await detectProductColors(
          uniqueImages
        );

      if (
        !result.success ||
        !result.colors.length ||
        !result.image_detections.length
      ) {
        console.log(
          `  FAILED: ${result.error || "No colours detected"}`
        );
        console.log(
          "  Existing colours were NOT changed."
        );
        console.log("");
        failed++;
        continue;
      }

      const imageColorMap: Record<
        string,
        {
          images: string[];
          confidence: number;
        }
      > = {};

      for (
        const detection
        of result.image_detections
      ) {
        if (
          !detection.image ||
          !detection.detectedColor
        ) {
          continue;
        }

        const detectedColor =
          detection.detectedColor.trim();

        if (!detectedColor) {
          continue;
        }

        if (
          !imageColorMap[detectedColor]
        ) {
          imageColorMap[detectedColor] = {
            images: [],
            confidence:
              Number(
                detection.confidence
              ) || 0,
          };
        }

        imageColorMap[
          detectedColor
        ].images.push(
          detection.image
        );

        imageColorMap[
          detectedColor
        ].confidence =
          Math.max(
            imageColorMap[
              detectedColor
            ].confidence,
            Number(
              detection.confidence
            ) || 0
          );
      }

      for (
        const color of Object.keys(
          imageColorMap
        )
      ) {
        imageColorMap[color].images = [
          ...new Set(
            imageColorMap[color].images
          ),
        ];
      }

      const detectedProductColors = [
        ...new Set(
          result.image_detections
            .map(
              (item) =>
                item.detectedColor?.trim()
            )
            .filter(
              (
                color
              ): color is string =>
                Boolean(color)
            )
        ),
      ];

      if (
        !detectedProductColors.length
      ) {
        console.log(
          "  FAILED: detector returned no usable colours."
        );
        console.log(
          "  Existing colours were NOT changed."
        );
        console.log("");
        failed++;
        continue;
      }

      await updateProduct(
        Number(product.id),
        {
          colors:
            detectedProductColors,
          image_color_map:
            imageColorMap,
        }
      );

      console.log(
        `  SAVED: ${detectedProductColors.join(", ")}`
      );

      console.log(
        `  Mapped images: ${Object.values(
          imageColorMap
        ).reduce(
          (total, item) =>
            total + item.images.length,
          0
        )}`
      );

      success++;
      console.log("");
    } catch (error) {
      console.log(
        `  ERROR: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
      console.log(
        "  Existing colours were NOT changed."
      );
      console.log("");
      failed++;
    }
  }

  console.log("========================================");
  console.log(" COMPLETE");
  console.log("========================================");
  console.log(`Successful: ${success}`);
  console.log(`Failed:     ${failed}`);
  console.log(`Skipped:    ${skipped}`);
  console.log(`Total:      ${products.length}`);
  console.log("========================================");
}

main().catch((error) => {
  console.error("");
  console.error(
    "BATCH DETECTOR FAILED:",
    error
  );
  process.exit(1);
});
