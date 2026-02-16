import { createClient, getAuthUser } from '@/lib/supabase/server';
import { redirect } from '@/lib/i18n/routing';
import { TruckCard } from '@/components/trucks/TruckCard';
import { Truck } from '@/types';
import { getLocale } from 'next-intl/server';

export default async function AdminTrucksPage() {
  const locale = await getLocale();
  const { user, role } = await getAuthUser();

  if (!user) return redirect({ href: '/login', locale });
  if (role !== 'admin') return redirect({ href: '/dashboard', locale });

  const supabase = await createClient();
  const { data: trucks, error } = await supabase
    .from('trucks')
    .select('*, company:companies(*)')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tous les Camions</h1>
        <p className="text-gray-600 mt-1">Voir tous les camions postés sur la plateforme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trucks && trucks.length > 0 ? (
          trucks.map((truck) => (
            <TruckCard key={truck.id} truck={truck as Truck} showActions={false} />
          ))
        ) : (
          <p className="text-gray-500">Aucun camion trouvé</p>
        )}
      </div>
    </div>
  );
}




