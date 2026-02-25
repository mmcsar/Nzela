import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Calendar, ExternalLink } from 'lucide-react';

const newsItems = [
  {
    title: 'Nzela leve des fonds pour son expansion en RDC',
    source: 'Presse locale',
    date: '2025-12-01',
    excerpt: 'La startup Nzela a annonce une levee de fonds pour accelerer son deploiement sur toute la RDC (26 provinces).',
  },
  {
    title: 'Partenariat strategique avec les transporteurs du Katanga',
    source: 'Nzela',
    date: '2025-11-15',
    excerpt: 'Nzela signe un partenariat avec les principales associations de transporteurs de la region pour elargir son reseau.',
  },
  {
    title: 'Mise a jour : nouvelles fonctionnalites de suivi GPS',
    source: 'Nzela',
    date: '2025-10-30',
    excerpt: 'La plateforme integre desormais le suivi GPS en temps reel pour tous les envois, ameliorant la visibilite et la securite.',
  },
  {
    title: 'Nzela presente au forum logistique de Lubumbashi',
    source: 'Forum Logistique',
    date: '2025-10-01',
    excerpt: 'L\'equipe Nzela a participe au forum annuel de la logistique a Lubumbashi, presentant ses solutions innovantes.',
  },
];

export default function NewsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Actualites</h1>
          <p className="text-primary-100 text-lg">Les dernieres nouvelles de Nzela et du secteur logistique.</p>
        </div>
      </section>

      <section className="py-16 bg-gray-50 flex-1">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          {newsItems.map((item) => (
            <article key={item.title} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                  {item.source}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(item.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.excerpt}</p>
              <button className="mt-3 text-sm text-primary-600 font-medium inline-flex items-center gap-1 hover:text-primary-700">
                Lire plus <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
