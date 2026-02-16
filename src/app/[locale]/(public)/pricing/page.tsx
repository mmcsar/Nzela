import { PricingCard } from '@/components/pricing/PricingCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const pricingPlan = {
  priceUSD: 50,
  features: [
    'Publication et recherche illimitees',
    'Load Board et Truck Board',
    'Alertes de correspondance',
    'Messagerie et contact direct',
    'POD / BOL et outils essentiels',
    'Support client',
  ],
};

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Plans d&apos;abonnement Nzela</h1>
          <p className="text-primary-100 text-lg">
            Choisissez le plan qui correspond a vos besoins de logistique
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <PricingCard
              plan="standard"
              price={pricingPlan.priceUSD}
              currency="USD"
              features={pricingPlan.features}
              recommended
            />
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Tous les plans incluent un support client et des mises a jour regulieres
            </p>
            <p className="text-sm text-gray-500">
              Plan unique: 50 USD par mois. Paiement par Mobile Money, virement bancaire ou carte.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}




