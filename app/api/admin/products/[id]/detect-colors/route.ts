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
        const { stdout } = await execFileAsync(
          python,
          [script, image, colors.join(",")],
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

        const validDetections = detections.filter((item) =>
          colors.some(
            (color) =>
              color.toLowerCase() === item.color.toLowerCase()
          )
        );

        const best = validDetections[0];

        if (!best?.color) {
          continue;
        }

        const matchedColor =
          colors.find(
            (color) =>
              color.toLowerCase() === best.color.toLowerCase()
          ) || best.color;

        imageDetections.push({
          image,
          detectedColor: matchedColor,
          confidence: best.confidence,
          coverage: best.coverage,
          alternatives: validDetections.slice(0, 5),
        });
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

    await updateProduct(productId, {
      image_color_map: imageColorMap,
    });

    return NextResponse.json({
      success: true,
      productId,
      image_color_map: imageColorMap,
      imageDetections,
      colors,
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
