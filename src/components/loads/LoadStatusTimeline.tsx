'use client';

import { Package, CheckCircle, Truck, Flag } from 'lucide-react';

const STEPS = [
  { key: 'available', label: 'Publié', icon: Package },
  { key: 'booked', label: 'Réservé', icon: CheckCircle },
  { key: 'in-transit', label: 'En transit', icon: Truck },
  { key: 'completed', label: 'Terminé', icon: Flag },
] as const;

const STATUS_ORDER = ['available', 'booked', 'in-transit', 'completed'];

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface LoadStatusTimelineProps {
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  className?: string;
}

/** Timeline des 4 statuts du chargement (Publié → Réservé → En transit → Terminé) avec dates. */
export function LoadStatusTimeline({
  status,
  createdAt,
  updatedAt,
  className = '',
}: LoadStatusTimelineProps) {
  const normalizedStatus = status === 'in_transit' ? 'in-transit' : status;
  const currentIdx = Math.max(0, STATUS_ORDER.indexOf(normalizedStatus));
  const publishedDate = formatDate(createdAt);
  const lastUpdateDate = formatDate(updatedAt);

  return (
    <div className={`rounded-lg border border-gray-100 bg-gray-50/50 p-4 ${className}`}>
      <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-3">
        Historique du statut
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-0 sm:flex-nowrap">
        {STEPS.map((step, i) => {
          const done = i <= currentIdx;
          const current = i === currentIdx;
          const Icon = step.icon;
          const date =
            i === 0
              ? publishedDate
              : current && lastUpdateDate && lastUpdateDate !== publishedDate
                ? lastUpdateDate
                : null;

          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              <div
                className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 rounded-lg border transition-all ${
                  current
                    ? 'bg-primary-100 border-primary-200 text-primary-800'
                    : done
                      ? 'bg-white border-emerald-200 text-emerald-700'
                      : 'bg-gray-100/80 border-gray-200 text-gray-400'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${done ? 'opacity-100' : 'opacity-50'}`} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{step.label}</div>
                  {date && (
                    <div className="text-[10px] text-gray-500 truncate" title={date}>
                      {date}
                    </div>
                  )}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`hidden sm:block w-4 h-0.5 flex-shrink-0 mx-0.5 ${
                    i < currentIdx ? 'bg-emerald-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
