'use client';

import { UrgencyType } from '@/lib/constants/rdc-routes';

interface UrgencyBadgeProps {
  urgency: UrgencyType;
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  const styles = {
    express: 'bg-gradient-to-r from-red-500/20 to-red-600/15 text-red-300 border-2 border-red-400/40 shadow-lg shadow-red-500/20',
    urgent: 'bg-gradient-to-r from-amber-500/20 to-orange-500/15 text-amber-300 border-2 border-amber-400/40 shadow-lg shadow-amber-500/20',
    normal: 'bg-gradient-to-r from-emerald-500/20 to-green-500/15 text-emerald-300 border-2 border-emerald-400/40 shadow-lg shadow-emerald-500/20',
  };

  const labels = {
    express: 'EXPRESS',
    urgent: 'URGENT',
    normal: 'NORMAL',
  };

  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${styles[urgency]}`}>
      {labels[urgency]}
    </span>
  );
}

