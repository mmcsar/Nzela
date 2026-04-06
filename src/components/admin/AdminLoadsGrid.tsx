'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { LoadCard } from '@/components/loads/LoadCard';
import type { Load } from '@/types';
import { Trash2 } from 'lucide-react';

type AdminLoad = Load & { status?: string };

export function AdminLoadsGrid({ loads }: { loads: AdminLoad[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer définitivement ce chargement ?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/loads/${id}`, { method: 'DELETE' });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        alert(typeof j.error === 'string' ? j.error : 'Erreur lors de la suppression');
        return;
      }
      setRemoved((prev) => new Set(prev).add(id));
      router.refresh();
    } finally {
      setDeleting(null);
    }
  };

  const visible = loads.filter((l) => !removed.has(l.id));

  if (visible.length === 0) {
    return <p className="text-gray-500">Aucun chargement trouvé</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {visible.map((load) => {
        const status = load.status ?? 'available';
        const canDelete = status !== 'available';
        return (
          <div key={load.id} className="relative">
            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void handleDelete(load.id);
                }}
                disabled={deleting === load.id}
                className="absolute top-2 right-2 z-20 flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2 py-1.5 text-xs font-medium text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-50"
                title="Supprimer ce chargement (réservé ou en cours)"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                {deleting === load.id ? '…' : 'Supprimer'}
              </button>
            )}
            <LoadCard load={load as Load} />
          </div>
        );
      })}
    </div>
  );
}
