import { getTranslations } from 'next-intl/server';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { formatDate, resolveDateLocale } from '@/lib/utils/format';
import { Calendar, ExternalLink } from 'lucide-react';

const newsItems = [
  {
    titleKey: 'news1Title',
    sourceKey: 'news1Source',
    date: '2025-12-01',
    excerptKey: 'news1Excerpt',
  },
  {
    titleKey: 'news2Title',
    sourceKey: 'news2Source',
    date: '2025-11-15',
    excerptKey: 'news2Excerpt',
  },
  {
    titleKey: 'news3Title',
    sourceKey: 'news3Source',
    date: '2025-10-30',
    excerptKey: 'news3Excerpt',
  },
  {
    titleKey: 'news4Title',
    sourceKey: 'news4Source',
    date: '2025-10-01',
    excerptKey: 'news4Excerpt',
  },
] as const;

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function NewsPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'news' });
  const dateLocale = resolveDateLocale(locale);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">{t('title')}</h1>
          <p className="text-primary-100 text-lg">{t('subtitle')}</p>
        </div>
      </section>

      <section className="py-16 bg-gray-50 flex-1">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {newsItems.map((item) => (
            <article key={item.titleKey} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                  {t(item.sourceKey)}
                </span>
                <time dateTime={item.date} className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(item.date, 'long', dateLocale)}
                </time>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t(item.titleKey)}</h3>
              <p className="text-sm text-gray-600">{t(item.excerptKey)}</p>
              <button
                type="button"
                disabled
                className="mt-3 text-sm text-gray-400 font-medium inline-flex items-center gap-1 cursor-not-allowed"
              >
                {t('readMore')} <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
