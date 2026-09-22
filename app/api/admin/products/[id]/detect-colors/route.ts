import { NextResponse } from "next/server";
import { updateProduct, getProductById } from "@/lib/products";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

type Detection = {
  color: string;
  confidence: number;
  coverage: number;
};

type ImageDetection = {
  image: string;
  detectedColor: string;
  confidence: number;
  coverage: number;
  alternatives: Detection[];
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = Number(id);

    const product = await getProductById(productId);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    const images = [
      ...(product.images || []),
      ...(product.image ? [product.image] : []),
    ].filter(Boolean);

    const colors = (product.colors || [])
      .map((color) => color.trim())
      .filter(Boolean);

    if (!images.length || !colors.length) {
      return NextResponse.json(
        {
          success: false,
          error: !images.length
            ? "Product has no images"
            : "Product has no colors",
        },
        { status: 400 }
      );
    }

    const python = path.join(
      process.cwd(),
      "python/color_detector/.venv/bin/python"
    );

    const script = path.join(
      process.cwd(),
      "python/color_detector/detect_color.py"
    );

    const imageDetections: ImageDetection[] = [];

    for (const image of [...new Set(images)]) {
      try {
        const detectorArgs = colors.length
          ? [script, image]
          : [script, image];

        const { stdout } = await execFileAsync(
          python,
          detectorArgs,
          {
            timeout: 60000,
            maxBuffer: 1024 * 1024,
          }
        );

        const result = JSON.parse(stdout);

        if (!result.success || !Array.isArray(result.results)) {
          continue;
        }

        const detections = result.results as Detection[];

        // Keep only strong, meaningful colours.
        // Small colour areas are usually background, reflections,
        // shadows or image noise.
        // Seller-entered product colours remain unchanged.
        const meaningfulDetections = detections
          .filter(
            (item) =>
              item.coverage >= 0.12 &&
              item.confidence >= 0.45
          )
          .sort(
            (a, b) =>
              b.coverage - a.coverage ||
              b.confidence - a.confidence
          )
          .slice(0, 5);

        if (!meaningfulDetections.length) {
          continue;
        }

        for (const detection of meaningfulDetections) {
          const matchedColor =
            colors.find(
              (color) =>
                color.toLowerCase() === detection.color.toLowerCase()
            ) || detection.color;

          imageDetections.push({
            image,
            detectedColor: matchedColor,
            confidence: detection.confidence,
            coverage: detection.coverage,
            alternatives: meaningfulDetections.slice(0, 5),
          });
        }
      } catch (error) {
        console.error(
          "OpenCV failed for image:",
          image,
          error
        );
      }
    }

    const imageColorMap: Record<
      string,
      { images: string[]; confidence: number }
    > = {};

    for (const detection of imageDetections) {
      const color = detection.detectedColor;

      if (!imageColorMap[color]) {
        imageColorMap[color] = {
          images: [],
          confidence: detection.confidence,
        };
      }

      imageColorMap[color].images.push(detection.image);

      imageColorMap[color].confidence = Math.max(
        imageColorMap[color].confidence,
        detection.confidence
      );
    }

    for (const color of Object.keys(imageColorMap)) {
      imageColorMap[color].images = [
        ...new Set(imageColorMap[color].images),
      ];
    }

    // Build the product colour list from strong image detections.
    // A colour must occupy at least 18% of the detected product
    // area in at least one image to become a product colour.
    const detectedProductColors = [
      ...new Set(
        imageDetections
          .filter(
            (detection) =>
              detection.coverage >= 0.08 &&
              detection.confidence >= 0.45
          )
          .map((detection) => detection.detectedColor)
      ),
    ];

    // Persist both the image-to-colour mapping and detected
    // product colours. Seller-entered colours are replaced only
    // after successful image detection.
    await updateProduct(productId, {
      image_color_map: imageColorMap,
      colors: detectedProductColors,
    });

    return NextResponse.json({
      success: true,
      productId,
      image_color_map: imageColorMap,
      imageDetections,
      colors: detectedProductColors,
    });
  } catch (error) {
    console.error(
      "OpenCV color detection failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "OpenCV color detection failed",
      },
      { status: 500 }
    );
  }
}
