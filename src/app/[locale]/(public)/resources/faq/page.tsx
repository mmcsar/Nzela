'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'Qu\'est-ce que Nzela ?', a: 'Nzela est une plateforme logistique qui connecte les transporteurs et les courtiers en fret en Republique Democratique du Congo, sur toute la RDC (26 provinces).' },
  { q: 'Nzela est-il gratuit ?', a: 'L\'inscription et l\'acces au Load Board de base sont gratuits. Des fonctionnalites avancees sont disponibles via nos plans d\'abonnement Standard, Enhanced, Pro, Select et Office.' },
  { q: 'Comment publier un chargement ?', a: 'Connectez-vous en tant que courtier, accedez au tableau de bord, et cliquez sur "Publier un chargement". Remplissez les details (origine, destination, type, poids, prix) et publiez.' },
  { q: 'Comment trouver des chargements ?', a: 'En tant que transporteur, accedez au Load Board depuis votre tableau de bord. Utilisez les filtres pour trouver les chargements qui correspondent a vos routes et capacites.' },
  { q: 'Le suivi GPS est-il inclus ?', a: 'Oui, le suivi GPS en temps reel est inclus dans les plans Enhanced et superieurs. Il permet aux courtiers de suivre la position des vehicules pendant le transport.' },
  { q: 'Quels modes de paiement sont acceptes ?', a: 'Nous acceptons le Mobile Money (M-Pesa, Airtel Money), les virements bancaires et les paiements en especes pour les abonnements.' },
  { q: 'Nzela couvre quelles regions ?', a: 'Nzela couvre toute la RDC : les 26 provinces sont disponibles (Haut-Katanga, Lualaba, Kinshasa, Kivu, Kasai, Equateur, etc.).' },
  { q: 'Comment fonctionne le matching ?', a: 'Notre algorithme analyse la proximite geographique, la capacite, le type de marchandise et la reputation pour proposer les meilleures correspondances entre chargements et camions.' },
  { q: 'Mes donnees sont-elles en securite ?', a: 'Oui, nous utilisons le chiffrement SSL/TLS, le controle d\'acces base sur les roles (RBAC) et le Row Level Security (RLS) pour proteger toutes les donnees.' },
  { q: 'Comment contacter le support ?', a: 'Vous pouvez nous contacter via la page Contact, par email a info@nzelaa.com, ou par telephone. Les abonnes Pro et Select beneficient d\'un support prioritaire.' },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Questions frequentes</h1>
          <p className="text-primary-100 text-lg">Trouvez rapidement les reponses a vos questions.</p>
        </div>
      </section>

      <section className="py-16 bg-gray-50 flex-1">
        <div className="max-w-3xl mx-auto px-4 space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 text-sm text-gray-600 border-t border-gray-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
