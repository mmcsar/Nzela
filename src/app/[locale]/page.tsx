import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/Button';
import { Link } from '@/lib/i18n/routing';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Truck, Package, FileText, Shield, Globe, Smartphone, MapPin, Cpu, BarChart3, ArrowRight, CheckCircle, Calculator, Fuel, FileCheck, Navigation } from 'lucide-react';

export default async function HomePage() {
  const t = await getTranslations('common');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <main className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Un Load Board avec tout ce dont vous avez besoin
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-primary-100">
              La plateforme logistique pour le Haut-Katanga et Lualaba
            </p>
            <p className="text-lg mb-8 text-primary-200">
              Connectez transporteurs et courtiers. Trouvez du fret. Gardez vos roues en mouvement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register/broker">
                <Button size="lg" variant="secondary">
                  Publier un chargement <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/register/company">
                <Button size="lg" variant="outline">Trouver un chargement</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Trust Bar */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600">500+</div>
              <div className="text-xs text-gray-500 mt-1">Utilisateurs actifs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">10 000+</div>
              <div className="text-xs text-gray-500 mt-1">Chargements traites</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">4</div>
              <div className="text-xs text-gray-500 mt-1">Provinces couvertes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">99.9%</div>
              <div className="text-xs text-gray-500 mt-1">Disponibilite</div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props - 3 columns */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Gerez facilement votre activite</h3>
              <p className="text-gray-500 text-sm">
                Envoyez des devis ou reservez des chargements en un clic, a tout moment.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ameliorez votre efficacite</h3>
              <p className="text-gray-500 text-sm">
                Plus de 20 outils et fonctionnalites pour gagner du temps sur la route et au bureau.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Augmentez vos revenus</h3>
              <p className="text-gray-500 text-sm">
                Trouvez des chargements et des recharges pour remplir votre planning a l&apos;avance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4">Fonctionnalites principales</h2>
          <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
            Tout ce dont les transporteurs et courtiers ont besoin, sur une seule plateforme.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Truck, title: 'Load Board', desc: 'Acces a des chargements en temps reel. Plus de chargements fantomes.' },
              { icon: Cpu, title: 'Matching intelligent', desc: 'Notre algorithme trouve les meilleures correspondances automatiquement.' },
              { icon: MapPin, title: 'Suivi GPS', desc: 'Suivez chaque expedition en temps reel, du chargement a la livraison.' },
              { icon: FileText, title: 'Gestion BOL', desc: 'Creez et signez vos bordereaux de chargement numeriquement.' },
              { icon: Shield, title: 'Securise & RBAC', desc: 'Plateforme securisee avec controle d\'acces base sur les roles.' },
              { icon: Smartphone, title: 'PWA Mobile', desc: 'Installez l\'app sur votre telephone. Fonctionne hors connexion.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <f.icon className="w-10 h-10 text-primary-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Des outils pour la route et le bureau */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-2">Des outils pour la route et le bureau</h2>
          <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
            Estimez les tarifs, calculez le carburant, vérifiez les documents, optimisez les itinéraires et accédez à tout depuis l&apos;app PWA.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { icon: Calculator, title: 'Calculateur de tarifs', desc: 'Prix du marché selon distance, type de marchandise et saison.' },
              { icon: Fuel, title: 'Estimateur de carburant', desc: 'Coûts carburant selon distance et consommation du véhicule.' },
              { icon: FileCheck, title: 'Vérification des documents', desc: 'Authenticité des licences et permis des partenaires.' },
              { icon: Navigation, title: 'Planificateur de routes', desc: 'Itinéraires optimisés pour réduire coûts et délais.' },
              { icon: Smartphone, title: 'Application mobile', desc: 'Tous les outils sur smartphone avec l&apos;app PWA Nzela.' },
            ].map((f) => (
              <div key={f.title} className="bg-gray-50 rounded-xl p-5 hover:shadow-md transition-shadow border border-gray-100">
                <f.icon className="w-10 h-10 text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/products/toolkit">
              <Button size="lg" variant="outline">
                Découvrir tous les outils <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-10">Ce que disent nos utilisateurs</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: 'Grace a Nzela, je ne fais plus de trajets a vide. Je trouve toujours un chargement de retour avant d\'arriver a destination.', name: 'Jean-Pierre K.', role: 'Transporteur' },
              { quote: 'L\'application est facile a utiliser. Mes chauffeurs trouvent des chargements directement depuis leur telephone.', name: 'Marie T.', role: 'Proprietaire de flotte' },
              { quote: 'Le Load Board est toujours a jour. D\'un clic, je reserve un chargement. Fini les appels telephoniques interminables.', name: 'Patrick M.', role: 'Chauffeur independant' },
            ].map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-600 text-sm italic mb-4">&quot;{t.quote}&quot;</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Le fret n&apos;a jamais ete aussi simple</h2>
          <p className="text-xl mb-8 text-primary-100">
            Rejoignez Nzela et transformez votre gestion logistique
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register/broker">
              <Button size="lg" variant="secondary">
                Publier un load maintenant <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">Abonnement unique 50 USD/mois</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

