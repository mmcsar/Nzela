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
    <div className="corridor-bar overflow-hidden rounded-xl border border-white/15 bg-gradient-to-r from-primary-950/75 via-primary-900/55 to-primary-950/40 p-3 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45)] backdrop-blur-xl ring-1 ring-white/10 sm:rounded-2xl sm:p-4 md:rounded-3xl md:p-5">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5 sm:mb-3 sm:pb-3 md:mb-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-400" />
          </span>
          <span className="truncate font-mono text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-primary-300 sm:text-[0.68rem] sm:tracking-[0.14em]">
            {label}
          </span>
        </div>
        <span className="shrink-0 font-mono text-[0.68rem] font-medium text-primary-100 sm:text-xs md:text-sm" aria-live="polite">
          {clock}
        </span>
      </div>

      <p className="mb-3 text-[0.8125rem] font-semibold leading-snug text-white/95 sm:mb-4 sm:text-sm md:text-base">
        {titleParts[0]}
        <span className="text-amber-300">{titleHighlight}</span>
        {titleParts[1] ?? ''}
      </p>

      {/* Route : défilement horizontal sur très petit écran */}
      <div className="corridor-route-block -mx-0.5 overflow-x-auto px-0.5 pb-0.5 scrollbar-hide sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="min-w-[20.5rem] sm:min-w-0">
          <div className="corridor-route-line relative mx-0.5 mt-4 mb-1 h-4 sm:mx-1 sm:mt-5 sm:h-5">
            <div className="corridor-route-bed absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-sm bg-white/16" aria-hidden />
            <div className="corridor-route-surface absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-sm" aria-hidden>
              <div className="h-full w-full bg-gradient-to-r from-amber-400/75 via-primary-300/90 to-amber-200/80" />
            </div>
            <div className="corridor-truck corridor-truck-loop text-sm sm:text-base md:text-lg" aria-hidden>
              🚛
            </div>
          </div>

          <div className="relative flex justify-between gap-0.5 sm:gap-1 md:gap-2">
            {nodes.map((node) => (
              <div
                key={node.city}
                className="corridor-route-stop flex min-w-0 flex-1 flex-col items-center gap-1 text-center sm:gap-1.5 md:gap-2"
              >
                <span
                  className={`corridor-route-pin z-[1] -mt-2.5 h-[10px] w-[10px] shrink-0 rounded-full sm:-mt-3 sm:h-[11px] sm:w-[11px] md:-mt-3.5 md:h-3 md:w-3 ${
                    node.active
                      ? 'bg-primary-300 shadow-[0_0_0_4px_rgba(110,231,183,0.35)] sm:shadow-[0_0_0_5px_rgba(110,231,183,0.35)]'
                      : 'bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.18)] sm:shadow-[0_0_0_4px_rgba(255,255,255,0.18)]'
                  }`}
                />
                <span className="w-full px-0.5 text-[0.58rem] font-semibold leading-tight text-[#eafaf3] sm:text-[0.65rem] md:text-xs">
                  {node.city}
                </span>
                <span className="font-mono text-[0.52rem] tracking-wide text-primary-200/60 sm:text-[0.58rem] md:text-[0.62rem]">
                  {node.meta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex gap-1.5 overflow-x-auto border-t border-white/8 pt-2.5 scrollbar-hide sm:mt-3 sm:flex-wrap sm:overflow-visible sm:pt-3 md:mt-4">
        {countries.map((country) => (
          <span
            key={country}
            className="shrink-0 rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.58rem] font-medium text-primary-100/90 sm:px-2 sm:text-[0.62rem] md:text-[0.65rem]"
          >
            {country}
          </span>
        ))}
      </div>
    </div>
  );
}
