import { Link } from '@/lib/i18n/routing';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Truck, Target, Users, Globe, Shield, Award, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const stats = [
  { label: 'Utilisateurs actifs', value: '500+' },
  { label: 'Chargements traites', value: '10 000+' },
  { label: 'Provinces couvertes', value: '4' },
  { label: 'Disponibilite', value: '99.9%' },
];

const team = [
  { name: 'Christian M Kazadi', role: 'CEO & Fondateur', desc: 'Expert en logistique avec 10+ ans d\'experience en RDC' },
  { name: 'Equipe Technique', role: 'Developpement', desc: 'Ingenieurs specialises en applications web et mobile' },
  { name: 'Equipe Operations', role: 'Logistique', desc: 'Professionnels du transport et de la chaine d\'approvisionnement' },
];

const values = [
  { icon: Target, title: 'Innovation', desc: 'Nous utilisons la technologie pour revolutionner la logistique en RDC' },
  { icon: Users, title: 'Collaboration', desc: 'Nous connectons les acteurs du transport pour creer de la valeur' },
  { icon: Shield, title: 'Fiabilite', desc: 'Securite et transparence dans chaque transaction' },
  { icon: Globe, title: 'Impact local', desc: 'Nous contribuons au developpement economique du Haut-Katanga et Lualaba' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">A propos de Nzela</h1>
          <p className="text-xl text-primary-100 max-w-3xl mx-auto">
            La plateforme logistique qui connecte transporteurs et courtiers en RDC pour un transport plus efficace et transparent.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold text-primary-600">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre Mission</h2>
              <p className="text-gray-600 mb-4">
                Nzela, qui signifie &quot;route&quot; en langues locales, a pour mission de digitaliser et d&apos;optimiser le transport de marchandises en Republique Democratique du Congo.
              </p>
              <p className="text-gray-600 mb-6">
                Nous croyons que la technologie peut transformer la logistique en Afrique, en rendant le transport plus accessible, transparent et efficace pour tous les acteurs de la chaine.
              </p>
              <Link href="/register">
                <Button>
                  Rejoindre Nzela <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="bg-primary-50 rounded-2xl p-8 flex items-center justify-center">
              <Truck className="w-32 h-32 text-primary-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Nos Valeurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                <v.icon className="w-10 h-10 text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team / Leadership */}
      <section id="leadership" className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Leadership</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member) => (
              <div key={member.name} className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                <p className="text-sm text-primary-600 mb-2">{member.role}</p>
                <p className="text-sm text-gray-500">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
