import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/lib/i18n/routing';
import { Button } from '@/components/ui/Button';
import { FileText, PenTool, Printer, Search, Archive, ArrowRight } from 'lucide-react';

const features = [
  { icon: FileText, title: 'Creation numerique', desc: 'Creez des BOL (bordereaux de chargement) directement depuis la plateforme.' },
  { icon: PenTool, title: 'Signature electronique', desc: 'Signez vos documents electroniquement - valide et securise.' },
  { icon: Printer, title: 'Impression PDF', desc: 'Generez et imprimez des BOL au format PDF professionnel.' },
  { icon: Search, title: 'Recherche et filtres', desc: 'Retrouvez n\'importe quel BOL par numero, expediteur ou date.' },
  { icon: Archive, title: 'Archivage automatique', desc: 'Tous vos documents sont archives et accessibles a tout moment.' },
];

export default function BOLProductPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-primary-200 text-sm font-semibold uppercase tracking-wider mb-3">Produit</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Gestion BOL</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto mb-8">
            Gerez vos bordereaux de chargement de facon 100% numerique.
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

      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Fini les papiers perdus</h2>
          <p className="text-primary-100 text-lg mb-8">Passez au numerique avec la gestion BOL Nzela.</p>
          <Link href="/register">
            <Button size="lg" variant="secondary">Creer un compte</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
