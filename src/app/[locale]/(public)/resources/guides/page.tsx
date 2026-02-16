import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/lib/i18n/routing';
import { BookOpen, ArrowRight, Clock } from 'lucide-react';

const guides = [
  { title: 'Guide de demarrage pour les courtiers', desc: 'Apprenez a publier vos premiers chargements et a trouver des transporteurs fiables.', readTime: '5 min', slug: '#' },
  { title: 'Guide de demarrage pour les transporteurs', desc: 'Decouvrez comment utiliser le Load Board et reserver des chargements.', readTime: '5 min', slug: '#' },
  { title: 'Creer un BOL numerique', desc: 'Etapes pour creer, signer et envoyer un bordereau de chargement.', readTime: '3 min', slug: '#' },
  { title: 'Configurer le suivi GPS', desc: 'Comment activer le suivi GPS sur vos vehicules pour les expeditions.', readTime: '4 min', slug: '#' },
  { title: 'Utiliser le matching intelligent', desc: 'Comprendre et optimiser le matching entre vos camions et les chargements.', readTime: '6 min', slug: '#' },
  { title: 'Gerer vos abonnements', desc: 'Comment choisir, mettre a jour ou annuler votre plan d\'abonnement.', readTime: '3 min', slug: '#' },
];

export default function GuidesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Guides</h1>
          <p className="text-primary-100 text-lg">Des guides pratiques pour tirer le meilleur de Nzela.</p>
        </div>
      </section>

      <section className="py-16 bg-gray-50 flex-1">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            {guides.map((guide) => (
              <Link key={guide.title} href={guide.slug} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start gap-4 mb-3">
                  <BookOpen className="w-8 h-8 text-primary-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{guide.title}</h3>
                    <p className="text-sm text-gray-500">{guide.desc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {guide.readTime} de lecture
                  </span>
                  <span className="text-sm text-primary-600 font-medium flex items-center gap-1">
                    Lire <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
