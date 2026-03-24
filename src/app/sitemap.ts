import type { MetadataRoute } from 'next';

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://logiq.quest').replace(/\/$/, '');

/** Main routes for discovery (LogiQ Quest / kids programming & logic). */
const PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'] }[] = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/dashboard', priority: 0.95, changeFrequency: 'weekly' },
  { path: '/games/programming', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/games/deduction', priority: 0.85, changeFrequency: 'weekly' },
  { path: '/games/logic-builders/matrix-reasoning', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/games/logic-builders/analogy-lab', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/games/logic-builders/truth-gates', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/games/logic-builders/shape-sorter', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/games/sequences', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/games/patterns', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/games/spatial', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/games/dino', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/games/maze', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/games/memory-match', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/games/marble-shooter', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/games/catch-game', priority: 0.7, changeFrequency: 'monthly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PATHS.map(({ path, priority, changeFrequency }) => ({
    url: `${site}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
