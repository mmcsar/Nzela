'use client';

import { useState, useEffect } from 'react';
import { useRequireRole } from '@/hooks/useRequireRole';
import { useRouter } from '@/lib/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Package, Truck, AlertTriangle, CheckCircle2, Plus, Bell, CreditCard } from 'lucide-react';
import { toErrorMessage } from '@/lib/api/error';

type SubscriptionAccess = {
  hasAccess: boolean;
  isTrial: boolean;
  trialEndsAt: string | null;
  message: string;
};

export default function PublishHubPage() {
  const { isLoading, isAuthorized, authError, role, brokerId, companyId } = useRequireRole(['broker', 'company', 'admin']);
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccess | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  /** Ids profil rafraîchis depuis l'API (évite contexte layout périmé après lien admin) */
  const [profileFromApi, setProfileFromApi] = useState<{ companyId: string | null; brokerId: string | null } | null>(null);

  const effectiveBrokerId = brokerId ?? profileFromApi?.brokerId ?? null;
  const effectiveCompanyId = companyId ?? profileFromApi?.companyId ?? null;
  const needsSubscriptionCheck = (role === 'broker' && effectiveBrokerId) || (role === 'company' && effectiveCompanyId);
  const needsProfileLink = (role === 'company' && !effectiveCompanyId) || (role === 'broker' && !effectiveBrokerId);

  // Rafraîchir les ids profil depuis l'API (courtier/entreprise) pour débloquer le formulaire après lien admin
  useEffect(() => {
    if (role !== 'broker' && role !== 'company') return;
    let cancelled = false;
    fetch('/api/auth/sync-profile', { method: 'POST', credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setProfileFromApi({
          companyId: data.companyId ?? null,
          brokerId: data.brokerId ?? null,
        });
        if ((data.companyId && role === 'company') || (data.brokerId && role === 'broker')) {
          router.refresh();
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [role, router]);

  useEffect(() => {
    if (!needsSubscriptionCheck) {
      setLoadingSubscription(false);
      return;
    }
    let cancelled = false;
    fetch('/api/subscription/access', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401 && !cancelled) setSessionExpired(true);
        return res.ok ? res.json() : Promise.reject(new Error(res.status === 401 ? 'Session expirée. Reconnectez-vous.' : 'Erreur accès'));
      })
      .then((data: SubscriptionAccess) => {
        if (!cancelled) setSubscriptionAccess(data);
      })
      .catch(() => {
        if (!cancelled) setSubscriptionAccess(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingSubscription(false);
      });
    return () => { cancelled = true; };
  }, [needsSubscriptionCheck]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[360px]">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-amber-200 rounded-xl p-5">
        <p className="font-semibold text-amber-700">Acces indisponible</p>
        <p className="text-sm text-gray-600 mt-1">
          {authError || 'Session invalide ou profil incomplet.'}
        </p>
        <div className="mt-4">
          <Button size="sm" onClick={() => router.push('/login')}>
            Se reconnecter
          </Button>
        </div>
      </div>
    );
  }

  const canPublishLoad = role === 'broker';
  const canPublishTruck = role === 'company';
  const hasBrokerProfile = Boolean(effectiveBrokerId);
  const hasCompanyProfile = Boolean(effectiveCompanyId);
  const hasSubscriptionAccess = !needsSubscriptionCheck || subscriptionAccess?.hasAccess === true;
  const subscriptionUrl = role === 'company' ? '/dashboard/company/subscription' : '/dashboard/broker/subscription';

  const handleRequestValidation = async () => {
    setRequesting(true);
    setRequestSent(false);
    try {
      const res = await fetch('/api/auth/request-profile-link', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(toErrorMessage(data.error, 'Erreur'));
      setRequestSent(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur lors de l\'envoi');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Plus className="w-6 h-6 text-primary-600" />
          Publier
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Regle plateforme: broker publie des loads, entreprise publie des trucks.
        </p>
      </div>

      {role === 'company' && !hasCompanyProfile && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-3">
          <p>Votre rôle est entreprise, mais aucun profil entreprise n&apos;est lié. Si vous vous êtes inscrit comme entreprise, cliquez sur &quot;Rattacher mon entreprise&quot;. Sinon, demandez à l&apos;admin de vous associer.</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setRequesting(true);
                try {
                  const res = await fetch('/api/auth/sync-profile', { method: 'POST', credentials: 'include' });
                  const data = await res.json().catch(() => ({}));
                  if (data?.companyId) router.refresh();
                } finally {
                  setRequesting(false);
                }
              }}
              disabled={requestSent}
              isLoading={requesting}
              className="border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Rattacher mon entreprise
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestValidation}
              disabled={requestSent}
              className="border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              <Bell className="w-4 h-4 mr-1.5" />
              {requestSent ? 'Demande envoyée' : 'Notifier l\'administrateur'}
            </Button>
          </div>
        </div>
      )}
      {role === 'broker' && !hasBrokerProfile && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-3">
          <p>Votre rôle est courtier, mais aucun profil courtier n&apos;est lié. Si vous vous êtes inscrit comme courtier, cliquez sur &quot;Rattacher mon profil courtier&quot;. Sinon, demandez à l&apos;admin de vous associer.</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setRequesting(true);
                try {
                  const res = await fetch('/api/auth/sync-profile', { method: 'POST', credentials: 'include' });
                  const data = await res.json().catch(() => ({}));
                  if (data?.brokerId) router.refresh();
                } finally {
                  setRequesting(false);
                }
              }}
              disabled={requestSent}
              isLoading={requesting}
              className="border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Rattacher mon profil courtier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestValidation}
              disabled={requestSent}
              className="border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              <Bell className="w-4 h-4 mr-1.5" />
              {requestSent ? 'Demande envoyée' : 'Notifier l\'administrateur'}
            </Button>
          </div>
        </div>
      )}
      {sessionExpired && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="font-medium">Session expirée ou absente. Reconnectez-vous pour publier.</p>
          <Button size="sm" onClick={() => router.push('/login')} className="shrink-0">
            Se reconnecter
          </Button>
        </div>
      )}

      {role === 'admin' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          Le role admin ne publie pas directement. Utilisez un compte courtier pour les loads et un compte entreprise pour les trucks.
        </div>
      )}

      {needsSubscriptionCheck && !loadingSubscription && subscriptionAccess && !subscriptionAccess.hasAccess && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {subscriptionAccess.message}
          </p>
          <Button
            onClick={() => router.push(subscriptionUrl)}
            className="shrink-0 border-rose-300 text-rose-800 bg-white hover:bg-rose-100 flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            S&apos;abonner
          </Button>
        </div>
      )}

      {needsSubscriptionCheck && !loadingSubscription && subscriptionAccess?.isTrial && subscriptionAccess.trialEndsAt && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">
          <span className="font-medium">Période gratuite</span> — {subscriptionAccess.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {canPublishLoad && (
          <button
            type="button"
            onClick={() => router.push('/dashboard/broker/loads/post')}
            className="bg-white border rounded-xl p-5 text-left w-full hover:border-primary-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary-600" />
                  Publier un chargement
                </h2>
                <p className="text-sm text-gray-600 mt-1">Réservé aux comptes courtier (broker).</p>
              </div>
              {hasBrokerProfile && hasSubscriptionAccess ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  Actif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  À activer
                </span>
              )}
            </div>
            <div className="mt-4">
              <span className="inline-flex items-center justify-center w-full rounded-lg bg-primary-600 text-white font-medium py-2.5 px-4">
                Ouvrir le formulaire
              </span>
            </div>
          </button>
        )}

        {canPublishTruck && (
          <button
            type="button"
            onClick={() => router.push('/dashboard/company/trucks/post')}
            className="bg-white border rounded-xl p-5 text-left w-full hover:border-primary-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-orange-600" />
                  Publier un camion
                </h2>
                <p className="text-sm text-gray-600 mt-1">Réservé aux comptes entreprise (company).</p>
              </div>
              {hasCompanyProfile && hasSubscriptionAccess ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  Actif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-medium bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                  <AlertTriangle className="w-3 h-3" />
                  À activer
                </span>
              )}
            </div>
            <div className="mt-4">
              <span className="inline-flex items-center justify-center w-full rounded-lg bg-primary-600 text-white font-medium py-2.5 px-4">
                Ouvrir le formulaire
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

