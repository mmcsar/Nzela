import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Politique de confidentialite</h1>
          <p className="text-gray-300">Derniere mise a jour : Janvier 2026</p>
        </div>
      </section>

      <section className="py-16 bg-white flex-1">
        <div className="max-w-4xl mx-auto px-4 prose prose-gray max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Donnees collectees</h2>
          <p className="text-gray-600 mb-4">Nous collectons les types de donnees suivants :</p>
          <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
            <li><strong>Informations personnelles :</strong> nom, email, numero de telephone, adresse</li>
            <li><strong>Informations professionnelles :</strong> nom de l&apos;entreprise, RCCM, NIF, type d&apos;activite</li>
            <li><strong>Donnees de localisation :</strong> positions GPS des vehicules (avec consentement)</li>
            <li><strong>Donnees de transaction :</strong> historique des chargements, paiements, evaluations</li>
            <li><strong>Donnees techniques :</strong> adresse IP, type de navigateur, appareil utilise</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Utilisation des donnees</h2>
          <p className="text-gray-600 mb-4">Vos donnees sont utilisees pour :</p>
          <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
            <li>Fournir et ameliorer nos services</li>
            <li>Effectuer le matching entre transporteurs et courtiers</li>
            <li>Assurer le suivi GPS des expeditions</li>
            <li>Traiter les paiements et abonnements</li>
            <li>Communiquer avec vous (notifications, alertes, support)</li>
            <li>Generer des statistiques anonymisees pour ameliorer la plateforme</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Partage des donnees</h2>
          <p className="text-gray-600 mb-6">
            Nous ne vendons pas vos donnees personnelles. Nous partageons certaines informations avec les autres utilisateurs de la plateforme dans le cadre normal du service (ex: coordonnees de contact pour une expedition). Nous pouvons partager des donnees avec des prestataires de services (paiement, hebergement) soumis a des obligations de confidentialite.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Securite</h2>
          <p className="text-gray-600 mb-6">
            Nous mettons en oeuvre des mesures de securite techniques et organisationnelles pour proteger vos donnees : chiffrement SSL/TLS, controle d&apos;acces base sur les roles (RBAC), Row Level Security (RLS) sur la base de donnees, et audits reguliers.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Conservation des donnees</h2>
          <p className="text-gray-600 mb-6">
            Vos donnees sont conservees tant que votre compte est actif. En cas de suppression du compte, vos donnees personnelles sont supprimees sous 30 jours. Les donnees de transaction sont conservees conformement aux obligations legales.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Vos droits</h2>
          <p className="text-gray-600 mb-4">Vous disposez des droits suivants :</p>
          <ul className="list-disc pl-6 text-gray-600 mb-6 space-y-2">
            <li>Acces a vos donnees personnelles</li>
            <li>Rectification des donnees inexactes</li>
            <li>Suppression de votre compte et de vos donnees</li>
            <li>Opposition au traitement de vos donnees</li>
            <li>Portabilite de vos donnees</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies</h2>
          <p className="text-gray-600 mb-6">
            Nous utilisons des cookies essentiels pour le fonctionnement du service (authentification, preferences). Aucun cookie de tracking tiers n&apos;est utilise sans votre consentement explicite.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact</h2>
          <p className="text-gray-600 mb-6">
            Pour exercer vos droits ou pour toute question relative a cette politique, contactez notre DPO a info@nzelaa.com ou ecrivez a : MMC SARL, Lubumbashi, Haut-Katanga, RDC.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
