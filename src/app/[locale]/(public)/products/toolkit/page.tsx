import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/lib/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Wrench, Calculator, Fuel, FileCheck, Navigation, Phone, ArrowRight } from 'lucide-react';

const tools = [
  { icon: Calculator, title: 'Calculateur de tarifs', desc: 'Estimez les prix du marché en fonction de la distance, du type de marchandise et de la saison.' },
  { icon: Fuel, title: 'Estimateur de carburant', desc: 'Calculez vos coûts de carburant en fonction de la distance et de la consommation de votre véhicule.' },
  { icon: FileCheck, title: 'Vérification des documents', desc: 'Vérifiez l\'authenticité des licences et permis des partenaires.' },
  { icon: Navigation, title: 'Planificateur de routes', desc: 'Optimisez vos itinéraires pour réduire les coûts et les délais.' },
  { icon: Phone, title: 'Application mobile', desc: 'Accédez à tous les outils depuis votre smartphone avec l\'app PWA Nzela.' },
];

export default function ToolkitPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-primary-200 text-sm font-semibold uppercase tracking-wider mb-3">Produit</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Outils Transporteur</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
            Plus de 20 outils pour gérer votre activité de transport efficacement.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/dashboard/tools">
              <Button size="lg" variant="secondary">
                Ouvrir les calculateurs <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                Créer un compte
              </Button>
            </Link>
          </div>
          <p className="text-primary-200/90 text-sm mt-4 max-w-xl mx-auto">
            Connectez-vous pour accéder au calculateur de tarifs, à l&apos;estimateur de carburant et aux autres outils dans votre espace.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-center mb-10">
            <Wrench className="w-16 h-16 text-primary-400" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((t) => (
              <div key={t.title} className="p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                <t.icon className="w-10 h-10 text-primary-600 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">{t.title}</h3>
                <p className="text-sm text-gray-500">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Des outils pour la route et le bureau</h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Calculateur de tarifs, estimateur de carburant, vérification des documents, planificateur de routes et app PWA : tout pour la route et le bureau.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/tools">
              <Button size="lg" variant="secondary">Accéder aux outils (connecté)</Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                S&apos;inscrire
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
