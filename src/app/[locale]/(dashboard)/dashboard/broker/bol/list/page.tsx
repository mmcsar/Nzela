'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, Link } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Plus, Eye, FileText, RefreshCw, Search, Download, Printer } from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';
import { useRealtimeBols } from '@/hooks/useRealtimeBols';
import { downloadBOLPDF, generateBOLPDF } from '@/components/bol/BOLPrint';

interface BOL {
  id: string;
  bol_number: string;
  load_id: string;
  status: 'draft' | 'signed' | 'completed';
  shipper_name: string;
  consignee_name: string;
  total_weight: number;
  total_value: number;
  created_at: string;
  load?: any;
}

export default function BOLListPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['broker', 'admin']);
  const router = useRouter();
  const supabase = createClient();

  const [bols, setBols] = useState<BOL[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchBOLs = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: userData } = await supabase
        .from('users')
        .select('broker_id')
        .eq('id', user.id)
        .single();

      if (!userData?.broker_id) {
        setIsLoading(false);
        return;
      }

      // bols n'a pas broker_id -> filtrer via loads (load.broker_id)
      const { data: loadIds } = await supabase
        .from('loads')
        .select('id')
        .eq('broker_id', userData.broker_id);
      const ids = (loadIds || []).map((l) => l.id);
      if (ids.length === 0) {
        setBols([]);
        return;
      }

      let query = supabase
        .from('bols')
        .select('*, load:loads(*)')
        .in('load_id', ids)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      // Normaliser shipper/consignee (JSON) -> shipper_name, consignee_name pour affichage
      const normalized = (data || []).map((b: any) => ({
        ...b,
        shipper_name: b.shipper?.name ?? b.shipper_name ?? 'N/A',
        consignee_name: b.consignee?.name ?? b.consignee_name ?? 'N/A',
      }));
      setBols(normalized);
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      console.error('Error fetching BOLs:', err?.message || err?.code || JSON.stringify(error));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, supabase, router]);

  useEffect(() => {
    if (isAuthorized) {
      fetchBOLs();
    }
  }, [isAuthorized, statusFilter, fetchBOLs]);

  // WebSocket Realtime : mises à jour instantanées sur les BOL
  useRealtimeBols(fetchBOLs);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      signed: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
    };
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      signed: 'Signe',
      completed: 'Complete',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('fr-CD', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return 'N/A'; }
  };

  const filteredBols = bols.filter((bol) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      (bol.bol_number || '').toLowerCase().includes(term) ||
      (bol.shipper_name || '').toLowerCase().includes(term) ||
      (bol.consignee_name || '').toLowerCase().includes(term) ||
      bol.id.toLowerCase().includes(term)
    );
  });

  // Stats
  const stats = [
    { label: 'Total', value: bols.length, color: 'text-gray-700' },
    { label: 'Brouillons', value: bols.filter(b => b.status === 'draft').length, color: 'text-gray-500' },
    { label: 'Signes', value: bols.filter(b => b.status === 'signed').length, color: 'text-blue-600' },
    { label: 'Completes', value: bols.filter(b => b.status === 'completed').length, color: 'text-emerald-600' },
  ];

  // Conditional return AFTER all hooks
  if (authLoading || !isAuthorized) {
    return <div className="flex items-center justify-center py-16"><div className="text-gray-500">Chargement...</div></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary-600" />
            Mes BOL
          </h1>
          <p className="text-gray-500 mt-1">Connaissements (Bill of Lading)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBOLs} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Link href="/dashboard/broker/bol/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Creer un BOL
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <div className="text-sm text-gray-500">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par numero, expediteur, destinataire..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white min-w-[180px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="signed">Signe</option>
            <option value="completed">Complete</option>
          </select>
        </div>
      </div>

      {/* Compteur */}
      <div className="text-sm text-gray-500">
        {filteredBols.length} BOL affiche{filteredBols.length > 1 ? 's' : ''}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">N BOL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Expediteur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Destinataire</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Poids</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Valeur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : filteredBols.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    Aucun BOL trouve. Creez votre premier BOL !
                  </td>
                </tr>
              ) : (
                filteredBols.map((bol) => (
                  <tr
                    key={bol.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/broker/bol/${bol.id}`)}
                  >
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-primary-600 whitespace-nowrap">
                      {bol.bol_number || bol.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {bol.shipper_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {bol.consignee_name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {bol.total_weight?.toLocaleString() || 0} kg
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {bol.total_value?.toLocaleString() || 0} CDF
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(bol.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(bol.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Voir details"
                          onClick={() => router.push(`/dashboard/broker/bol/${bol.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Telecharger PDF"
                          onClick={() => {
                            const bolData = {
                              id: bol.id,
                              loadId: bol.load_id,
                              truckId: '',
                              shipper: { name: bol.shipper_name },
                              carrier: {},
                              consignee: { name: bol.consignee_name },
                              origin: bol.load?.origin || {},
                              destination: bol.load?.destination || {},
                              items: bol.load?.items || [],
                              totalWeight: bol.total_weight || 0,
                              totalValue: bol.total_value || 0,
                              pickupDate: bol.load?.pickup_date || new Date(),
                              deliveryDate: bol.load?.delivery_date || new Date(),
                              status: bol.status,
                              createdAt: new Date(bol.created_at),
                              bolNumber: bol.bol_number,
                            };
                            downloadBOLPDF(bolData as any);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors"
                          title="Imprimer"
                          onClick={() => {
                            const bolData = {
                              id: bol.id,
                              loadId: bol.load_id,
                              truckId: '',
                              shipper: { name: bol.shipper_name },
                              carrier: {},
                              consignee: { name: bol.consignee_name },
                              origin: bol.load?.origin || {},
                              destination: bol.load?.destination || {},
                              items: bol.load?.items || [],
                              totalWeight: bol.total_weight || 0,
                              totalValue: bol.total_value || 0,
                              pickupDate: bol.load?.pickup_date || new Date(),
                              deliveryDate: bol.load?.delivery_date || new Date(),
                              status: bol.status,
                              createdAt: new Date(bol.created_at),
                              bolNumber: bol.bol_number,
                            };
                            const doc = generateBOLPDF(bolData as any);
                            const pdfBlob = doc.output('blob');
                            const url = URL.createObjectURL(pdfBlob);
                            const printWindow = window.open(url);
                            if (printWindow) {
                              printWindow.onload = () => { printWindow.print(); };
                            }
                          }}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
