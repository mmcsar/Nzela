import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/lib/i18n/routing';
import { TrendingUp, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const caseStudies = [
  {
    title: 'Transport Katanga Express',
    subtitle: 'Reduction de 35% des trajets a vide',
    desc: 'Grace au Load Board Nzela, cette entreprise de transport basee a Lubumbashi a reduit ses trajets a vide de 35% en 3 mois, augmentant significativement sa rentabilite.',
    metrics: [
      { icon: TrendingUp, label: '+35%', desc: 'Taux d\'utilisation' },
      { icon: Clock, label: '-50%', desc: 'Temps de recherche' },
      { icon: DollarSign, label: '+25%', desc: 'Revenus mensuels' },
    ],
  },
  {
    title: 'Courtage Lubumbashi Logistics',
    subtitle: 'Digitalisation complete des operations',
    desc: 'Ce courtier a migre l\'ensemble de ses operations papier vers Nzela, incluant la gestion des BOL, le suivi GPS et la facturation. Resultat : des operations 3x plus rapides.',
    metrics: [
      { icon: TrendingUp, label: '3x', desc: 'Plus rapide' },
      { icon: Clock, label: '-70%', desc: 'Paperasserie' },
      { icon: DollarSign, label: '+40%', desc: 'Clients geres' },
    ],
  },
  {
    title: 'Flotte Miniere du Lualaba',
    subtitle: 'Optimisation de la logistique miniere',
    desc: 'Une entreprise de transport miniere a utilise le matching intelligent Nzela pour optimiser l\'affectation de ses 50 camions, reduisant les couts logistiques de 20%.',
    metrics: [
      { icon: TrendingUp, label: '-20%', desc: 'Couts logistiques' },
      { icon: Clock, label: '50', desc: 'Camions geres' },
      { icon: DollarSign, label: '99%', desc: 'Taux de livraison' },
    ],
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Etudes de cas</h1>
          <p className="text-primary-100 text-lg">Decouvrez comment nos clients transforment leur logistique avec Nzela.</p>
        </div>
      </section>

      <section className="py-16 bg-gray-50 flex-1">
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          {caseStudies.map((cs) => (
            <div key={cs.title} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-8">
                <p className="text-sm text-primary-600 font-semibold mb-1">{cs.subtitle}</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{cs.title}</h3>
                <p className="text-gray-600 mb-6">{cs.desc}</p>
                <div className="grid grid-cols-3 gap-4">
                  {cs.metrics.map((m) => (
                    <div key={m.desc} className="text-center p-4 bg-gray-50 rounded-lg">
                      <m.icon className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{m.label}</div>
                      <div className="text-xs text-gray-500">{m.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-5xl mx-auto px-4 mt-12 text-center">
          <p className="text-gray-600 mb-4">Vous souhaitez partager votre experience avec Nzela ?</p>
          <Link href="/contact">
            <Button>
              Contactez-nous <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
