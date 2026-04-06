import { createClient, getAuthUser } from '@/lib/supabase/server';
import { redirect } from '@/lib/i18n/routing';
import { AdminLoadsGrid } from '@/components/admin/AdminLoadsGrid';
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
        <p className="text-gray-600 mt-1">
          Supprimer un chargement non disponible depuis la carte (admin) pour le retirer de la plateforme. La clé
          service Supabase doit être configurée sur le serveur.
        </p>
      </div>

      <AdminLoadsGrid loads={(loads || []) as Load[]} />
    </div>
  );
}




