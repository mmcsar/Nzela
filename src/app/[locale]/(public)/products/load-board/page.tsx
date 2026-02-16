import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/lib/i18n/routing';
import { Button } from '@/components/ui/Button';
import { LayoutGrid, Search, Zap, RefreshCw, Filter, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  { icon: LayoutGrid, title: 'Tableau de bord complet', desc: 'Vue tabulaire professionnelle avec toutes les informations essentielles.' },
  { icon: Search, title: 'Recherche avancee', desc: 'Filtrez par origine, destination, type de marchandise, poids et prix.' },
  { icon: Zap, title: 'Book It Now', desc: 'Reservez un chargement en un clic, sans appeler le courtier.' },
  { icon: RefreshCw, title: 'Donnees en temps reel', desc: 'Les chargements sont synchronises en temps reel - pas de chargements fantomes.' },
  { icon: Filter, title: 'Tri intelligent', desc: 'Triez par date, prix, distance ou pertinence pour vos besoins.' },
];

export default function LoadBoardProductPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-primary-200 text-sm font-semibold uppercase tracking-wider mb-3">Produit</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Load Board</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
            Un Load Board avec tout ce dont vous avez besoin pour trouver du fret et garder vos roues en mouvement.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Commencer <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="text-center p-6">
                <f.icon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Comment ca marche</h2>
          <div className="space-y-8">
            {[
              { step: '1', title: 'Recherchez', desc: 'Utilisez les filtres pour trouver les chargements qui correspondent a vos routes et capacites.' },
              { step: '2', title: 'Comparez', desc: 'Consultez les details, les prix et les evaluations des courtiers pour choisir le meilleur chargement.' },
              { step: '3', title: 'Reservez', desc: 'Cliquez sur Book It Now pour reserver instantanement ou envoyez une offre de prix au courtier.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Le fret n&apos;a jamais ete aussi simple</h2>
          <p className="text-primary-100 text-lg mb-8">30 000+ chargements disponibles chaque jour.</p>
          <Link href="/register">
            <Button size="lg" variant="secondary">S&apos;inscrire maintenant</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
