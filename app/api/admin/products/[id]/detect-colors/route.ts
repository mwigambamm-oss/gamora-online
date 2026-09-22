import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

type Detection = {
  color: string;
  confidence: number;
  coverage: number;
  percentage: number;
  decision: "auto" | "review";
};

type ImageDetection = {
  image: string;
  detectedColor: string;
  confidence: number;
  coverage: number;
  percentage: number;
  decision: "auto" | "review";
  alternatives: Detection[];
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const images: string[] =
      Array.isArray(body?.images)
        ? body.images.filter(
            (image: unknown): image is string =>
              typeof image === "string" &&
              image.trim().length > 0
          )
        : [];

    const colors = Array.isArray(body?.colors)
      ? body.colors
          .filter(
            (color: unknown): color is string =>
              typeof color === "string"
          )
          .map((color: string) => color.trim())
          .filter(Boolean)
      : [];

    if (!images.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Product has no images",
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

    const uniqueImages: string[] = [
      ...new Set(images),
    ];

    const imageDetections: ImageDetection[] = [];

    for (const image of uniqueImages) {
      try {
        const detectorArgs = [
          script,
          image,
          ...colors,
        ];

        const { stdout } =
          await execFileAsync(
            python,
            detectorArgs,
            {
              timeout: 30000,
              maxBuffer: 1024 * 1024,
            }
          );

        const result = JSON.parse(stdout);

        if (
          !result.success ||
          !Array.isArray(result.results)
        ) {
          continue;
        }

        const detections =
          result.results as Detection[];

        const meaningfulDetections =
          detections
            .filter(
              (item) =>
                item.coverage >= 0.025 &&
                item.percentage >= 0.025
            )
            .sort(
              (a, b) =>
                b.percentage -
                  a.percentage ||
                b.confidence -
                  a.confidence
            )
            .slice(0, 5);

        if (
          !meaningfulDetections.length
        ) {
          continue;
        }

        const topDetection =
          meaningfulDetections[0];

        imageDetections.push({
          image,
          detectedColor:
            topDetection.color,
          confidence:
            topDetection.confidence,
          coverage:
            topDetection.coverage,
          percentage:
            topDetection.percentage,
          decision:
            topDetection.decision,
          alternatives:
            meaningfulDetections,
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
      {
        images: string[];
        confidence: number;
      }
    > = {};

    for (const detection of imageDetections) {
      const color =
        detection.detectedColor;

      if (!imageColorMap[color]) {
        imageColorMap[color] = {
          images: [],
          confidence:
            detection.confidence,
        };
      }

      imageColorMap[color].images.push(
        detection.image
      );

      imageColorMap[color].confidence =
        Math.max(
          imageColorMap[color].confidence,
          detection.confidence
        );
    }

    for (const color of Object.keys(
      imageColorMap
    )) {
      imageColorMap[color].images = [
        ...new Set(
          imageColorMap[color].images
        ),
      ];
    }

    return NextResponse.json({
      success: true,
      colors,
      image_color_map:
        imageColorMap,
      imageDetections,
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
