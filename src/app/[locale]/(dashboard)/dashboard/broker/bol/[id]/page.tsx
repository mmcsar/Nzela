'use client';

import { useEffect, useState } from 'react';
import { useRouter, Link } from '@/lib/i18n/routing';
import { useParams } from 'next/navigation';
import { BOLView } from '@/components/bol/BOLView';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Loader2, Printer, Download } from 'lucide-react';
import { BOL } from '@/types';
import { downloadBOLPDF, generateBOLPDF } from '@/components/bol/BOLPrint';

export default function BOLDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [bol, setBOL] = useState<BOL | null>(null);
  const [bolNumber, setBolNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const fetchBOL = async () => {
      try {
        const { data, error } = await supabase
          .from('bols')
          .select('*, load:loads(*)')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        
        // Store BOL number
        setBolNumber(data.bol_number || data.id.slice(0, 8));
        
        // Map Supabase data to BOL type (shipper/carrier/consignee en JSONB)
        const load = data.load;
        const shipperObj = data.shipper && typeof data.shipper === 'object' ? data.shipper : {};
        const carrierObj = data.carrier && typeof data.carrier === 'object' ? data.carrier : {};
        const consigneeObj = data.consignee && typeof data.consignee === 'object' ? data.consignee : {};
        const mappedBOL: BOL = {
          id: data.id,
          loadId: data.load_id,
          truckId: data.truck_id || '',
          shipper: {
            name: shipperObj.name ?? data.shipper_name,
            address: shipperObj.address ?? data.shipper_address,
            phone: shipperObj.phone ?? data.shipper_phone,
            city: shipperObj.city,
            province: shipperObj.province,
          } as any,
          carrier: {
            name: carrierObj.name ?? data.carrier_name,
            address: carrierObj.address ?? data.carrier_address,
            phone: carrierObj.phone ?? data.carrier_phone,
            scac: carrierObj.scac,
          } as any,
          origin: (data.origin && typeof data.origin === 'object') ? data.origin : (load?.origin || { address: '', city: '', province: 'haut-katanga' }),
          destination: (data.destination && typeof data.destination === 'object') ? data.destination : (load?.destination || { address: '', city: '', province: 'haut-katanga' }),
          items: Array.isArray(data.items) ? data.items : [],
          totalWeight: Number(data.total_weight) || (Array.isArray(data.items) ? data.items.reduce((sum: number, item: any) => sum + (item.weight || 0), 0) : 0),
          totalValue: Number(data.total_value) || (Array.isArray(data.items) ? data.items.reduce((sum: number, item: any) => sum + (item.value || 0), 0) : 0),
          pickupDate: data.pickup_date ? new Date(data.pickup_date) : (load?.pickup_date ? new Date(load.pickup_date) : new Date()),
          deliveryDate: data.delivery_date ? new Date(data.delivery_date) : (load?.delivery_date ? new Date(load.delivery_date) : new Date()),
          signature: data.signature || undefined,
          status: data.status,
          createdAt: new Date(data.created_at),
        };
        (mappedBOL as any).consignee = consigneeObj.name ? consigneeObj : { name: data.consignee_name, address: data.consignee_address, city: data.consignee_city, phone: data.consignee_phone };
        (mappedBOL as any).bol_number = data.bol_number;
        (mappedBOL as any).special_instructions = data.special_instructions;
        
        setBOL(mappedBOL);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement du BOL');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchBOL();
    }
  }, [params.id, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !bol) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'BOL introuvable'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">BOL #{bolNumber}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const bolData = { ...bol, bolNumber: bolNumber };
              downloadBOLPDF(bolData as any);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Telecharger PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const bolData = { ...bol, bolNumber: bolNumber };
              const doc = generateBOLPDF(bolData as any);
              const pdfBlob = doc.output('blob');
              const url = URL.createObjectURL(pdfBlob);
              const printWindow = window.open(url);
              if (printWindow) {
                printWindow.onload = () => {
                  printWindow.print();
                };
              }
            }}
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </div>

      <BOLView bol={bol} />
    </div>
  );
}


