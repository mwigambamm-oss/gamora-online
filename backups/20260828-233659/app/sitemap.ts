import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://gamoraonline.co.tz";

  const products = await getProducts();

  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/contact`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  return [...staticUrls, ...productUrls];
}
