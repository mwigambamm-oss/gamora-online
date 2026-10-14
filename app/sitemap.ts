import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products";

const baseUrl = "https://gamoraonline.co.tz";
const PAGE_SIZE = 500;

// Refresh periodically so newly added products can enter the sitemap.
export const revalidate = 3600;

const categories = [
  "Women's Fashion",
  "Men's Fashion",
  "Shoes",
  "Phones & Electronics",
  "Home & Kitchen",
  "Accessories",
  "Beauty & Personal Care",
  "Computers & Accessories",
  "Baby & Kids",
  "Sports & Fitness",
  "Automotive",
  "Tools & Hardware",
  "Books & Stationery",
  "Jewelry & Watches",
  "Furniture",
  "Garden & Outdoor",
  "Health & Wellness",
  "Gaming",
];

async function getAllProductUrls(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [];
  let offset = 0;

  while (true) {
    const batch = await getProducts({ limit: PAGE_SIZE, offset });

    urls.push(
      ...batch
        .filter((product) => product?.id)
        .map((product) => ({
          url: `${baseUrl}/product/${product.id}`,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
    );

    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return urls;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productUrls = await getAllProductUrls();

  const categoryResults = await Promise.all(
    categories.map(async (category) => ({
      category,
      products: await getProducts({ category, limit: 1 }),
    }))
  );

  const categoryUrls: MetadataRoute.Sitemap = categoryResults
    .filter(({ products }) => products.length > 0)
    .map(({ category }) => ({
      url: `${baseUrl}/category/${encodeURIComponent(category)}`,
      changeFrequency: "daily",
      priority: 0.7,
    }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/all-products`, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/help`, changeFrequency: "monthly", priority: 0.4 },
  ];

  return [...staticUrls, ...categoryUrls, ...productUrls];
}
