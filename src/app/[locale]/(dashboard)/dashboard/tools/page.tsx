'use client';

import { useState } from 'react';
import { RateEstimator } from '@/components/rates/RateEstimator';
import { TemplateManager } from '@/components/templates/TemplateManager';
import { AlertManager } from '@/components/alerts/AlertManager';
import { BarChart3, Copy, BellRing, Wrench, Calculator, Fuel, FileCheck, Navigation, Smartphone } from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';
import { Link } from '@/lib/i18n/routing';

type ToolTab = 'rates' | 'templates' | 'alerts';

const routeTools = [
  { icon: Calculator, title: 'Calculateur de tarifs', desc: 'Prix du marché selon distance, type de marchandise et saison.', action: 'rates' as const },
  { icon: Fuel, title: 'Estimateur de carburant', desc: 'Coûts carburant selon distance et consommation du véhicule.', action: null },
  { icon: FileCheck, title: 'Vérification des documents', desc: 'Authenticité des licences et permis des partenaires.', href: '/dashboard/verification' },
  { icon: Navigation, title: 'Planificateur de routes', desc: 'Itinéraires optimisés pour réduire coûts et délais.', action: null },
  { icon: Smartphone, title: 'Application mobile', desc: 'Tous les outils sur smartphone avec l\'app PWA Nzela.', action: null },
];

export default function ToolsPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['broker', 'company', 'admin']);
  const [activeTab, setActiveTab] = useState<ToolTab>('rates');

  if (authLoading || !isAuthorized) {
    return <div className="flex items-center justify-center py-16"><div className="text-gray-500">Chargement...</div></div>;
  }

  const tabs: { id: ToolTab; label: string; icon: any; desc: string }[] = [
    { id: 'rates', label: 'Tarifs', icon: BarChart3, desc: 'Estimation des prix du marché' },
    { id: 'templates', label: 'Modèles', icon: Copy, desc: 'Modèles de chargement récurrents' },
    { id: 'alerts', label: 'Alertes', icon: BellRing, desc: 'Notifications personnalisées' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wrench className="w-7 h-7 text-primary-600" />
          Outils
        </h1>
        <p className="text-gray-500 mt-1">Outils professionnels pour optimiser vos opérations</p>
      </div>

      {/* Des outils pour la route et le bureau */}
      <section className="rounded-xl border border-gray-200 bg-gray-50/50 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Des outils pour la route et le bureau</h2>
        <p className="text-sm text-gray-500 mb-5">
          Estimez les tarifs, calculez le carburant, vérifiez les documents, optimisez les itinéraires et accédez à tout depuis l&apos;app PWA.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {routeTools.map((t) => {
            const content = (
              <>
                <t.icon className="w-9 h-9 text-primary-600 mb-2" />
                <h3 className="font-semibold text-gray-900 text-sm">{t.title}</h3>
                <p className="text-xs text-gray-500">{t.desc}</p>
              </>
            );
            if (t.action === 'rates') {
              return (
                <button
                  key={t.title}
                  onClick={() => setActiveTab('rates')}
                  className="bg-white rounded-lg p-4 border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all text-left"
                >
                  {content}
                </button>
              );
            }
            if ('href' in t && t.href) {
              return (
                <Link key={t.title} href={t.href} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all text-left block">
                  {content}
                </Link>
              );
            }
            return (
              <div key={t.title} className="bg-white rounded-lg p-4 border border-gray-200 text-left opacity-90">
                {content}
              </div>
            );
          })}
        </div>
      </section>

      {/* Sélecteur d'outils */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              activeTab === tab.id
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              activeTab === tab.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              <tab.icon className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-sm font-semibold ${activeTab === tab.id ? 'text-primary-700' : 'text-gray-900'}`}>
                {tab.label}
              </div>
              <div className="text-xs text-gray-500">{tab.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div>
        {activeTab === 'rates' && <RateEstimator />}
        {activeTab === 'templates' && <TemplateManager />}
        {activeTab === 'alerts' && <AlertManager />}
      </div>
    </div>
  );
}
