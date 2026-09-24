import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

import {
  COLOR_DETECTION_THRESHOLD,
  DETECTION_TIMEOUT_MS,
} from "./thresholds";

import type {
  ColorDetectionResponse,
  DetectedColor,
  ImageColorDetection,
} from "./types";

const execFileAsync = promisify(execFile);

type PythonResponse = {
  success?: boolean;
  threshold?: number;
  images_analyzed?: number;
  colors?: string[];
  image_detections?: ImageColorDetection[];
  error?: string;
};

export async function detectProductColors(
  imagePaths: string[]
): Promise<ColorDetectionResponse> {
  const uniqueImages = [
    ...new Set(
      imagePaths.filter(
        (image) =>
          typeof image === "string" &&
          image.trim()
      )
    ),
  ];

  if (!uniqueImages.length) {
    return {
      success: false,
      threshold: COLOR_DETECTION_THRESHOLD,
      images_analyzed: 0,
      colors: [],
      image_detections: [],
      error: "Product has no images",
    };
  }

  const python = path.join(
    process.cwd(),
    "python/color_detector/.venv/bin/python"
  );

  const script = path.join(
    process.cwd(),
    "python/color_detector/detect_product_colors_final.py"
  );

  try {
    const { stdout, stderr } =
      await execFileAsync(
        python,
        [
          script,
          ...uniqueImages,
        ],
        {
          timeout: DETECTION_TIMEOUT_MS * 2,
          maxBuffer: 8 * 1024 * 1024,
        }
      );

    if (stderr.trim()) {
      console.error(
        "Colour detector:",
        stderr.trim()
      );
    }

    const result =
      JSON.parse(stdout.trim()) as PythonResponse;

    const imageDetections =
      Array.isArray(
        result.image_detections
      )
        ? result.image_detections
        : [];

    const detectedNames =
      Array.isArray(result.colors)
        ? result.colors.filter(
            (name): name is string =>
              typeof name === "string" &&
              name.trim().length > 0
          )
        : [];

    const colors: DetectedColor[] =
      detectedNames.map((name) => {
        const detectionsForColor =
          imageDetections.filter(
            (item) =>
              item.detectedColor
                .toLowerCase() ===
              name.toLowerCase()
          );

        const confidence =
          detectionsForColor.reduce(
            (
              highest,
              item
            ) =>
              Math.max(
                highest,
                Number(
                  item.confidence
                ) || 0
              ),
            0
          );

        return {
          name,
          confidence:
            Math.round(
              confidence * 100
            ) / 100,
        };
      });

    if (!colors.length) {
      return {
        success: false,
        threshold:
          result.threshold ??
          COLOR_DETECTION_THRESHOLD,
        images_analyzed:
          result.images_analyzed ?? 0,
        colors: [],
        image_detections:
          imageDetections,
        error:
          result.error ??
          "Unable to detect product colours",
      };
    }

    return {
      success: true,
      threshold:
        result.threshold ??
        COLOR_DETECTION_THRESHOLD,
      images_analyzed:
        result.images_analyzed ??
        imageDetections.filter(
          (item) =>
            Boolean(
              item.detectedColor
            )
        ).length,
      colors,
      image_detections:
        imageDetections,
    };
  } catch (error) {
    console.error(
      "Final product colour detector failed:",
      error
    );

    return {
      success: false,
      threshold:
        COLOR_DETECTION_THRESHOLD,
      images_analyzed: 0,
      colors: [],
      image_detections: [],
      error:
        error instanceof Error
          ? error.message
          : "Unable to detect product colours",
    };
  }
}
