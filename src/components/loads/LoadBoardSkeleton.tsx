'use client';

import { useId } from 'react';

export type LoadBoardSkeletonVariant = 'page' | 'table' | 'cards' | 'map' | 'kpis';

type LoadBoardSkeletonProps = {
  variant?: LoadBoardSkeletonVariant;
  rows?: number;
  label?: string;
  className?: string;
  embedded?: boolean;
};

function Shimmer({ className = '' }: { className?: string }) {
  return <div className={`lb-skeleton-shimmer rounded-md bg-slate-200/80 ${className}`} />;
}

function RouteShimmer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`space-y-1.5 ${compact ? '' : 'min-w-[10rem]'}`}>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Shimmer className="h-3 w-16" />
          <Shimmer className="h-2 w-7" />
        </div>
        <div className="space-y-1 text-right">
          <Shimmer className="ml-auto h-3 w-16" />
          <Shimmer className="ml-auto h-2 w-7" />
        </div>
      </div>
      <div className="flex items-center gap-1 px-0.5">
        <Shimmer className="h-0.5 flex-1 rounded-full" />
        <Shimmer className="h-3 w-3 shrink-0 rounded-sm" />
      </div>
    </div>
  );
}

function TableRows({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
          <td className="px-2 py-3">
            <Shimmer className="mx-auto h-3.5 w-3.5 rounded" />
          </td>
          <td className="px-3 py-3">
            <Shimmer className="mb-1 h-3 w-20" />
            <Shimmer className="h-2.5 w-14" />
          </td>
          <td className="px-3 py-3">
            <RouteShimmer />
          </td>
          <td className="px-3 py-3">
            <Shimmer className="h-5 w-16 rounded-full" />
          </td>
          <td className="px-3 py-3 text-right">
            <Shimmer className="ml-auto h-3 w-10" />
          </td>
          <td className="px-3 py-3 text-right">
            <Shimmer className="ml-auto h-3 w-8" />
          </td>
          <td className="px-3 py-3 text-right">
            <Shimmer className="ml-auto h-3 w-14" />
          </td>
          <td className="px-3 py-3 text-right">
            <Shimmer className="ml-auto h-5 w-12 rounded" />
          </td>
          <td className="px-3 py-3">
            <Shimmer className="h-5 w-20 rounded-full" />
          </td>
          <td className="px-3 py-3">
            <Shimmer className="mb-1 h-3 w-24" />
            <Shimmer className="h-2.5 w-16" />
          </td>
          <td className="px-3 py-3">
            <div className="flex justify-center gap-1">
              <Shimmer className="h-7 w-7 rounded-lg" />
              <Shimmer className="h-7 w-7 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

function CardGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200/90 bg-white/95 p-4 shadow-sm"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="mb-3 flex items-center justify-between">
            <Shimmer className="h-5 w-24 rounded-full" />
            <Shimmer className="h-4 w-4 rounded" />
          </div>
          <RouteShimmer />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((__, j) => (
              <Shimmer key={j} className="h-10 rounded-lg" />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <Shimmer className="h-3 w-28" />
            <Shimmer className="h-5 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MapSkeleton({ label, embedded = false }: { label?: string; embedded?: boolean }) {
  const gradId = useId().replace(/:/g, '');
  const inner = (
    <div className="lb-map-skeleton relative h-full min-h-[min(56vh,500px)] w-full bg-gradient-to-br from-slate-100 via-emerald-50/40 to-blue-50/50 sm:min-h-[500px]">
      <div className="absolute inset-0 opacity-40">
        <svg className="h-full w-full" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <path
            className="lb-map-skeleton-route"
            d="M40,180 Q120,60 200,120 T360,80"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="2"
            strokeDasharray="6 5"
          />
          <path
            className="lb-map-skeleton-route lb-map-skeleton-route-delay"
            d="M60,200 Q160,140 240,160 T380,140"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="2"
            strokeDasharray="6 5"
          />
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.55" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="lb-map-skeleton-pulse absolute left-[12%] top-[68%] h-3 w-3 rounded-full bg-blue-400/70 ring-4 ring-blue-400/20" />
      <div
        className="lb-map-skeleton-pulse absolute left-[78%] top-[28%] h-2.5 w-2.5 rounded-full bg-emerald-400/70 ring-4 ring-emerald-400/20"
        style={{ animationDelay: '0.4s' }}
      />
      <div className="lb-map-skeleton-travel absolute left-[48%] top-[46%] h-2 w-2 rounded-full bg-primary-400/80 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-white/90 via-white/50 to-transparent py-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          {label ?? 'Chargement de la carte…'}
        </div>
      </div>
    </div>
  );

  if (embedded) return inner;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border bg-white shadow-sm">{inner}</div>
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} className="h-4 w-20" />
        ))}
      </div>
    </div>
  );
}

function KpiRow() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 lg:grid-cols-7 sm:overflow-visible sm:pb-0">
      {Array.from({ length: 7 }).map((_, i) => (
        <Shimmer key={i} className="h-[4.25rem] min-w-[7.5rem] shrink-0 rounded-xl sm:min-w-0 sm:h-[4.5rem]" />
      ))}
    </div>
  );
}

export function LoadBoardSkeleton({
  variant = 'page',
  rows = 8,
  label,
  className = '',
  embedded = false,
}: LoadBoardSkeletonProps) {
  if (variant === 'table') {
    return <TableRows rows={rows} />;
  }

  if (variant === 'cards') {
    return (
      <div className={className}>
        <CardGrid count={rows >= 6 ? 6 : rows} />
      </div>
    );
  }

  if (variant === 'map') {
    return (
      <div className={className}>
        <MapSkeleton label={label} embedded={embedded} />
      </div>
    );
  }

  if (variant === 'kpis') {
    return (
      <div className={className}>
        <KpiRow />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} aria-busy="true" aria-live="polite">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shimmer className="h-8 w-8 rounded-lg" />
            <Shimmer className="h-6 w-40" />
          </div>
          <Shimmer className="h-3 w-56" />
        </div>
        <div className="flex gap-2">
          <Shimmer className="h-8 w-24 rounded-lg" />
          <Shimmer className="h-8 w-8 rounded-lg" />
          <Shimmer className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      <KpiRow />
      <Shimmer className="h-10 w-full rounded-xl" />
      <div className="overflow-hidden rounded-xl border border-gray-200/90 bg-white/95 shadow-sm">
        <table className="min-w-full">
          <thead className="border-b border-gray-100 bg-slate-50">
            <tr>
              {Array.from({ length: 11 }).map((_, i) => (
                <th key={i} className="px-3 py-3">
                  <Shimmer className="h-2.5 w-12" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <TableRows rows={rows} />
          </tbody>
        </table>
      </div>
      {label && (
        <p className="text-center text-sm text-gray-500">{label}</p>
      )}
    </div>
  );
}
