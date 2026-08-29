import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  metadataBase: new URL("https://gamoraonline.co.tz"),

  title: {
    default: "Gamora Online | Online Shopping Tanzania",
    template: "%s",
  },

  description:
    "GAMORA ONLINE ni duka la mtandaoni Tanzania linalokupa bidhaa bora kwa bei nzuri. Nunua Fashion, Shoes, Handbags, Accessories, Phones, Home & Kitchen na bidhaa nyingine mbalimbali. Tunakuahakikishia ununuzi salama, bidhaa bora na delivery ya uhakika. Nunua online kwa urahisi kupitia Gamora Online.",

  keywords: [
    "Gamora Online",
    "online shopping Tanzania",
    "online shop Tanzania",
    "shopping online Dar es Salaam",
    "fashion Tanzania",
    "women fashion Tanzania",
    "men fashion Tanzania",
    "shoes Tanzania",
    "handbags Tanzania",
    "accessories Tanzania",
    "home and kitchen Tanzania",
  ],

  alternates: {
    canonical: "https://gamoraonline.co.tz",
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
    type: "website",
    locale: "en_TZ",
    url: "https://gamoraonline.co.tz",
    siteName: "Gamora Online",
    title: "Gamora Online | Online Shopping Tanzania",
    description:
      "GAMORA ONLINE ni duka la mtandaoni Tanzania linalokupa bidhaa bora kwa bei nzuri. Nunua Fashion, Shoes, Handbags, Accessories, Phones, Home & Kitchen na bidhaa nyingine mbalimbali. Tunakuahakikishia ununuzi salama, bidhaa bora na delivery ya uhakika.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gamora Online - Online Shopping Tanzania",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Gamora Online | Online Shopping Tanzania",
    description:
      "GAMORA ONLINE - Nunua bidhaa bora online Tanzania kwa bei nzuri na delivery ya uhakika.",
  },

  verification: {
    google: "wSzx_6kXQC_6g1gldGV9ynYsB4D7hWO-ZXQjuawtlrw",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "GAMORA ONLINE",
  url: "https://gamoraonline.co.tz",
  description:
    "GAMORA ONLINE ni duka la mtandaoni Tanzania linalokupa bidhaa bora kwa bei nzuri, ununuzi salama na delivery ya uhakika.",
  areaServed: {
    "@type": "Country",
    name: "Tanzania",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "GAMORA ONLINE",
  url: "https://gamoraonline.co.tz",
  description:
    "Nunua Fashion, Shoes, Handbags, Accessories, Phones, Home & Kitchen na bidhaa nyingine online Tanzania.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        {children}
      </body>
    </html>
  );
}
