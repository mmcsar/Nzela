'use client';

import { useState, useEffect, useCallback } from 'react';
import { BOL } from '@/types';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FileText, Eye, Plus, Download } from 'lucide-react';
import { downloadBOLPDF } from './BOLPrint';

export function BOLList() {
  const [bols, setBols] = useState<BOL[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const loadBOLs = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('broker_id')
        .eq('id', user.id)
        .single();

      if (!userData?.broker_id) return;

      // Get BOLs for this broker's loads
      const { data: loads } = await supabase
        .from('loads')
        .select('id')
        .eq('broker_id', userData.broker_id);

      if (!loads || loads.length === 0) {
        setIsLoading(false);
        return;
      }

      const loadIds = loads.map((l) => l.id);

      const { data, error } = await supabase
        .from('bols')
        .select('*')
        .in('load_id', loadIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBols((data || []) as BOL[]);
    } catch (error) {
      console.error('Error loading BOLs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadBOLs();
  }, [loadBOLs]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mes Bordereaux de Chargement</h1>
        <Link
          href="/dashboard/broker/bol/create"
          className="inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Créer un BOL
        </Link>
      </div>

      {bols.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucun BOL créé</h3>
          <p className="text-gray-600 mb-6">
            Créez votre premier bordereau de chargement pour suivre vos expéditions
          </p>
          <Link
            href="/dashboard/broker/bol/create"
            className="inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer un BOL
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origine → Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Poids total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valeur totale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de création
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bols.map((bol) => {
                const origin = typeof bol.origin === 'string' ? JSON.parse(bol.origin) : bol.origin;
                const destination = typeof bol.destination === 'string' ? JSON.parse(bol.destination) : bol.destination;

                return (
                  <tr key={bol.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      BOL-{bol.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {origin.city} → {destination.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bol.totalWeight.toLocaleString()} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bol.totalValue.toLocaleString()} CDF
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(bol.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        bol.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        bol.status === 'signed' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {bol.status === 'draft' ? 'Brouillon' :
                         bol.status === 'signed' ? 'Signé' :
                         'Complété'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/broker/bol/${bol.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Voir
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const raw = bol as any;
                            const pdfBol = {
                              ...bol,
                              loadId: raw.load_id ?? bol.loadId,
                              truckId: raw.truck_id ?? bol.truckId,
                              shipper: raw.shipper ?? bol.shipper,
                              carrier: raw.carrier ?? bol.carrier,
                              consignee: raw.consignee ?? (bol as any).consignee,
                              origin: typeof raw.origin === 'string' ? JSON.parse(raw.origin) : (raw.origin ?? bol.origin),
                              destination: typeof raw.destination === 'string' ? JSON.parse(raw.destination) : (raw.destination ?? bol.destination),
                              items: Array.isArray(raw.items) ? raw.items : (bol.items ?? []),
                              totalWeight: Number(raw.total_weight ?? bol.totalWeight ?? 0),
                              totalValue: Number(raw.total_value ?? bol.totalValue ?? 0),
                              pickupDate: raw.pickup_date ? new Date(raw.pickup_date) : bol.pickupDate,
                              deliveryDate: raw.delivery_date ? new Date(raw.delivery_date) : bol.deliveryDate,
                              createdAt: raw.created_at ? new Date(raw.created_at) : bol.createdAt,
                              status: raw.status ?? bol.status,
                            };
                            (pdfBol as any).bol_number = raw.bol_number ?? `BOL-${bol.id.substring(0, 8).toUpperCase()}`;
                            (pdfBol as any).bolNumber = (pdfBol as any).bol_number;
                            downloadBOLPDF(pdfBol as BOL);
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Télécharger PDF
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}




