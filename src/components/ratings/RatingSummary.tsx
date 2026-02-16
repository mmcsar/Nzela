'use client';

import { useState, useEffect, useCallback } from 'react';
import { RatingStars } from './RatingStars';
import { Star, RefreshCw, User } from 'lucide-react';

interface RatingSummaryData {
  entityId: string;
  entityType: string;
  averageOverall: number;
  averageCommunication: number;
  averagePunctuality: number;
  averageReliability: number;
  totalReviews: number;
  recentReviews: any[];
}

interface RatingSummaryProps {
  entityId: string;
  entityType: 'company' | 'broker';
  compact?: boolean;
}

export function RatingSummary({ entityId, entityType, compact = false }: RatingSummaryProps) {
  const [summary, setSummary] = useState<RatingSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(`/api/ratings?entityId=${entityId}&entityType=${entityType}`);
      const data = await response.json();
      if (response.ok) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (isLoading) {
    return <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />;
  }

  if (!summary) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <RatingStars value={summary.averageOverall} readonly size="sm" />
        <span className="text-sm font-medium text-gray-700">{summary.averageOverall.toFixed(1)}</span>
        <span className="text-xs text-gray-400">({summary.totalReviews})</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score global */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-extrabold text-gray-900">{summary.averageOverall.toFixed(1)}</div>
          <RatingStars value={summary.averageOverall} readonly size="md" />
          <div className="text-xs text-gray-500 mt-1">{summary.totalReviews} avis</div>
        </div>

        <div className="flex-1 space-y-2">
          {[
            { label: 'Communication', value: summary.averageCommunication },
            { label: 'Ponctualité', value: summary.averagePunctuality },
            { label: 'Fiabilité', value: summary.averageReliability },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-28">{item.label}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${(item.value / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700 w-6 text-right">{item.value.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Avis récents */}
      {summary.recentReviews.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">Avis récents</h4>
          {summary.recentReviews.map((review: any) => (
            <div key={review.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-gray-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{review.reviewerName}</span>
                </div>
                <RatingStars value={review.overall} readonly size="sm" />
              </div>
              {review.comment && (
                <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
              )}
              <div className="text-[10px] text-gray-400 mt-1">
                {new Date(review.createdAt).toLocaleDateString('fr-CD')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
