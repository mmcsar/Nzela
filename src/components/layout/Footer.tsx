import { Link } from '@/lib/i18n/routing';
import { Truck, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Youtube } from 'lucide-react';

export function Footer() {
  // Avoid hydration mismatch: server/client can differ by timezone (e.g. year boundary)
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Truck className="w-8 h-8 text-primary-400" />
              <span className="text-2xl font-bold text-white">Nzela</span>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              Plateforme de logistique et transport pour la RDC. Connectez transporteurs et courtiers.
            </p>
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

          {/* Notre Entreprise */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Notre Entreprise</h3>
            <ul className="space-y-2.5">
              <li><Link href="/about" className="text-sm hover:text-white transition-colors">A propos</Link></li>
              <li><Link href="/about#leadership" className="text-sm hover:text-white transition-colors">Leadership</Link></li>
              <li><Link href="/careers" className="text-sm hover:text-white transition-colors">Carrieres</Link></li>
              <li><Link href="/contact" className="text-sm hover:text-white transition-colors">Contactez-nous</Link></li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Solutions</h3>
            <ul className="space-y-2.5">
              <li><Link href="/solutions/brokers" className="text-sm hover:text-white transition-colors">Courtiers</Link></li>
              <li><Link href="/solutions/carriers" className="text-sm hover:text-white transition-colors">Transporteurs</Link></li>
              <li><Link href="/pricing" className="text-sm hover:text-white transition-colors">Tarifs</Link></li>
              <li><Link href="/register" className="text-sm hover:text-white transition-colors">Inscription</Link></li>
            </ul>
          </div>

          {/* Produits */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Produits</h3>
            <ul className="space-y-2.5">
              <li><Link href="/products/load-tracking" className="text-sm hover:text-white transition-colors">Suivi de chargements</Link></li>
              <li><Link href="/products/load-board" className="text-sm hover:text-white transition-colors">Load Board</Link></li>
              <li><Link href="/products/matching" className="text-sm hover:text-white transition-colors">Matching intelligent</Link></li>
              <li><Link href="/products/bol" className="text-sm hover:text-white transition-colors">Gestion BOL</Link></li>
              <li><Link href="/products/toolkit" className="text-sm hover:text-white transition-colors">Outils transporteur</Link></li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Ressources</h3>
            <ul className="space-y-2.5">
              <li><Link href="/blog" className="text-sm hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/news" className="text-sm hover:text-white transition-colors">Actualites</Link></li>
              <li><Link href="/resources/case-studies" className="text-sm hover:text-white transition-colors">Etudes de cas</Link></li>
              <li><Link href="/resources/faq" className="text-sm hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/resources/guides" className="text-sm hover:text-white transition-colors">Guides</Link></li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-10 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0" />
              <span className="text-sm">04, Avenue Monga, Quartier Craa, Lubumbashi, RDC — RCCM LSHI 17-B-6981</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary-400 flex-shrink-0" />
              <span className="text-sm">{process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+243 995 547 081'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
              <span className="text-sm">info@nzelaa.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500" suppressHydrationWarning>
              Copyright &copy; {currentYear} Nzela — Maintenance de Matériel au Congo (M M C SARL). Tous droits réservés.
            </p>
            <div className="flex gap-6">
              <Link href="/terms" className="text-sm text-gray-500 hover:text-white transition-colors">
                Conditions d&apos;utilisation
              </Link>
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-white transition-colors">
                Politique de confidentialite
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
