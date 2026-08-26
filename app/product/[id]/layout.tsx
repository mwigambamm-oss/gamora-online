import type { Metadata } from "next";
import { getProductById } from "@/lib/products";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

async function getProductData(id: string) {
  return getProductById(Number(id));
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
    };
  }

  const baseUrl = "https://gamoraonline.co.tz";
  const productUrl = `${baseUrl}/product/${product.id}`;

  const description =
    product.description ||
    `Buy ${product.name} online in Tanzania from GAMORA ONLINE. Quality products at great prices with convenient delivery.`;

  const imageUrl = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `${baseUrl}${product.image.startsWith("/") ? "" : "/"}${product.image}`
    : `${baseUrl}/og-image.png`;

  return {
    title: `${product.name} | GAMORA ONLINE`,
    description,

    alternates: {
      canonical: productUrl,
    },

    openGraph: {
      title: `${product.name} | GAMORA ONLINE`,
      description,
      url: productUrl,
      siteName: "GAMORA ONLINE",
      locale: "en_TZ",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
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

  const baseUrl = "https://gamoraonline.co.tz";
  const productUrl = `${baseUrl}/product/${product.id}`;

  const description =
    product.description ||
    `Buy ${product.name} online in Tanzania from GAMORA ONLINE. Quality products at great prices with convenient delivery.`;

  const imageUrl = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `${baseUrl}${product.image.startsWith("/") ? "" : "/"}${product.image}`
    : `${baseUrl}/og-image.png`;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    image: [imageUrl],
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

      {children}
    </>
  );
}
