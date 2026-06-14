'use client';

import { useEffect, useState } from 'react';
import type { CorridorNode } from '@/components/home/HomeCorridorCard';

type HomeCorridorBarProps = {
  label: string;
  title: string;
  titleHighlight: string;
  nodes: CorridorNode[];
  countries: string[];
};

function formatCatTime() {
  const t = new Date(Date.now() + new Date().getTimezoneOffset() * 60000 + 2 * 3600000);
  return `${t.toTimeString().slice(0, 8)} CAT`;
}

export function HomeCorridorBar({ label, title, titleHighlight, nodes, countries }: HomeCorridorBarProps) {
  const [clock, setClock] = useState('--:--:-- CAT');
  const titleParts = title.split(titleHighlight);

  useEffect(() => {
    const tick = () => setClock(formatCatTime());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="corridor-bar overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-r from-primary-950/75 via-primary-900/55 to-primary-950/40 p-4 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45)] backdrop-blur-xl ring-1 ring-white/10 sm:rounded-3xl sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 sm:mb-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-400" />
          </span>
          <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-primary-300">
            {label}
          </span>
        </div>
        <span className="font-mono text-xs font-medium text-primary-100 sm:text-sm" aria-live="polite">
          {clock}
        </span>
      </div>

      <p className="mb-4 text-sm font-semibold leading-snug text-white/95 sm:text-base">
        {titleParts[0]}
        <span className="text-amber-300">{titleHighlight}</span>
        {titleParts[1] ?? ''}
      </p>

      {/* Route unique : ligne + camion + villes alignées */}
      <div className="corridor-route-block relative px-1 py-1 sm:px-2">
        <div className="corridor-route-line relative mx-1 mt-5 mb-1 h-4 sm:mt-6 sm:h-5">
          <div className="corridor-route-bed absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-sm bg-white/16" aria-hidden />
          <div className="corridor-route-surface absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-sm" aria-hidden>
            <div className="h-full w-full bg-gradient-to-r from-amber-400/75 via-primary-300/90 to-amber-200/80" />
          </div>
          <div className="corridor-truck corridor-truck-loop text-base sm:text-lg" aria-hidden>
            🚛
          </div>
        </div>

        <div className="relative flex justify-between gap-1 sm:gap-2">
          {nodes.map((node) => (
            <div
              key={node.city}
              className="corridor-route-stop flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center sm:gap-2"
            >
              <span
                className={`corridor-route-pin z-[1] -mt-3 h-[11px] w-[11px] shrink-0 rounded-full sm:-mt-3.5 sm:h-3 sm:w-3 ${
                  node.active
                    ? 'bg-primary-300 shadow-[0_0_0_5px_rgba(110,231,183,0.35)]'
                    : 'bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.18)]'
                }`}
              />
              <span className="w-full truncate text-[0.65rem] font-semibold text-[#eafaf3] sm:text-xs">
                {node.city}
              </span>
              <span className="font-mono text-[0.58rem] tracking-wide text-primary-200/60 sm:text-[0.62rem]">
                {node.meta}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/8 pt-3 sm:mt-4">
        {countries.map((country) => (
          <span
            key={country}
            className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 font-mono text-[0.62rem] font-medium text-primary-100/90 sm:text-[0.65rem]"
          >
            {country}
          </span>
        ))}
      </div>
    </div>
  );
}
