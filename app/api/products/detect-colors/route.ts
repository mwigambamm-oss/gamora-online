import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import {
  detectProductColors,
} from "@/lib/product-color/detector";

import {
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/product-color/thresholds";

function isAllowedImageUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

async function prepareImage(
  image: string,
  directory: string,
  index: number
): Promise<string> {
  if (image.startsWith("/")) {
    const localPath = path.join(
      process.cwd(),
      "public",
      image.replace(/^\/+/, "")
    );

    await fs.access(localPath);

    return localPath;
  }

  if (!isAllowedImageUrl(image)) {
    throw new Error(
      "Invalid product image URL"
    );
  }

  const response = await fetch(image, {
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `Unable to download product image (${response.status})`
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.startsWith("image/")) {
    throw new Error(
      "Product image URL did not return an image"
    );
  }

  const contentLength =
    Number(
      response.headers.get("content-length") || 0
    );

  if (
    contentLength >
    MAX_IMAGE_SIZE_BYTES
  ) {
    throw new Error(
      "Product image is too large"
    );
  }

  const buffer = Buffer.from(
    await response.arrayBuffer()
  );

  if (
    buffer.length >
    MAX_IMAGE_SIZE_BYTES
  ) {
    throw new Error(
      "Product image is too large"
    );
  }

  const extension =
    contentType.includes("png")
      ? ".png"
      : contentType.includes("webp")
      ? ".webp"
      : contentType.includes("gif")
      ? ".gif"
      : ".jpg";

  const output = path.join(
    directory,
    `product-${index}${extension}`
  );

  await fs.writeFile(
    output,
    buffer
  );

  return output;
}

export async function POST(
  request: Request
) {
  const temporaryDirectory =
    await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        "gamora-color-"
      )
    );

  try {
    const body =
      await request.json();

    const images: string[] =
      Array.isArray(body?.images)
        ? [
            ...new Set<string>(
              body.images.filter(
                (
                  value: unknown
                ): value is string =>
                  typeof value === "string" &&
                  value.trim().length > 0
              )
            ),
          ]
        : [];

    if (!images.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product has no images",
        },
        { status: 400 }
      );
    }

    if (images.length > 20) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A maximum of 20 product images can be analysed at once",
        },
        { status: 400 }
      );
    }

    const imagePaths: string[] = [];

    for (
      let index = 0;
      index < images.length;
      index++
    ) {
      imagePaths.push(
        await prepareImage(
          images[index],
          temporaryDirectory,
          index
        )
      );
    }

    const result =
      await detectProductColors(
        imagePaths
      );

    if (
      !result.success ||
      !result.colors.length
    ) {
      return NextResponse.json(
        {
          success: false,
          threshold:
            result.threshold,
          images_analyzed:
            result.images_analyzed,
          colors: [],
          error:
            "Unable to detect product colours. Please enter the colours manually or try again.",
        },
        { status: 422 }
      );
    }

    const imageDetections =
      Array.isArray(result.image_detections)
        ? result.image_detections.map(
            (item: any, detectionIndex: number) => {
              const originalImage =
                images[detectionIndex];

              return {
                ...item,
                image:
                  typeof originalImage === "string" &&
                  originalImage.trim()
                    ? originalImage
                    : item.image,
              };
            }
          )
        : [];

    return NextResponse.json({
      success: true,
      threshold:
        result.threshold,
      images_analyzed:
        result.images_analyzed,
      colors:
        result.colors,
      image_detections:
        imageDetections,
    });
  } catch (error) {
    console.error(
      "Product colour detection failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        colors: [],
        error:
          "Unable to detect product colours. Please enter the colours manually or try again.",
      },
      { status: 500 }
    );
  } finally {
    await fs.rm(
      temporaryDirectory,
      {
        recursive: true,
        force: true,
      }
    );
  }
}
