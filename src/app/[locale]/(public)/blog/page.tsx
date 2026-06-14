import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/lib/i18n/routing';
import { BlogPostImage } from '@/components/blog/BlogPostImage';
import { BLOG_POSTS, BLOG_TAG_COLORS } from '@/lib/content/blog-posts';
import { formatDate, resolveDateLocale } from '@/lib/utils/format';
import { Calendar, ArrowRight } from 'lucide-react';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function BlogPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const dateLocale = resolveDateLocale(locale);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-10 sm:py-14 md:py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">{t('title')}</h1>
          <p className="text-primary-100 text-sm sm:text-base md:text-lg">{t('subtitle')}</p>
        </div>
      </section>

      <section className="py-10 sm:py-14 md:py-16 bg-gray-50 flex-1">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {BLOG_POSTS.map((post, index) => (
              <article
                key={post.slug}
                className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <BlogPostImage
                  src={post.image}
                  alt={t(`posts.${post.slug}.title`)}
                  objectPosition={post.objectPosition}
                  priority={index < 3}
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${BLOG_TAG_COLORS[post.tagKey]}`}
                    >
                      {t(`tags.${post.tagKey}`)}
                    </span>
                    <time
                      dateTime={post.date}
                      className="text-xs text-gray-400 flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      {formatDate(post.date, 'medium', dateLocale)}
                    </time>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {t(`posts.${post.slug}.title`)}
                  </h3>
                  <p className="text-sm text-gray-500 flex-1 line-clamp-3">
                    {t(`posts.${post.slug}.excerpt`)}
                  </p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-sm text-primary-600 font-medium mt-3 inline-flex items-center gap-1 hover:text-primary-700"
                  >
                    {t('readMore')} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
