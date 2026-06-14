export type BlogPostMeta = {
  slug: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  tagKey: 'news' | 'guide' | 'technology' | 'security' | 'product' | 'research';
  image: string;
  objectPosition?: string;
};

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: 'nzela-haut-katanga',
    date: '2026-05-15',
    tagKey: 'news',
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=900&q=80',
    objectPosition: '55% center',
  },
  {
    slug: 'premier-chargement-load-board',
    date: '2026-04-28',
    tagKey: 'guide',
    image: 'https://images.unsplash.com/photo-1771923082503-0a3381c46cef?w=900&q=85',
    objectPosition: 'center 22%',
  },
  {
    slug: 'suivi-gps-temps-reel',
    date: '2026-03-10',
    tagKey: 'technology',
    image: 'https://images.unsplash.com/photo-1687422811062-a966b55cb217?w=900&q=80',
    objectPosition: 'center center',
  },
  {
    slug: 'securite-conformite-transport',
    date: '2026-02-22',
    tagKey: 'security',
    image: 'https://images.unsplash.com/photo-1454165804609-c81d4f4f8ad1?w=900&q=80',
    objectPosition: 'center 35%',
  },
  {
    slug: 'matching-intelligent',
    date: '2026-01-15',
    tagKey: 'product',
    image: 'https://images.unsplash.com/photo-1587578769987-776c5bcd4c6e?w=900&q=80',
    objectPosition: 'center center',
  },
  {
    slug: 'impact-numerique-logistique-rdc',
    date: '2025-12-18',
    tagKey: 'research',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=85',
    objectPosition: 'center center',
  },
];

export function getBlogPost(slug: string): BlogPostMeta | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export const BLOG_TAG_COLORS: Record<BlogPostMeta['tagKey'], string> = {
  news: 'bg-blue-100 text-blue-700',
  guide: 'bg-green-100 text-green-700',
  technology: 'bg-purple-100 text-purple-700',
  security: 'bg-red-100 text-red-700',
  product: 'bg-orange-100 text-orange-700',
  research: 'bg-yellow-100 text-yellow-700',
};
