'use client';

import { Link } from '@/lib/i18n/routing';
import { Truck, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Youtube } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Truck className="w-8 h-8 text-primary-400" />
              <span className="text-2xl font-bold text-white">Nzela</span>
            </Link>
            <p className="text-sm text-gray-400 mb-4">{t('tagline')}</p>
            <div className="flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">{t('company')}</h3>
            <ul className="space-y-2.5">
              <li><Link href="/about" className="text-sm hover:text-white transition-colors">{t('about')}</Link></li>
              <li><Link href="/about#leadership" className="text-sm hover:text-white transition-colors">{t('leadership')}</Link></li>
              <li><Link href="/careers" className="text-sm hover:text-white transition-colors">{t('careers')}</Link></li>
              <li><Link href="/contact" className="text-sm hover:text-white transition-colors">{t('contactUs')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">{t('solutions')}</h3>
            <ul className="space-y-2.5">
              <li><Link href="/solutions/brokers" className="text-sm hover:text-white transition-colors">{t('brokers')}</Link></li>
              <li><Link href="/solutions/carriers" className="text-sm hover:text-white transition-colors">{t('carriers')}</Link></li>
              <li><Link href="/pricing" className="text-sm hover:text-white transition-colors">{t('pricing')}</Link></li>
              <li><Link href="/register" className="text-sm hover:text-white transition-colors">{t('register')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">{t('products')}</h3>
            <ul className="space-y-2.5">
              <li><Link href="/products/load-tracking" className="text-sm hover:text-white transition-colors">{t('loadTracking')}</Link></li>
              <li><Link href="/products/load-board" className="text-sm hover:text-white transition-colors">{t('loadBoard')}</Link></li>
              <li><Link href="/products/matching" className="text-sm hover:text-white transition-colors">{t('smartMatching')}</Link></li>
              <li><Link href="/products/bol" className="text-sm hover:text-white transition-colors">{t('bolManagement')}</Link></li>
              <li><Link href="/products/toolkit" className="text-sm hover:text-white transition-colors">{t('carrierToolkit')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">{t('resources')}</h3>
            <ul className="space-y-2.5">
              <li><Link href="/blog" className="text-sm hover:text-white transition-colors">{t('blog')}</Link></li>
              <li><Link href="/news" className="text-sm hover:text-white transition-colors">{t('news')}</Link></li>
              <li><Link href="/resources/case-studies" className="text-sm hover:text-white transition-colors">{t('caseStudies')}</Link></li>
              <li><Link href="/resources/faq" className="text-sm hover:text-white transition-colors">{t('faq')}</Link></li>
              <li><Link href="/resources/guides" className="text-sm hover:text-white transition-colors">{t('guides')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0" />
              <span className="text-sm">{t('address')}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary-400 flex-shrink-0" />
              <span className="text-sm">{process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+243 990 243 584'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
              <span className="text-sm">info@nzelaa.com</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500" suppressHydrationWarning>
              {t('copyright', { year: currentYear })}
            </p>
            <div className="flex gap-6">
              <Link href="/terms" className="text-sm text-gray-500 hover:text-white transition-colors">
                {t('terms')}
              </Link>
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-white transition-colors">
                {t('privacy')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
