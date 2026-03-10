import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VidyaMind — Cognitive Learning OS",
  description:
    "AI-powered personalized learning platform with knowledge graph tutoring, mastery tracking, rubric-aware grading, and multilingual support.",
  keywords: [
    "AI tutor",
    "knowledge graph",
    "mastery tracking",
    "spaced repetition",
    "education",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}
      >
        <div className="animated-bg" />
        {children}
      </body>
    </html>
  );
}
