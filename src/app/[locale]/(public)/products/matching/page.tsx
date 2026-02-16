import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/lib/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Cpu, Route, Star, Gauge, Target, ArrowRight } from 'lucide-react';

const criteria = [
  { icon: Route, title: 'Proximite geographique', desc: 'Distance entre le camion et l\'origine du chargement.' },
  { icon: Gauge, title: 'Capacite', desc: 'Correspondance entre le poids du chargement et la capacite du camion.' },
  { icon: Target, title: 'Type de marchandise', desc: 'Compatibilite entre le type de cargaison et l\'equipement du camion.' },
  { icon: Star, title: 'Reputation', desc: 'Score de fiabilite base sur les evaluations precedentes.' },
];

export default function MatchingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-primary-200 text-sm font-semibold uppercase tracking-wider mb-3">Produit</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Matching intelligent</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
            Notre algorithme connecte automatiquement les bons transporteurs aux bons chargements.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Essayer le matching <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-3">Comment fonctionne le matching</h2>
          <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto">
            Notre algorithme analyse plusieurs criteres pour proposer les meilleures correspondances avec un score de compatibilite.
          </p>
          <div className="flex items-center justify-center mb-12">
            <Cpu className="w-20 h-20 text-primary-400" />
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {criteria.map((c) => (
              <div key={c.title} className="flex items-start gap-4 p-5 rounded-xl bg-gray-50">
                <c.icon className="w-8 h-8 text-primary-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{c.title}</h3>
                  <p className="text-sm text-gray-500">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Le bon camion pour le bon chargement</h2>
          <Link href="/register">
            <Button size="lg" variant="secondary">Commencer maintenant</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
