import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/lib/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Truck, MapPin, DollarSign, Bell, Star, Wrench, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  { icon: Truck, title: 'Load Board gratuit', desc: 'Acces a des milliers de chargements disponibles dans tout le Haut-Katanga et Lualaba.' },
  { icon: MapPin, title: 'Suivi GPS en temps reel', desc: 'Partagez votre position pour rassurer les courtiers et ameliorer votre reputation.' },
  { icon: DollarSign, title: 'Tarifs competitifs', desc: 'Consultez les estimations de prix du marche et negociez les meilleurs tarifs.' },
  { icon: Bell, title: 'Alertes personnalisees', desc: 'Recevez des notifications pour les chargements qui correspondent a votre profil et vos routes.' },
  { icon: Star, title: 'Evaluations et reputation', desc: 'Construisez votre reputation grace aux evaluations des courtiers satisfaits.' },
  { icon: Wrench, title: 'Outils de gestion', desc: 'Gerez votre flotte, vos documents et votre planning depuis un seul tableau de bord.' },
];

const benefits = [
  'Acces gratuit au Load Board',
  'Plus de chargements, moins de trajets a vide',
  'Reservez des chargements en un clic (Book It Now)',
  'Pas besoin d\'appeler les courtiers - tout est en ligne',
  'Application mobile PWA - fonctionne sur n\'importe quel telephone',
  'Gestion de flotte et de vehicules integree',
];

const testimonials = [
  { name: 'Jean-Pierre K.', role: 'Transporteur, Lubumbashi', quote: 'Grace a Nzela, je ne fais plus de trajets a vide. Je trouve toujours un chargement de retour avant meme d\'arriver a destination.' },
  { name: 'Marie T.', role: 'Proprietaire de flotte', quote: 'L\'application est facile a utiliser. Mes chauffeurs trouvent des chargements directement depuis leur telephone.' },
  { name: 'Patrick M.', role: 'Chauffeur independant', quote: 'Le Load Board est gratuit et toujours a jour. Plus de faux chargements comme sur d\'autres plateformes.' },
];

export default function CarriersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-primary-200 text-sm font-semibold uppercase tracking-wider mb-3">Solutions pour</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Transporteurs</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
            Trouvez du fret, gerez votre flotte et augmentez vos revenus avec la plateforme Nzela.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register/company">
              <Button size="lg" variant="secondary">
                Inscription gratuite <ArrowRight className="w-4 h-4 ml-2" />
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
          <h2 className="text-3xl font-bold text-center mb-10">Tout pour les transporteurs</h2>
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
            <div className="bg-primary-50 rounded-2xl p-10 flex items-center justify-center">
              <Truck className="w-32 h-32 text-primary-300" />
            </div>
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
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Ce que disent nos transporteurs</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
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

      {/* CTA */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Le fret n&apos;a jamais ete aussi accessible</h2>
          <p className="text-primary-100 text-lg mb-8">Inscrivez-vous gratuitement et commencez a trouver des chargements des aujourd&apos;hui.</p>
          <Link href="/register/company">
            <Button size="lg" variant="secondary">Creer un compte transporteur</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
