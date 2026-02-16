import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/lib/i18n/routing';
import { Calendar, ArrowRight, Tag } from 'lucide-react';

const posts = [
  {
    title: 'Comment Nzela revolutionne le transport au Haut-Katanga',
    excerpt: 'Decouvrez comment notre plateforme connecte les transporteurs et courtiers pour optimiser la chaine logistique en RDC.',
    date: '2025-12-15',
    tag: 'Actualites',
    slug: '#',
  },
  {
    title: 'Guide : Publier votre premier chargement sur le Load Board',
    excerpt: 'Un guide etape par etape pour les courtiers qui souhaitent publier leurs chargements et trouver des transporteurs fiables.',
    date: '2025-11-28',
    tag: 'Guide',
    slug: '#',
  },
  {
    title: 'Les avantages du suivi GPS en temps reel',
    excerpt: 'Le suivi GPS ameliore la transparence, reduit les delais et renforce la confiance entre les parties prenantes.',
    date: '2025-11-10',
    tag: 'Technologie',
    slug: '#',
  },
  {
    title: 'Securite et conformite dans le transport de marchandises',
    excerpt: 'Bonnes pratiques pour securiser vos envois et respecter les reglementations locales.',
    date: '2025-10-22',
    tag: 'Securite',
    slug: '#',
  },
  {
    title: 'Nzela lance le matching intelligent transporteur-courtier',
    excerpt: 'Notre algorithme de matching utilise plusieurs criteres pour connecter les bons transporteurs aux bons chargements.',
    date: '2025-10-05',
    tag: 'Produit',
    slug: '#',
  },
  {
    title: 'L\'impact economique du numerique sur la logistique en RDC',
    excerpt: 'Analyse de l\'impact de la digitalisation sur le secteur du transport en Republique Democratique du Congo.',
    date: '2025-09-18',
    tag: 'Recherche',
    slug: '#',
  },
];

const tagColors: Record<string, string> = {
  Actualites: 'bg-blue-100 text-blue-700',
  Guide: 'bg-green-100 text-green-700',
  Technologie: 'bg-purple-100 text-purple-700',
  Securite: 'bg-red-100 text-red-700',
  Produit: 'bg-orange-100 text-orange-700',
  Recherche: 'bg-yellow-100 text-yellow-700',
};

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Blog & Actualites</h1>
          <p className="text-primary-100 text-lg">Restez informe des dernieres tendances logistiques en RDC.</p>
        </div>
      </section>

      <section className="py-16 bg-gray-50 flex-1">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article key={post.title} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="h-40 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                  <Tag className="w-12 h-12 text-primary-300" />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagColors[post.tag] || 'bg-gray-100 text-gray-700'}`}>
                      {post.tag}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(post.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-gray-500 flex-1 line-clamp-3">{post.excerpt}</p>
                  <Link href={post.slug} className="text-sm text-primary-600 font-medium mt-3 inline-flex items-center gap-1 hover:text-primary-700">
                    Lire la suite <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
