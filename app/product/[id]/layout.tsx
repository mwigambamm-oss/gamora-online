import type { Metadata } from "next";
import { getProductById } from "@/lib/products";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

const baseUrl = "https://gamoraonline.co.tz";

async function getProductData(id: string) {
  return getProductById(Number(id));
}

function getImageUrl(image: string): string {
  if (image.startsWith("http")) {
    return image;
  }

  return `${baseUrl}${image.startsWith("/") ? "" : "/"}${image}`;
}

function getProductImages(product: {
  image?: string;
  images?: string[];
}): string[] {
  const images = [
    ...(product.image ? [product.image] : []),
    ...(product.images ?? []),
  ]
    .filter(Boolean)
    .map(getImageUrl);

  return [...new Set(images)];
}

function getSeoDescription(product: {
  name: string;
  category: string;
  description?: string;
}): string {
  const fallback = `Buy ${product.name} online in Tanzania from GAMORA ONLINE. Shop quality ${product.category.toLowerCase()} products at competitive prices with convenient delivery.`;

  const source = product.description?.trim() || fallback;

  const cleaned = source
    .replace(/\s+/g, " ")
    .replace(/\n/g, " ")
    .trim();

  if (cleaned.length <= 155) {
    return cleaned;
  }

  return `${cleaned.slice(0, 152).trimEnd()}...`;
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductData(id);

  if (!product) {
    return {
      title: "Product Not Found | GAMORA ONLINE",
      description:
        "This product could not be found on GAMORA ONLINE.",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const productUrl = `${baseUrl}/product/${product.id}`;
  const description = getSeoDescription(product);
  const productImages = getProductImages(product);
  const imageUrl =
    productImages[0] || `${baseUrl}/og-image.png`;

  return {
    title: `${product.name} | GAMORA ONLINE`,
    description,

    alternates: {
      canonical: productUrl,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },

    openGraph: {
      title: `${product.name} | GAMORA ONLINE`,
      description,
      url: productUrl,
      siteName: "GAMORA ONLINE",
      locale: "en_TZ",
      type: "website",
      images: productImages.length
        ? productImages.map((url) => ({
            url,
            alt: product.name,
          }))
        : [
            {
              url: imageUrl,
              alt: product.name,
            },
          ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${product.name} | GAMORA ONLINE`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: Props) {
  const { id } = await params;
  const product = await getProductData(id);

  if (!product) {
    return children;
  }

  const productUrl = `${baseUrl}/product/${product.id}`;
  const description = getSeoDescription(product);
  const productImages = getProductImages(product);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "GAMORA ONLINE",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category,
        item: `${baseUrl}/category/${encodeURIComponent(product.category)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    category: product.category,
    image: productImages.length
      ? productImages
      : [`${baseUrl}/og-image.png`],
    url: productUrl,

    brand: {
      "@type": "Brand",
      name: "GAMORA ONLINE",
    },

    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "TZS",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "GAMORA ONLINE",
        url: baseUrl,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      {children}
    </>
  );
}
