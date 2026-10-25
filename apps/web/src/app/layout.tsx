import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BRAND } from "../lib/brand";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: "Structured preparation for competitive exams, from syllabus exploration to practice and mock tests. Starting with GATE Data Science and Artificial Intelligence.",
  keywords: "GATE DA, GATE CS, competitive exam preparation, practice tests",
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: "Explore published exam syllabi, available study material, timed practice tests, and released results.",
    type: "website",
    locale: "en_IN",
    siteName: BRAND.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: "Browse published exam syllabi, study resources, and practice tests.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{ background: "var(--canvas)", color: "var(--ink)", fontFamily: "var(--font-inter), Inter, -apple-system, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
