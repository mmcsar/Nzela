import { createClient, getAuthUser } from '@/lib/supabase/server';
import { redirect } from '@/lib/i18n/routing';
import { LoadCard } from '@/components/loads/LoadCard';
import { Load } from '@/types';
import { getLocale } from 'next-intl/server';

export default async function AdminLoadsPage() {
  const locale = await getLocale();
  const { user, role } = await getAuthUser();

  if (!user) return redirect({ href: '/login', locale });
  if (role !== 'admin') return redirect({ href: '/dashboard', locale });

  const supabase = await createClient();
  const { data: loads, error } = await supabase
    .from('loads')
    .select('*, broker:brokers(*)')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tous les Chargements</h1>
        <p className="text-gray-600 mt-1">Voir tous les chargements postés sur la plateforme</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loads && loads.length > 0 ? (
          loads.map((load) => (
            <LoadCard key={load.id} load={load as Load} />
          ))
        ) : (
          <p className="text-gray-500">Aucun chargement trouvé</p>
        )}
      </div>
    </div>
  );
}




