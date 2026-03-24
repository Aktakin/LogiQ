import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://logiq.quest";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LogiQ Quest — Kids learn programming & logic (logiq.quest)",
    template: "%s | LogiQ Quest",
  },
  description:
    "LogiQ Quest (logiq.quest) is a free site where kids learn programming, coding, and logic through play—JavaScript basics, variables, loops, conditions, debugging, and brain puzzles. Code Quest games plus logic builders for children and beginners.",
  keywords: [
    "LogiQ Quest",
    "logiq quest",
    "logiq.quest",
    "LogiQuest",
    "kids learn programming",
    "kids coding",
    "children learn to code",
    "programming for kids",
    "coding games for kids",
    "learn JavaScript kids",
    "logic games for kids",
    "educational games",
    "Code Quest",
    "free coding games",
    "online programming for beginners",
  ],
  authors: [{ name: "LogiQ Quest", url: siteUrl }],
  creator: "LogiQ Quest",
  publisher: "LogiQ Quest",
  category: "education",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "LogiQ Quest",
    title: "LogiQ Quest — Kids learn programming, coding & logic",
    description:
      "Free games at logiq.quest: kids learn programming and logic—Code Quest (variables, loops, functions) plus puzzles. Play in the browser.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LogiQ Quest — Kids programming & logic games",
    description:
      "Free online games where kids learn coding and logic. Visit logiq.quest — Code Quest, puzzles, and more.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "LogiQ Quest",
      alternateName: ["LogiQuest", "logiq.quest", "Logi Q Quest"],
      url: siteUrl,
      description:
        "Free online games where kids learn programming, coding, and logic through play—including Code Quest and logic puzzles.",
      inLanguage: "en",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "LogiQ Quest",
      url: siteUrl,
      description: "Educational browser games for kids learning programming and logic.",
    },
    {
      "@type": "WebApplication",
      name: "LogiQ Quest",
      url: siteUrl,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Kids learn programming and logic with interactive games: coding basics, puzzles, and Code Quest tracks.",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=Quicksand:wght@300..700&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="antialiased">
        <div className="cosmic-bg" />
        <Stars />
        {children}
      </body>
    </html>
  );
}

// Fewer stars to reduce paint/composite load on mobile (was 100, caused crashes)
const STAR_COUNT = 36;

function Stars() {
  const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    left: `${(i * 17 + 3) % 100}%`,
    top: `${(i * 23 + 7) % 100}%`,
    duration: `${2 + (i % 4)}s`,
    delay: `${(i % 3)}s`,
  }));

  return (
    <div className="stars">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            '--duration': star.duration,
            '--delay': star.delay,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
