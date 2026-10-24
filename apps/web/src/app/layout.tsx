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
  description:
    "A dedicated competitive examination preparation platform for Indian students. Structured syllabi, verified study materials, topic-wise practice questions, and authentic computer-based mock examinations.",
  keywords:
    "competitive exam preparation, GATE DA, GATE CS, IIT JAM, study notes, mock tests, question bank, CBT simulator India",
  authors: [{ name: BRAND.legalName }],
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description:
      "Structured learning resources, chapter-wise notes, curated question banks, and realistic mock examination simulator.",
    type: "website",
    locale: "en_IN",
    siteName: BRAND.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description:
      "Structured competitive-exam preparation for GATE Data Science, CS, and technical examinations.",
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
