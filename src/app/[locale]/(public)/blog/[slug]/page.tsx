import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link, routing } from '@/lib/i18n/routing';
import { BLOG_POSTS, BLOG_TAG_COLORS, getBlogPost } from '@/lib/content/blog-posts';
import { formatDate, resolveDateLocale } from '@/lib/utils/format';
import { ArrowLeft, Calendar } from 'lucide-react';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    BLOG_POSTS.map((post) => ({ locale, slug: post.slug })),
  );
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: 'blog' });
  const dateLocale = resolveDateLocale(locale);
  const content = t.raw(`posts.${slug}.content`) as string[];
  const title = t(`posts.${slug}.title`);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <article className="flex-1 bg-gray-50">
        <header className="relative overflow-hidden bg-primary-900 text-white">
          <div className="absolute inset-0">
            <Image
              src={post.image}
              alt={title}
              fill
              className="object-cover opacity-45"
              style={post.objectPosition ? { objectPosition: post.objectPosition } : undefined}
              sizes="100vw"
              priority
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-primary-950/95 via-primary-900/88 to-primary-800/75"
              aria-hidden
            />
          </div>

          <div className="relative max-w-3xl mx-auto px-4 py-12 sm:py-16">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-primary-100 hover:text-white mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('backToBlog')}
            </Link>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${BLOG_TAG_COLORS[post.tagKey]}`}
              >
                {t(`tags.${post.tagKey}`)}
              </span>
              <time dateTime={post.date} className="text-sm text-primary-100 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formatDate(post.date, 'long', dateLocale)}
              </time>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight drop-shadow-sm">
              {title}
            </h1>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-12">
          <div className="relative -mt-8 sm:-mt-10 mb-8 overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 aspect-[16/9] bg-slate-200">
            <Image
              src={post.image}
              alt={title}
              fill
              className="object-cover"
              style={post.objectPosition ? { objectPosition: post.objectPosition } : undefined}
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 space-y-4 text-gray-700 leading-relaxed">
            {Array.isArray(content) &&
              content.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
