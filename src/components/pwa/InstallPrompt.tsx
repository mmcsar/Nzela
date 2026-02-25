'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Wifi, Zap, Shield } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  // Set in useEffect to avoid hydration mismatch (navigator only on client)
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const id = setTimeout(() => setIsIOS(isIOSDevice), 0);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return () => clearTimeout(id);
    }

    // Check if dismissed recently (7 days)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return () => clearTimeout(id);
    }

    // Android / Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after a small delay for better UX
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS: show custom guide after delay
    if (isIOSDevice) {
      const isStandalone = (window.navigator as any).standalone;
      if (!isStandalone) {
        setTimeout(() => setShowPrompt(true), 5000);
      }
    }

    return () => {
      clearTimeout(id);
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  // iOS Safari instruction guide
  if (showIOSGuide) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[9999] flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2">Installer Nzela sur iPhone</h3>
          <p className="text-sm text-gray-500 mb-5">Suivez ces etapes simples :</p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <div>
                <p className="text-sm font-medium text-gray-800">Appuyez sur le bouton <strong>Partager</strong></p>
                <p className="text-xs text-gray-500 mt-0.5">L&apos;icone carree avec la fleche vers le haut en bas de Safari</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <div>
                <p className="text-sm font-medium text-gray-800">Faites defiler et appuyez sur <strong>&quot;Sur l&apos;ecran d&apos;accueil&quot;</strong></p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <div>
                <p className="text-sm font-medium text-gray-800">Confirmez en appuyant <strong>&quot;Ajouter&quot;</strong></p>
              </div>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full mt-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            J&apos;ai compris
          </button>
        </div>
      </div>
    );
  }

  // Main install banner
  return (
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm z-[9999]">
      <div className="bg-white sm:rounded-2xl border-t sm:border border-gray-200 shadow-2xl overflow-hidden">
        {/* Emerald accent bar */}
        <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />
        
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              <span className="text-white font-black text-lg">N</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-[15px]">Installer Nzela</h3>
                <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 p-1 -mr-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Acces rapide depuis votre ecran d&apos;accueil
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { icon: Zap, label: 'Rapide' },
              { icon: Wifi, label: 'Hors ligne' },
              { icon: Shield, label: 'Securise' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-2">
                <Icon className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-semibold text-gray-700">{label}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25"
            >
              <Download className="w-4 h-4" />
              Installer
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
