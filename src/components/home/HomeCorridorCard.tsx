'use client';

import { useEffect, useState } from 'react';

export type CorridorNode = {
  city: string;
  meta: string;
  active?: boolean;
};

type HomeCorridorCardProps = {
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

export function HomeCorridorCard({ label, title, titleHighlight, nodes, countries }: HomeCorridorCardProps) {
  const [clock, setClock] = useState('--:--:-- CAT');

  useEffect(() => {
    const tick = () => setClock(formatCatTime());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const titleParts = title.split(titleHighlight);

  return (
    <div className="relative isolate overflow-hidden rounded-[26px] bg-gradient-to-br from-primary-900 to-primary-700 p-7 sm:p-8 text-white shadow-[0_30px_70px_-28px_rgba(5,61,44,0.42)]">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-50"
        style={{
          background: 'radial-gradient(80% 60% at 80% 0%, rgba(110,231,183,0.32), transparent 60%)',
        }}
        aria-hidden
      />
      <div className="mb-2 flex items-start justify-between gap-3">
        <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary-300">
          {label}
        </span>
        <span
          className="shrink-0 rounded-lg border border-white/10 bg-white/[0.08] px-2.5 py-1 font-mono text-[0.82rem] text-[#d6f5e8]"
          aria-live="polite"
        >
          {clock}
        </span>
      </div>
      <p className="mb-5 font-display text-[1.32rem] font-bold leading-tight tracking-tight">
        {titleParts[0]}
        <span className="text-primary-300">{titleHighlight}</span>
        {titleParts[1] ?? ''}
      </p>
      <div className="px-1 py-1.5">
        <div className="relative mx-1.5 mb-3.5 mt-7 h-[3px] rounded-sm bg-white/15">
          <div className="corridor-route-fill absolute inset-0 w-0 rounded-sm bg-gradient-to-r from-primary-300 to-white" />
          <div className="corridor-truck corridor-truck-once text-lg" aria-hidden>
            🚛
          </div>
        </div>
        <div className="relative flex justify-between">
          {nodes.map((node) => (
            <div
              key={node.city}
              className={`corridor-node flex flex-1 flex-col items-center gap-1.5 text-center ${node.active ? 'corridor-node-active' : ''}`}
            >
              <span
                className={`h-[11px] w-[11px] rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.18)] ${
                  node.active ? 'bg-primary-300 shadow-[0_0_0_5px_rgba(110,231,183,0.3)]' : ''
                }`}
              />
              <span className="text-[0.78rem] font-semibold text-[#eafaf3]">{node.city}</span>
              <span className="font-mono text-[0.62rem] tracking-wide text-[rgba(214,245,232,0.6)]">{node.meta}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
        {countries.map((country) => (
          <span
            key={country}
            className="rounded-md border border-white/10 bg-white/[0.08] px-2.5 py-1 font-mono text-[0.68rem] font-semibold text-[#d6f5e8]"
          >
            {country}
          </span>
        ))}
      </div>
    </div>
  );
}
