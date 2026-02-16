import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/lib/i18n/routing';
import { Briefcase, MapPin, Clock, ArrowRight, Users, Zap, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const openings = [
  { title: 'Developpeur Full-Stack', location: 'Lubumbashi / Remote', type: 'Temps plein', dept: 'Technologie' },
  { title: 'Responsable Logistique', location: 'Lubumbashi', type: 'Temps plein', dept: 'Operations' },
  { title: 'Commercial Terrain', location: 'Haut-Katanga / Lualaba', type: 'Temps plein', dept: 'Ventes' },
  { title: 'Support Client', location: 'Lubumbashi', type: 'Temps plein', dept: 'Support' },
];

const perks = [
  { icon: Zap, title: 'Impact reel', desc: 'Contribuez a transformer la logistique en RDC' },
  { icon: Users, title: 'Equipe dynamique', desc: 'Travaillez avec des professionnels passionnes' },
  { icon: Heart, title: 'Avantages', desc: 'Assurance sante, formation continue, horaires flexibles' },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Carrieres chez Nzela</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Rejoignez-nous pour revolutionner la logistique en Afrique.
          </p>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">Pourquoi rejoindre Nzela ?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {perks.map((p) => (
              <div key={p.title} className="text-center p-6 rounded-xl border border-gray-100">
                <p.icon className="w-10 h-10 text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-sm text-gray-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Openings */}
      <section className="py-16 bg-gray-50 flex-1">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">Postes ouverts</h2>
          <div className="space-y-4">
            {openings.map((job) => (
              <div key={job.title} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{job.title}</h3>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" /> {job.dept}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {job.location}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {job.type}
                    </span>
                  </div>
                </div>
                <Link href="/contact">
                  <Button variant="outline" size="sm">
                    Postuler <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-10 p-8 bg-primary-50 rounded-xl text-center">
            <h3 className="text-lg font-semibold text-primary-800 mb-2">Pas de poste qui correspond ?</h3>
            <p className="text-sm text-primary-700 mb-4">
              Envoyez-nous une candidature spontanee, nous sommes toujours a la recherche de talents.
            </p>
            <Link href="/contact">
              <Button>Candidature spontanee</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
