'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Link } from '@/lib/i18n/routing';
import { FileText, Search, Eye, Download, RefreshCw, Plus } from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';
import { downloadBOLPDF } from '@/components/bol/BOLPrint';

export default function AdminBOLPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['admin']);
  const [bols, setBols] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const supabase = createClient();

  const loadBOLs = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('bols')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBols(data || []);
    } catch (error) {
      console.error('Error loading BOLs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, supabase]);

  useEffect(() => {
    loadBOLs();
  }, [loadBOLs]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      signed: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
    };
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      signed: 'Signé',
      completed: 'Complété',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredBols = bols.filter((bol) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const bolNumber = (bol.bol_number || bol.id).toLowerCase();
    const shipperData = typeof bol.shipper === 'string' ? JSON.parse(bol.shipper) : bol.shipper;
    const shipperName = (shipperData?.name || '').toLowerCase();
    return bolNumber.includes(term) || shipperName.includes(term) || bol.id.toLowerCase().includes(term);
  });

  if (authLoading || !isAuthorized) {
    return <div className="flex items-center justify-center py-16"><div className="text-gray-500">Chargement...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary-600" />
            Gestion des BOL
          </h1>
          <p className="text-gray-500 mt-1">Tous les connaissements (Bill of Lading)</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/broker/bol/create"
            className="inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Creer un BOL
          </Link>
          <Button variant="outline" onClick={loadBOLs} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par ID..."
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
            <option value="signed">Signé</option>
            <option value="completed">Complété</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: bols.length, color: 'bg-gray-100 text-gray-700' },
          { label: 'Brouillons', value: bols.filter(b => b.status === 'draft').length, color: 'bg-gray-100 text-gray-600' },
          { label: 'Signés', value: bols.filter(b => b.status === 'signed').length, color: 'bg-blue-100 text-blue-700' },
          { label: 'Complétés', value: bols.filter(b => b.status === 'completed').length, color: 'bg-emerald-100 text-emerald-700' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-4">
            <div className="text-sm text-gray-500">{stat.label}</div>
            <div className={`text-2xl font-bold mt-1 ${stat.color.split(' ')[1]}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">N° BOL</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Expediteur</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Poids total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Valeur</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : filteredBols.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>Aucun BOL trouve</p>
                    <Link href="/dashboard/broker/bol/create" className="text-primary-600 text-sm font-medium mt-2 inline-block hover:underline">
                      Creer votre premier Bordereau de Chargement
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredBols.map((bol) => {
                  const shipperData = typeof bol.shipper === 'string' ? JSON.parse(bol.shipper) : bol.shipper;
                  const bolNumber = bol.bol_number || `BOL-${bol.id.substring(0, 8).toUpperCase()}`;
                  return (
                    <tr key={bol.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono font-semibold text-primary-700">
                        <Link href={`/dashboard/broker/bol/${bol.id}`} className="hover:underline">
                          {bolNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {shipperData?.name || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {bol.total_weight?.toLocaleString() || 0} kg
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {bol.total_value?.toLocaleString() || 0} CDF
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(bol.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(bol.created_at).toLocaleDateString('fr-CD')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`/dashboard/broker/bol/${bol.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Voir">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              const bolData = {
                                ...bol,
                                shipper: shipperData,
                                carrier: typeof bol.carrier === 'string' ? JSON.parse(bol.carrier) : bol.carrier,
                                origin: typeof bol.origin === 'string' ? JSON.parse(bol.origin) : bol.origin,
                                destination: typeof bol.destination === 'string' ? JSON.parse(bol.destination) : bol.destination,
                                items: typeof bol.items === 'string' ? JSON.parse(bol.items) : bol.items,
                                totalWeight: bol.total_weight,
                                totalValue: bol.total_value,
                                pickupDate: bol.pickup_date,
                                deliveryDate: bol.delivery_date,
                                createdAt: bol.created_at,
                                bolNumber: bolNumber,
                              };
                              downloadBOLPDF(bolData as any);
                            }}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors"
                            title="Telecharger PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
