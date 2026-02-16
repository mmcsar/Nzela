import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/lib/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Package, Search, FileText, BarChart3, Users, Shield, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  { icon: Package, title: 'Publication de chargements', desc: 'Publiez vos chargements en quelques clics et atteignez des centaines de transporteurs qualifies.' },
  { icon: Search, title: 'Matching intelligent', desc: 'Notre algorithme trouve automatiquement les meilleurs transporteurs pour chaque chargement.' },
  { icon: FileText, title: 'Gestion BOL numerique', desc: 'Creez, signez et suivez vos bordereaux de chargement de facon 100% numerique.' },
  { icon: BarChart3, title: 'Estimation de tarifs', desc: 'Obtenez des estimations de prix basees sur les donnees du marche en temps reel.' },
  { icon: Users, title: 'Gestion de flotte', desc: 'Suivez les transporteurs avec qui vous travaillez et evaluez leur performance.' },
  { icon: Shield, title: 'Securite des transactions', desc: 'Verification des transporteurs et systeme d\'evaluations pour des transactions en confiance.' },
];

const benefits = [
  'Acces a un reseau de transporteurs verifies',
  'Reduction de 40% du temps de recherche',
  'Suivi GPS en temps reel de chaque envoi',
  'Documents BOL numeriques et signatures electroniques',
  'Alertes personnalisees pour les chargements correspondants',
  'Tableau de bord analytique pour piloter votre activite',
];

export default function BrokersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-primary-200 text-sm font-semibold uppercase tracking-wider mb-3">Solutions pour</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Courtiers en fret</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
            Gerez vos chargements, trouvez des transporteurs fiables et suivez vos expeditions depuis une seule plateforme.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register/broker">
              <Button size="lg" variant="secondary">
                Commencer gratuitement <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">Voir les tarifs</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Tout ce dont un courtier a besoin</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                <f.icon className="w-10 h-10 text-primary-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Avantages cles</h2>
              <ul className="space-y-3">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-primary-50 rounded-2xl p-10 flex items-center justify-center">
              <Package className="w-32 h-32 text-primary-300" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Pret a optimiser votre courtage ?</h2>
          <p className="text-primary-100 text-lg mb-8">Inscrivez-vous et publiez votre premier chargement en moins de 5 minutes.</p>
          <Link href="/register/broker">
            <Button size="lg" variant="secondary">Creer un compte courtier</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
