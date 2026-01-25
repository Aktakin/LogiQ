import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LogiQuest - Learn Logic Through Play",
  description: "A fun and engaging platform for kids to learn logic concepts through interactive games and puzzles.",
  keywords: ["logic", "kids", "learning", "puzzles", "games", "education"],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
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
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
