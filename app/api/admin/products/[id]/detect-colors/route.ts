import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import {
  getProductById,
  updateProduct,
} from "@/lib/products";

import {
  detectProductColors,
} from "@/lib/product-color/detector";

import {
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/product-color/thresholds";


function isAllowedImageUrl(
  value: string
) {
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
) {
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

  const response = await fetch(
    image,
    {
      signal:
        AbortSignal.timeout(
          30_000
        ),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Unable to download product image (${response.status})`
    );
  }

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    !contentType.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "Product image URL did not return an image"
    );
  }

  const buffer =
    Buffer.from(
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
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const temporaryDirectory =
    await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        "gamora-admin-color-"
      )
    );

  try {
    const { id } =
      await params;

    const productId =
      Number(id);

    const product =
      await getProductById(
        productId
      );

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product not found",
        },
        { status: 404 }
      );
    }

    const images = [
      ...(product.images || []),
      ...(product.image
        ? [product.image]
        : []),
    ].filter(
      (
        image
      ): image is string =>
        typeof image === "string" &&
        image.trim().length > 0
    );

    const uniqueImages = [
      ...new Set(images),
    ];

    if (!uniqueImages.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product has no images",
        },
        { status: 400 }
      );
    }

    const localImages: string[] =
      [];

    for (
      let index = 0;
      index < uniqueImages.length;
      index++
    ) {
      localImages.push(
        await prepareImage(
          uniqueImages[index],
          temporaryDirectory,
          index
        )
      );
    }

    const result =
      await detectProductColors(
        localImages
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
          image_detections:
            [],
          colors: [],
          error:
            result.error ??
            "Unable to detect product colours",
        },
        { status: 422 }
      );
    }

    /*
     * Convert temporary detector paths
     * back to the real product image URLs.
     */
    const imageColorMap: Record<
      string,
      {
        images: string[];
        confidence: number;
      }
    > = {};

    const imageDetections =
      result.image_detections.map(
        (detection) => {
          const match =
            localImages.findIndex(
              (localPath) =>
                localPath ===
                detection.image
            );

          const originalImage =
            match >= 0
              ? uniqueImages[match]
              : "";

          return {
            ...detection,
            image:
              originalImage,
          };
        }
      );

    for (
      const detection
      of imageDetections
    ) {
      if (
        !detection.image ||
        !detection.detectedColor
      ) {
        continue;
      }

      if (
        !imageColorMap[
          detection.detectedColor
        ]
      ) {
        imageColorMap[
          detection.detectedColor
        ] = {
          images: [],
          confidence:
            detection.confidence,
        };
      }

      imageColorMap[
        detection.detectedColor
      ].images.push(
        detection.image
      );

      imageColorMap[
        detection.detectedColor
      ].confidence =
        Math.max(
          imageColorMap[
            detection.detectedColor
          ].confidence,
          detection.confidence
        );
    }

    for (
      const color
      of Object.keys(
        imageColorMap
      )
    ) {
      imageColorMap[
        color
      ].images = [
        ...new Set(
          imageColorMap[
            color
          ].images
        ),
      ];
    }

    const detectedProductColors =
      [
        ...new Set(
          imageDetections
            .map(
              (item) =>
                item.detectedColor
            )
            .filter(Boolean)
        ),
      ];

    await updateProduct(
      productId,
      {
        image_color_map:
          imageColorMap,
        colors:
          detectedProductColors,
      }
    );

    return NextResponse.json({
      success: true,
      productId,
      threshold:
        result.threshold,
      images_analyzed:
        result.images_analyzed,
      image_color_map:
        imageColorMap,
      imageDetections,
      colors:
        detectedProductColors,
    });
  } catch (error) {
    console.error(
      "Admin product colour detection failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to detect product colours",
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
