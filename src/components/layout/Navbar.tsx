'use client';

import { useState } from 'react';
import { Link } from '@/lib/i18n/routing';
import { Truck, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';

const solutions = [
  { label: 'Courtiers', href: '/solutions/brokers', desc: 'Publiez et gerez vos chargements' },
  { label: 'Transporteurs', href: '/solutions/carriers', desc: 'Trouvez du fret et optimisez vos routes' },
];

const products = [
  { label: 'Suivi de chargements', href: '/products/load-tracking' },
  { label: 'Load Board', href: '/products/load-board' },
  { label: 'Matching intelligent', href: '/products/matching' },
  { label: 'Gestion BOL', href: '/products/bol' },
  { label: 'Outils transporteur', href: '/products/toolkit' },
];

const resources = [
  { label: 'Blog', href: '/blog' },
  { label: 'Actualites', href: '/news' },
  { label: 'Etudes de cas', href: '/resources/case-studies' },
  { label: 'FAQ', href: '/resources/faq' },
  { label: 'Guides', href: '/resources/guides' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Truck className="w-7 h-7 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">Nzela</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/about" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">
              A propos
            </Link>

            {/* Solutions Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('solutions')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 rounded-md transition-colors">
                Solutions <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {openDropdown === 'solutions' && (
                <div className="absolute top-full left-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg py-2 mt-0">
                  {solutions.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">{item.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Products Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('products')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 rounded-md transition-colors">
                Produits <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {openDropdown === 'products' && (
                <div className="absolute top-full left-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 mt-0">
                  {products.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Resources Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('resources')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 rounded-md transition-colors">
                Ressources <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {openDropdown === 'resources' && (
                <div className="absolute top-full left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 mt-0">
                  {resources.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link href="/pricing" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">
              Tarifs
            </Link>
            <Link href="/contact" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <LanguageSwitcher compact />
            <Link href="/login">
              <Button variant="outline" size="sm">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">S&apos;inscrire</Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Solutions</p>
              {solutions.map((item) => (
                <Link key={item.href} href={item.href} className="block py-1.5 text-sm text-gray-700 hover:text-primary-600" onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Produits</p>
              {products.map((item) => (
                <Link key={item.href} href={item.href} className="block py-1.5 text-sm text-gray-700 hover:text-primary-600" onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ressources</p>
              {resources.map((item) => (
                <Link key={item.href} href={item.href} className="block py-1.5 text-sm text-gray-700 hover:text-primary-600" onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-200">
              <Link href="/about" className="block py-1.5 text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>
                A propos
              </Link>
              <Link href="/pricing" className="block py-1.5 text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>
                Tarifs
              </Link>
              <Link href="/contact" className="block py-1.5 text-sm font-medium text-gray-700" onClick={() => setMobileOpen(false)}>
                Contact
              </Link>
            </div>
            <div className="px-1 pb-2">
              <LanguageSwitcher />
            </div>
            <div className="pt-3 border-t border-gray-200 flex gap-3">
              <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">Connexion</Button>
              </Link>
              <Link href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">S&apos;inscrire</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
