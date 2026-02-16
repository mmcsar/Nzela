import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/lib/i18n/routing';
import { Button } from '@/components/ui/Button';
import { MapPin, Radio, Bell, Shield, Clock, Eye, ArrowRight } from 'lucide-react';

const features = [
  { icon: MapPin, title: 'GPS en temps reel', desc: 'Suivez la position exacte de chaque vehicule et chargement en temps reel.' },
  { icon: Radio, title: 'Mises a jour automatiques', desc: 'Les positions sont mises a jour automatiquement sans intervention du chauffeur.' },
  { icon: Bell, title: 'Alertes geofencing', desc: 'Recevez des notifications quand un vehicule entre ou sort d\'une zone definie.' },
  { icon: Shield, title: 'Donnees securisees', desc: 'Les donnees de localisation sont chiffrees et accessibles uniquement aux parties autorisees.' },
  { icon: Clock, title: 'Historique complet', desc: 'Consultez l\'historique complet des trajets et des etapes de livraison.' },
  { icon: Eye, title: 'Visibilite totale', desc: 'Courtiers et expediteurs peuvent suivre chaque etape du transport.' },
];

export default function LoadTrackingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-primary-200 text-sm font-semibold uppercase tracking-wider mb-3">Produit</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Suivi de chargements</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
            Visibilite en temps reel sur vos expeditions, du chargement a la livraison.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Essayer maintenant <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
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

      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ne perdez plus jamais de vue un chargement</h2>
          <Link href="/register">
            <Button size="lg" variant="secondary">Commencer le suivi</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
