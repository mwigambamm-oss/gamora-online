import { NextResponse } from "next/server";

type SocialProduct = {
  id?: number | string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  category?: string;
};

const GRAPH_API_VERSION =
  process.env.META_GRAPH_API_VERSION || "v23.0";

const GRAPH_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function buildCaption(product: SocialProduct) {
  const price = Number(product.price || 0).toLocaleString("en-US");

  return [
    `🛍️ ${product.name}`,
    "",
    product.description || "Available now on Gamora Online.",
    "",
    `💰 Price: TSh ${price}`,
    product.category ? `📂 Category: ${product.category}` : "",
    "",
    "🛒 Order now on Gamora Online",
    process.env.NEXT_PUBLIC_SITE_URL || "",
    "",
    "#GamoraOnline #Gamora #Tanzania #OnlineShopping",
  ]
    .filter(Boolean)
    .join("\n");
}

async function graphRequest(
  endpoint: string,
  body: Record<string, string>
) {
  const response = await fetch(`${GRAPH_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(
      data?.error?.message ||
        `Meta API request failed (${response.status})`
    );
  }

  return data;
}

async function publishToFacebook(product: SocialProduct) {
  const pageId = getRequiredEnv("META_FACEBOOK_PAGE_ID");
  const accessToken = getRequiredEnv("META_PAGE_ACCESS_TOKEN");

  const caption = buildCaption(product);

  if (!product.image) {
    throw new Error("Product has no image for Facebook post.");
  }

  return graphRequest(`${pageId}/photos`, {
    url: product.image,
    caption,
    access_token: accessToken,
  });
}

async function publishToInstagram(product: SocialProduct) {
  const instagramAccountId =
    getRequiredEnv("META_INSTAGRAM_ACCOUNT_ID");

  const accessToken = getRequiredEnv("META_PAGE_ACCESS_TOKEN");

  if (!product.image) {
    throw new Error("Product has no image for Instagram post.");
  }

  const caption = buildCaption(product);

  const container = await graphRequest(
    `${instagramAccountId}/media`,
    {
      image_url: product.image,
      caption,
      access_token: accessToken,
    }
  );

  if (!container?.id) {
    throw new Error(
      "Instagram media container was not created."
    );
  }

  return graphRequest(
    `${instagramAccountId}/media_publish`,
    {
      creation_id: container.id,
      access_token: accessToken,
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const product = body?.product as SocialProduct | undefined;

    if (!product?.name || !product?.price) {
      return NextResponse.json(
        {
          success: false,
          error: "Product name and price are required.",
        },
        { status: 400 }
      );
    }

    const results: {
      facebook?: unknown;
      instagram?: unknown;
    } = {};

    const errors: {
      facebook?: string;
      instagram?: string;
    } = {};

    try {
      results.facebook = await publishToFacebook(product);
    } catch (error) {
      errors.facebook =
        error instanceof Error
          ? error.message
          : "Facebook publishing failed.";
    }

    try {
      results.instagram =
        await publishToInstagram(product);
    } catch (error) {
      errors.instagram =
        error instanceof Error
          ? error.message
          : "Instagram publishing failed.";
    }

    const success =
      Boolean(results.facebook) ||
      Boolean(results.instagram);

    return NextResponse.json(
      {
        success,
        results,
        errors,
      },
      {
        status: success ? 200 : 500,
      }
    );
  } catch (error) {
    console.error(
      "Social publishing error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Social publishing failed.",
      },
      { status: 500 }
    );
  }
}
