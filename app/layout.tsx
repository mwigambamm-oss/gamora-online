import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gamoraonline.co.tz"),

  title: {
    default: "Gamora Online | Online Shopping Tanzania",
    template: "%s | Gamora Online",
  },

  description:
    "Gamora Online is a trusted online shopping platform in Tanzania. Shop women's fashion, men's fashion, shoes, home and kitchen products, and more.",

  keywords: [
    "Gamora Online",
    "online shopping Tanzania",
    "online shop Tanzania",
    "shopping online Dar es Salaam",
    "fashion Tanzania",
    "women fashion Tanzania",
    "men fashion Tanzania",
    "shoes Tanzania",
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
    "Shop fashion, shoes, home and kitchen products online in Tanzania with Gamora Online.",
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
      "Shop fashion, shoes, home and kitchen products online in Tanzania.",
  },

  verification: {
    google: "wSzx_6kXQC_6g1gldGV9ynYsB4D7hWO-ZXQjuawtlrw",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
