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

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getProductById(Number(id));

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

    const imageColorMap: Record<
      string,
      { images: string[]; confidence: number }
    > = {};

    for (const image of [...new Set(images)]) {
      const { stdout } = await execFileAsync(
        python,
        [script, image, colors.join(",")],
        {
          timeout: 60000,
          maxBuffer: 1024 * 1024,
        }
      );

      const result = JSON.parse(stdout);

      if (!result.success || !Array.isArray(result.results)) continue;

      const best = result.results[0] as Detection | undefined;

      if (!best?.color) continue;

      const matchedColor = colors.find(
        (color) => color.toLowerCase() === best.color.toLowerCase()
      );

      if (!matchedColor) continue;

      if (!imageColorMap[matchedColor]) {
        imageColorMap[matchedColor] = {
          images: [],
          confidence: best.confidence,
        };
      }

      imageColorMap[matchedColor].images.push(image);
      imageColorMap[matchedColor].confidence = Math.max(
        imageColorMap[matchedColor].confidence,
        best.confidence
      );
    }

    for (const color of Object.keys(imageColorMap)) {
      imageColorMap[color].images = [
        ...new Set(imageColorMap[color].images),
      ];
    }

    await updateProduct(Number(id), {
      image_color_map: imageColorMap,
    });

    return NextResponse.json({
      success: true,
      productId: Number(id),
      image_color_map: imageColorMap,
    });
  } catch (error) {
    console.error("OpenCV color detection failed:", error);

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
