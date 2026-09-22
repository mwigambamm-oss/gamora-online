import type { Metadata } from "next";

type Props = {
  children: React.ReactNode;
  params: Promise<{ name: string }>;
};

const baseUrl = "https://gamoraonline.co.tz";

const categorySEO: Record<
  string,
  {
    title: string;
    description: string;
  }
> = {
  "Women's Fashion": {
    title: "Women's Fashion | Buy Women's Fashion Online in Tanzania | GAMORA ONLINE",
    description:
      "Shop women's fashion online in Tanzania at GAMORA ONLINE. Discover clothing, handbags, accessories and more with convenient delivery.",
  },
  "Men's Fashion": {
    title: "Men's Fashion | Buy Men's Fashion Online in Tanzania | GAMORA ONLINE",
    description:
      "Shop men's fashion online in Tanzania at GAMORA ONLINE. Discover clothing, accessories, footwear and more.",
  },
  Shoes: {
    title: "Shoes | Buy Shoes Online in Tanzania | GAMORA ONLINE",
    description:
      "Shop shoes online in Tanzania at GAMORA ONLINE. Discover men's, women's and everyday footwear at competitive prices.",
  },
  "Phones & Electronics": {
    title: "Phones & Electronics | GAMORA ONLINE",
    description:
      "Shop phones, electronics and accessories online in Tanzania at GAMORA ONLINE.",
  },
  "Home & Kitchen": {
    title: "Home & Kitchen | Buy Home Products Online in Tanzania | GAMORA ONLINE",
    description:
      "Shop home and kitchen products online in Tanzania at GAMORA ONLINE. Find practical products for everyday living.",
  },
  Accessories: {
    title: "Accessories | Shop Online in Tanzania | GAMORA ONLINE",
    description:
      "Discover accessories online in Tanzania at GAMORA ONLINE, including everyday fashion and lifestyle accessories.",
  },
  "Beauty & Personal Care": {
    title: "Beauty & Personal Care | GAMORA ONLINE",
    description:
      "Shop beauty and personal care products online in Tanzania at GAMORA ONLINE.",
  },
  "Computers & Accessories": {
    title: "Computers & Accessories | GAMORA ONLINE",
    description:
      "Shop computers and computer accessories online in Tanzania at GAMORA ONLINE.",
  },
  "Baby & Kids": {
    title: "Baby & Kids | Shop Online in Tanzania | GAMORA ONLINE",
    description:
      "Shop baby and kids products online in Tanzania at GAMORA ONLINE.",
  },
  "Sports & Fitness": {
    title: "Sports & Fitness | GAMORA ONLINE",
    description:
      "Shop sports and fitness products online in Tanzania at GAMORA ONLINE.",
  },
  Automotive: {
    title: "Automotive | Shop Automotive Products Online | GAMORA ONLINE",
    description:
      "Shop automotive products and accessories online in Tanzania at GAMORA ONLINE.",
  },
  "Tools & Hardware": {
    title: "Tools & Hardware | GAMORA ONLINE",
    description:
      "Shop tools and hardware products online in Tanzania at GAMORA ONLINE.",
  },
  "Books & Stationery": {
    title: "Books & Stationery | GAMORA ONLINE",
    description:
      "Shop books and stationery online in Tanzania at GAMORA ONLINE.",
  },
  "Jewelry & Watches": {
    title: "Jewelry & Watches | Buy Online in Tanzania | GAMORA ONLINE",
    description:
      "Shop jewelry and watches online in Tanzania at GAMORA ONLINE.",
  },
  Furniture: {
    title: "Furniture | Shop Furniture Online in Tanzania | GAMORA ONLINE",
    description:
      "Shop furniture online in Tanzania at GAMORA ONLINE.",
  },
  "Garden & Outdoor": {
    title: "Garden & Outdoor | GAMORA ONLINE",
    description:
      "Shop garden and outdoor products online in Tanzania at GAMORA ONLINE.",
  },
  "Health & Wellness": {
    title: "Health & Wellness | GAMORA ONLINE",
    description:
      "Shop health and wellness products online in Tanzania at GAMORA ONLINE.",
  },
  Gaming: {
    title: "Gaming | Gaming Products Online in Tanzania | GAMORA ONLINE",
    description:
      "Shop gaming products and accessories online in Tanzania at GAMORA ONLINE.",
  },
};

function getCategoryName(name: string) {
  return decodeURIComponent(name || "").trim();
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { name } = await params;
  const categoryName = getCategoryName(name);

  const seo = categorySEO[categoryName];

  const title =
    seo?.title ||
    `${categoryName} | Shop Online in Tanzania | GAMORA ONLINE`;

  const description =
    seo?.description ||
    `Shop ${categoryName} products online in Tanzania at GAMORA ONLINE. Discover quality products with convenient delivery.`;

  const canonicalUrl = `${baseUrl}/category/${encodeURIComponent(
    categoryName
  )}`;

  return {
    title,
    description,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "GAMORA ONLINE",
      locale: "en_TZ",
      type: "website",
    },

    twitter: {
      card: "summary",
      title,
      description,
    },

    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function CategoryLayout({ children }: Props) {
  return children;
}
