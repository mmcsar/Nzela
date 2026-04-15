'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';

function formatTime(date: Date) {
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function Clock() {
  // null until mount: server time ≠ client time, and Node vs browser Intl can differ for locales.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    queueMicrotask(tick);
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return (
      <div
        className="inline-flex flex-col items-center justify-center rounded-2xl bg-white/12 backdrop-blur-md border border-white/30 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.25)] min-h-[5rem] min-w-[10.5rem]"
        aria-hidden
      >
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-white/70 mb-1">
          <Clock3 className="w-3 h-3" />
          Heure locale
        </span>
        <span className="text-2xl md:text-3xl font-black tabular-nums text-white/45 tracking-tight">
          -- : -- : --
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-white/55 mt-1">
          <CalendarDays className="w-3.5 h-3.5" />
          -- --- ----
        </span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex flex-col items-center justify-center rounded-2xl bg-white/12 backdrop-blur-md border border-white/30 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
      aria-live="polite"
      aria-label={`Heure actuelle : ${formatTime(now)}`}
    >
      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-white/80 mb-1">
        <Clock3 className="w-3 h-3" />
        Heure locale
      </span>
      <time dateTime={now.toISOString()} className="text-2xl md:text-3xl font-black tabular-nums text-white tracking-tight">
        {formatTime(now)}
      </time>
      <span className="inline-flex items-center gap-1 text-[11px] md:text-xs text-white/85 mt-1">
        <CalendarDays className="w-3.5 h-3.5" />
        {formatDate(now)}
      </span>
    </div>
  );
}
