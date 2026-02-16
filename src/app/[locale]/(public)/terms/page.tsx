import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Conditions d&apos;utilisation</h1>
          <p className="text-gray-300">Derniere mise a jour : Janvier 2026</p>
        </div>
      </section>

      <section className="py-16 bg-white flex-1">
        <div className="max-w-4xl mx-auto px-4 prose prose-gray max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptation des conditions</h2>
          <p className="text-gray-600 mb-6">
            En accedant et en utilisant la plateforme Nzela (&quot;le Service&quot;), vous acceptez d&apos;etre lie par les presentes conditions d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser le Service.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description du Service</h2>
          <p className="text-gray-600 mb-6">
            Nzela est une plateforme de logistique qui connecte les entreprises de transport (transporteurs) et les courtiers en fret en Republique Democratique du Congo. Le Service comprend la publication de chargements, la recherche de camions, le suivi GPS, la gestion de documents BOL, et le matching intelligent.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Inscription et compte</h2>
          <p className="text-gray-600 mb-6">
            Pour utiliser le Service, vous devez creer un compte et fournir des informations exactes et a jour. Vous etes responsable de la confidentialite de votre mot de passe et de toutes les activites effectuees sous votre compte.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Abonnements et paiements</h2>
          <p className="text-gray-600 mb-6">
            Certaines fonctionnalites du Service necessitent un abonnement payant. Les tarifs sont indiques en francs congolais (CDF) et sont sujets a modification avec un preavis de 30 jours. Les paiements sont traites via Mobile Money (M-Pesa, Airtel Money) ou virement bancaire.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Utilisation acceptable</h2>
          <p className="text-gray-600 mb-4">Vous vous engagez a :</p>
          <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
            <li>Utiliser le Service uniquement a des fins legales</li>
            <li>Fournir des informations exactes sur vos chargements et vehicules</li>
            <li>Ne pas publier de contenu frauduleux ou trompeur</li>
            <li>Respecter les autres utilisateurs de la plateforme</li>
            <li>Ne pas tenter de contourner les mesures de securite</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation de responsabilite</h2>
          <p className="text-gray-600 mb-6">
            Nzela agit en tant qu&apos;intermediaire et n&apos;est pas responsable des transactions effectuees entre les utilisateurs. Nous ne garantissons pas la fiabilite, la ponctualite ou la qualite des services de transport arranges via la plateforme.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Propriete intellectuelle</h2>
          <p className="text-gray-600 mb-6">
            Tout le contenu du Service, y compris les logos, textes, images et logiciels, est la propriete de MMC SARL et est protege par les lois sur la propriete intellectuelle.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact</h2>
          <p className="text-gray-600 mb-6">
            Pour toute question concernant ces conditions, contactez-nous a contact@nzela.cd.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
