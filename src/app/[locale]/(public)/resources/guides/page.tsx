'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BookOpen, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const guides = [
  {
    title: 'Guide de demarrage pour les courtiers',
    shortDesc: 'Apprenez a publier vos premiers chargements et a trouver des transporteurs fiables.',
    content: 'Inscrivez-vous en tant que courtier, completez votre profil et liez votre cabinet. Depuis le tableau de bord, cliquez sur "Publier un chargement" : renseignez origine, destination, type de remorque, poids et dates. Une fois publie, les transporteurs voient votre offre sur le Load Board et peuvent vous contacter. Utilisez le matching pour voir les camions adaptes a vos trajets.',
    readTime: '5 min',
  },
  {
    title: 'Guide de demarrage pour les transporteurs',
    shortDesc: 'Decouvrez comment utiliser le Load Board et reserver des chargements.',
    content: 'Apres inscription comme entreprise ou transporteur, accedez au Load Board depuis le menu. Filtrez par origine, destination, type de remorque et date. Consultez les chargements en temps reel, contactez les courtiers par telephone ou message, et reservez ceux qui vous conviennent. Vous pouvez aussi publier vos camions sur le Truck Board pour recevoir des propositions.',
    readTime: '5 min',
  },
  {
    title: 'Creer un BOL numerique',
    shortDesc: 'Etapes pour creer, signer et envoyer un bordereau de chargement.',
    content: 'Le BOL (Bordereau de chargement) est disponible dans le menu courtier ou depuis une mission. Cliquez sur "Creer un BOL", renseignez l\'expediteur, le transporteur, les marchandises et les lieux. Enregistrez en brouillon ou envoyez pour signature. Le destinataire peut signer numeriquement ; une fois signe, le document est archive et telechargeable en PDF.',
    readTime: '3 min',
  },
  {
    title: 'Configurer le suivi GPS',
    shortDesc: 'Comment activer le suivi GPS sur vos vehicules pour les expeditions.',
    content: 'Le suivi GPS est accessible dans la section Tracking du tableau de bord. Selectionnez un chargement en cours pour voir la position du vehicule sur la carte. Pour activer le suivi sur vos propres vehicules, assurez-vous que le chauffeur utilise l\'application Nzela ou qu\'un dispositif GPS compatible est lie a la mission. Les mises a jour de position sont affichees en temps reel.',
    readTime: '4 min',
  },
  {
    title: 'Utiliser le matching intelligent',
    shortDesc: 'Comprendre et optimiser le matching entre vos camions et les chargements.',
    content: 'Le matching relie automatiquement les chargements aux camions adaptes selon la localisation, le type de remorque, la capacite et les dates. Cote courtier, consultez les camions proposes pour votre trajet ; cote transporteur, recevez des alertes sur les chargements correspondant a votre flotte. Ajustez vos criteres (provinces, types) pour affiner les resultats.',
    readTime: '6 min',
  },
  {
    title: 'Gerer vos abonnements',
    shortDesc: 'Comment choisir, mettre a jour ou annuler votre plan d\'abonnement.',
    content: 'Depuis Parametres ou le menu "Abonnement", consultez votre plan actuel (courtier ou entreprise). L\'abonnement unique donne acces au Load Board, Truck Board, BOL et outils. Pour modifier ou annuler, contactez le support ou utilisez la page Abonnement dans votre espace. Le renouvellement est mensuel ; vous gardez l\'acces jusqu\'a la fin de la periode payee.',
    readTime: '3 min',
  },
];

export default function GuidesPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Guides</h1>
          <p className="text-primary-100 text-lg">Des guides pratiques pour tirer le meilleur de Nzela.</p>
        </div>
      </section>

      <section className="py-16 bg-gray-50 flex-1">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-4">
            {guides.map((guide, index) => (
              <div
                key={guide.title}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full p-6 text-left flex items-start gap-4 hover:bg-gray-50/50 transition-colors"
                  aria-expanded={openIndex === index}
                >
                  <BookOpen className="w-8 h-8 text-primary-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">{guide.title}</h3>
                    <p className="text-sm text-gray-500">{guide.shortDesc}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {guide.readTime} de lecture
                      </span>
                      <span className="text-sm text-primary-600 font-medium flex items-center gap-1">
                        {openIndex === index ? (
                          <>Replier <ChevronUp className="w-4 h-4" /></>
                        ) : (
                          <>Voir l&apos;explication <ChevronDown className="w-4 h-4" /></>
                        )}
                      </span>
                    </div>
                  </div>
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-6 pt-0 border-t border-gray-100 bg-primary-50/30">
                    <div className="pl-12 pt-4">
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{guide.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
