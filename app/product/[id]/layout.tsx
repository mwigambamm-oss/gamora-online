import type { Metadata } from "next";
import { getProductById } from "@/lib/products";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(Number(id));

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

export default function ProductLayout({
  children,
}: Props) {
  return children;
}
