'use client';

import { useState, useEffect } from 'react';
import { useRouter, Link } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { Truck } from '@/types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Plus, Eye } from 'lucide-react';

export default function TrucksPage() {
  const router = useRouter();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Get user's company
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (!userData?.company_id) {
          return;
        }

        // Fetch trucks for this company
        const { data, error } = await supabase
          .from('trucks')
          .select('*, company:companies(*)')
          .eq('company_id', userData.company_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTrucks(data || []);
      } catch (error) {
        console.error('Error fetching trucks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrucks();
  }, [router, supabase]);

  const columns: Column<Truck>[] = [
    {
      key: 'type',
      header: 'Type',
      sortable: true,
    },
    {
      key: 'capacity',
      header: 'Capacité (kg)',
      sortable: true,
      render: (value) => <span>{value?.toLocaleString() || '0'} kg</span>,
    },
    {
      key: 'currentLocation',
      header: 'Localisation',
      render: (value) => {
        const location = typeof value === 'string' ? JSON.parse(value) : value;
        return <span>{location?.city || 'N/A'}</span>;
      },
    },
    {
      key: 'price',
      header: 'Prix fixe (CDF)',
      sortable: true,
      render: (value) => (
        <span className="font-semibold text-green-600">
          {value?.toLocaleString() || '0'} CDF
        </span>
      ),
    },
    {
      key: 'pricePerKm',
      header: 'Prix/km (CDF)',
      sortable: true,
      render: (value) => <span>{value?.toLocaleString() || '0'} CDF/km</span>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (value) => {
        const statusColors = {
          available: 'bg-green-100 text-green-800',
          booked: 'bg-orange-100 text-orange-800',
          'in-transit': 'bg-blue-100 text-blue-800',
          maintenance: 'bg-yellow-100 text-yellow-800',
        };
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              statusColors[value as keyof typeof statusColors] ||
              'bg-gray-100 text-gray-800'
            }`}
          >
            {value}
          </span>
        );
      },
    },
    {
      key: 'availableDate',
      header: 'Disponible le',
      sortable: true,
      render: (value) => (
        <span>
          {new Date(value).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Actions',
      render: (value, row) => (
        <Link href={`/dashboard/company/trucks/${value}`}>
          <Button size="sm" variant="outline">
            <Eye className="w-4 h-4 mr-1" />
            Voir
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mes camions</h1>
        <Link href="/dashboard/company/trucks/post">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Publier un camion
          </Button>
        </Link>
      </div>

      <DataTable
        data={trucks}
        columns={columns}
        isLoading={isLoading}
        pagination={{ pageSize: 10 }}
        onRowClick={(row) => router.push(`/dashboard/company/trucks/${row.id}`)}
        emptyMessage="Aucun camion trouvé. Publiez votre premier camion !"
      />
    </div>
  );
}

