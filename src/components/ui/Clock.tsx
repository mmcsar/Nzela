'use client';

import { useState, useEffect } from 'react';

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
        className="inline-flex flex-col items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 px-5 py-3 shadow-lg min-h-[4.5rem] min-w-[8.5rem]"
        aria-hidden
      >
        <span className="text-2xl md:text-3xl font-bold tabular-nums text-white/40 tracking-tight">
          --:--:--
        </span>
        <span className="text-xs md:text-sm mt-0.5 h-4 w-36 max-w-full" aria-hidden />
      </div>
    );
  }

  return (
    <div
      className="inline-flex flex-col items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 px-5 py-3 shadow-lg"
      aria-live="polite"
      aria-label={`Heure actuelle : ${formatTime(now)}`}
    >
      <time dateTime={now.toISOString()} className="text-2xl md:text-3xl font-bold tabular-nums text-white tracking-tight">
        {formatTime(now)}
      </time>
      <span className="text-xs md:text-sm text-white/80 mt-0.5">
        {formatDate(now)}
      </span>
    </div>
  );
}
