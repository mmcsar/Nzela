'use client';

import { useState, useEffect, useCallback } from 'react';
import { Company } from '@/types';
import { Button } from '@/components/ui/Button';
import { Building2, Search, BadgeCheck, Ban } from 'lucide-react';
import { toErrorMessage } from '@/lib/api/error';

export function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('pending');
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const loadCompanies = useCallback(async () => {
    setConfigError(null);
    try {
      const params = new URLSearchParams({ status: statusFilter });
      const res = await fetch(`/api/admin/companies?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || 'Erreur chargement';
        if (res.status === 503 || msg.includes('SUPABASE_SERVICE_ROLE_KEY') || msg.includes('Configuration manquante')) {
          setConfigError(msg);
          setCompanies([]);
          return;
        }
        throw new Error(msg);
      }
      setCompanies((data.companies || []) as Company[]);
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleStatusChange = async (companyId: string, newStatus: 'active' | 'suspended' | 'pending') => {
    setValidatingId(companyId);
    try {
      const res = await fetch('/api/admin/entity-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'company', entityId: companyId, status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(toErrorMessage(data.error, 'Erreur'));
      await loadCompanies();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la validation');
    } finally {
      setValidatingId(null);
    }
  };

  const filteredCompanies = companies.filter((company) => {
    const term = searchTerm.toLowerCase();
    const name = (company.name ?? '').toLowerCase();
    const email = (company.email ?? '').toLowerCase();
    const regNo = ((company as any).registration_number ?? company.registrationNumber ?? '').toLowerCase();
    return name.includes(term) || email.includes(term) || regNo.includes(term);
  });

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {configError && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <strong>Configuration requise</strong> — {configError}
          <p className="mt-2 font-medium">À faire :</p>
          <ol className="list-decimal list-inside mt-1 space-y-0.5 text-amber-900">
            <li>Ouvrez le <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Dashboard Supabase</a> → votre projet</li>
            <li>Settings → API → section <strong>Project API keys</strong></li>
            <li>Copiez la clé <strong>service_role</strong> (secret, ne la partagez pas)</li>
            <li>Dans le projet, créez ou éditez <code className="bg-amber-100 px-1 rounded">.env.local</code> et ajoutez : <code className="bg-amber-100 px-1 rounded block mt-1">SUPABASE_SERVICE_ROLE_KEY=votre_clé_copiée</code></li>
            <li>Redémarrez le serveur (<code className="bg-amber-100 px-1 rounded">npm run dev</code>)</li>
          </ol>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Entreprises</h1>
          <p className="text-gray-600 mt-1">Gérer toutes les entreprises inscrites sur la plateforme</p>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary-600" />
          <span className="text-2xl font-bold text-primary-600">{companies.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, numéro d'enregistrement..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="suspended">Suspendues</option>
            <option value="pending">En attente</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entreprise
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localisation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d&apos;inscription
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
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Aucune entreprise trouvée
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => {
                  const status = (company as any).status ?? company.status ?? 'pending';
                  return (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{company.name}</div>
                        <div className="text-sm text-gray-500">N°: {(company as any).registration_number ?? company.registrationNumber ?? '—'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{company.email}</div>
                      <div className="text-sm text-gray-500">{company.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{company.city}</div>
                      <div className="text-sm text-gray-500">{company.province}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date((company as any).created_at ?? company.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${
                          status === 'active' ? 'bg-green-100 text-green-800' :
                          status === 'suspended' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                        value={status}
                        onChange={(e) => handleStatusChange(company.id, e.target.value as any)}
                      >
                        <option value="active">Actif</option>
                        <option value="suspended">Suspendu</option>
                        <option value="pending">En attente</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(company.id, 'active')}
                          disabled={validatingId !== null}
                          className={status === 'pending' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                          variant={status === 'pending' ? undefined : 'outline'}
                        >
                          <BadgeCheck className="w-3.5 h-3.5 mr-1" />
                          Valider
                        </Button>
                        {status !== 'suspended' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(company.id, 'suspended')}
                            disabled={validatingId !== null}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Ban className="w-3.5 h-3.5 mr-1" />
                            Suspendre
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(company.id, 'pending')}
                            disabled={validatingId !== null}
                          >
                            Remettre en attente
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );})
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}




