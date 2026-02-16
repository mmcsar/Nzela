'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { MatchCard } from '@/components/matching/MatchCard';
import { Button } from '@/components/ui/Button';
import { Zap, RefreshCw, Filter, TrendingUp } from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';

export default function MatchingPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['broker', 'company', 'admin']);
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [minScore, setMinScore] = useState(30);

  const fetchMatches = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/matching?limit=20&minScore=${minScore}`);
      const data = await response.json();

      if (response.ok) {
        setMatches(data.matches || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setIsLoading(false);
    }
  }, [minScore]);

  useEffect(() => {
    if (isAuthorized) {
      fetchMatches();
    }
  }, [isAuthorized, fetchMatches]);

  // Conditional return AFTER all hooks
  if (authLoading || !isAuthorized) {
    return <div className="flex items-center justify-center py-16"><div className="text-gray-500">Chargement...</div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-7 h-7 text-amber-500" />
            Matching Intelligent
          </h1>
          <p className="text-gray-500 mt-1">
            Correspondances automatiques entre chargements et camions
          </p>
        </div>
        <Button onClick={fetchMatches} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{total}</div>
              <div className="text-sm text-gray-500">Correspondances trouvees</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {matches.length > 0
                  ? Math.round(matches.reduce((a: number, m: any) => a + m.score, 0) / matches.length)
                  : 0}%
              </div>
              <div className="text-sm text-gray-500">Score moyen</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Filter className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">Score minimum</label>
              <select
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value))}
                className="border rounded-lg px-2 py-1 text-sm font-semibold"
              >
                <option value={30}>30% et plus</option>
                <option value={50}>50% et plus</option>
                <option value={70}>70% et plus</option>
                <option value={80}>80% et plus</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des matchs */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Calcul des correspondances en cours...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucune correspondance</h3>
          <p className="text-gray-500 text-sm">
            Pas assez de chargements ou camions disponibles pour le matching.
            <br />
            Essayez de poster plus de chargements ou de camions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match: any, index: number) => (
            <MatchCard
              key={`${match.loadId}-${match.truckId}-${index}`}
              match={match}
              onViewLoad={() => router.push(`/dashboard/loads/${match.loadId}`)}
              onViewTruck={() => router.push(`/dashboard/company/trucks/${match.truckId}`)}
              onContact={() => router.push(`/dashboard/loads/${match.loadId}?tab=messages`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
