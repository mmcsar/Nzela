'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Users, Search, BadgeCheck, Ban, Clock, Loader2, Trash2, Info, Bell, CheckCircle2, XCircle, Filter, Building2 } from 'lucide-react';
import { useRequireRole } from '@/hooks/useRequireRole';
import { toErrorMessage } from '@/lib/api/error';

type UserRole = 'admin' | 'company' | 'broker';

interface UserWithDetails {
  id: string;
  email: string;
  role: UserRole;
  company_id: string | null;
  broker_id: string | null;
  created_at: string;
  companyName?: string | null;
  brokerName?: string | null;
  entityStatus?: 'active' | 'suspended' | 'pending';
}

export default function AdminUsersPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['admin']);
  const t = useTranslations('common');
  const tAuth = useTranslations('auth');
  const tRoles = useTranslations('roles');
  const tAdmin = useTranslations('admin.users');

  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string; owner_id?: string }[]>([]);
  const [brokers, setBrokers] = useState<{ id: string; name: string; owner_id?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [entityStatusFilter, setEntityStatusFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>(''); // '' = Tous types, 'company', 'broker'
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [linkingUserId, setLinkingUserId] = useState<string | null>(null);
  const [statusUserId, setStatusUserId] = useState<string | null>(null);
  const [associationRequests, setAssociationRequests] = useState<Array<{
    id: string;
    user_id: string;
    entity_type: 'company' | 'broker';
    created_at: string;
    email?: string | null;
    full_name?: string | null;
  }>>([]);
  const [dismissingRequestId, setDismissingRequestId] = useState<string | null>(null);

  const supabase = createClient();

  const loadUsers = useCallback(async () => {
    try {
      let query = supabase
        .from('users')
        .select('id, email, role, company_id, broker_id, created_at')
        .order('created_at', { ascending: false });

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data: usersData, error } = await query;
      if (error) throw error;

      const usersList = (usersData || []) as UserWithDetails[];
      const companyIds = [...new Set(usersList.map((u) => u.company_id).filter(Boolean))] as string[];
      const brokerIds = [...new Set(usersList.map((u) => u.broker_id).filter(Boolean))] as string[];

      const [companiesRes, brokersRes] = await Promise.all([
        companyIds.length > 0 ? supabase.from('companies').select('id, name, status').in('id', companyIds) : { data: [] },
        brokerIds.length > 0 ? supabase.from('brokers').select('id, name, status').in('id', brokerIds) : { data: [] },
      ]);

      const companyMap = new Map((companiesRes.data || []).map((c: any) => [c.id, { name: c.name, status: c.status }]));
      const brokerMap = new Map((brokersRes.data || []).map((b: any) => [b.id, { name: b.name, status: b.status }]));

      const usersWithNames = usersList.map((u) => {
        const entity = u.company_id ? companyMap.get(u.company_id) : u.broker_id ? brokerMap.get(u.broker_id) : null;
        return {
          ...u,
          companyName: u.company_id ? (companyMap.get(u.company_id) as any)?.name ?? null : null,
          brokerName: u.broker_id ? (brokerMap.get(u.broker_id) as any)?.name ?? null : null,
          entityStatus: (entity as any)?.status ?? null,
        };
      });

      setUsers(usersWithNames);
      const res = await fetch('/api/admin/association-requests');
      const data = await res.json();
      if (res.ok && Array.isArray(data.requests)) setAssociationRequests(data.requests);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, supabase]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    async function loadEntities() {
      try {
        const res = await fetch('/api/admin/entities-list');
        const data = await res.json();
        if (res.ok) {
          setCompanies(data.companies || []);
          setBrokers(data.brokers || []);
        }
      } catch {
        const [c, b] = await Promise.all([
          supabase.from('companies').select('id, name, owner_id').order('name'),
          supabase.from('brokers').select('id, name, owner_id').order('name'),
        ]);
        setCompanies((c.data || []) as { id: string; name: string; owner_id?: string }[]);
        setBrokers((b.data || []) as { id: string; name: string; owner_id?: string }[]);
      }
    }
    loadEntities();
  }, [supabase]);


  const dismissAssociationRequest = async (requestId: string) => {
    setDismissingRequestId(requestId);
    try {
      const res = await fetch('/api/admin/association-requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId }),
      });
      if (res.ok) {
        setAssociationRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
    } catch {
      // ignore
    } finally {
      setDismissingRequestId(null);
    }
  };

  const handleLinkProfile = async (userId: string, entityType: 'company' | 'broker', entityId: string) => {
    if (!entityId) return;
    setLinkingUserId(userId);
    try {
      const res = await fetch('/api/admin/link-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, entityType, entityId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(toErrorMessage(data.error, 'Erreur'));
      await loadUsers();
      setAssociationRequests((prev) => prev.filter((r) => r.user_id !== userId));
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Erreur lors de l\'association');
    } finally {
      setLinkingUserId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      await loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEntityStatus = async (userId: string, action: 'approve' | 'suspend' | 'pending' | 'unlink') => {
    setStatusUserId(userId);
    try {
      const res = await fetch('/api/admin/user-entity-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(toErrorMessage(data.error, 'Erreur'));
      await loadUsers();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setStatusUserId(null);
    }
  };

  const getCompanyBrokerName = (user: UserWithDetails) => {
    if (user.companyName) return user.companyName;
    if (user.brokerName) return user.brokerName;
    return '—';
  };

  const filteredUsers = users.filter((user) => {
    if (!user.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (entityTypeFilter === 'company' && user.role !== 'company') return false;
    if (entityTypeFilter === 'broker' && user.role !== 'broker') return false;
    if (entityStatusFilter !== 'all') {
      const status = user.entityStatus ?? null;
      if (entityStatusFilter === 'pending') {
        if (status === 'pending') return true;
        if (status === null && (user.role === 'company' || user.role === 'broker')) return true;
        return false;
      }
      if (entityStatusFilter === 'active' && status !== 'active') return false;
      if (entityStatusFilter === 'suspended' && status !== 'suspended') return false;
    }
    return true;
  });

  if (authLoading || !isAuthorized || isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-500">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tAdmin('title')}</h1>
          <p className="text-gray-600 mt-1">{tAdmin('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-primary-600" />
          <span className="text-2xl font-bold text-primary-600">
            {filteredUsers.length} {tAdmin('totalUsers')}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={tAdmin('searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white min-w-[160px]"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
            >
              <option value="all">{tAdmin('allRoles')}</option>
              <option value="admin">{tRoles('admin')}</option>
              <option value="company">{tRoles('company')}</option>
              <option value="broker">{tRoles('broker')}</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase mr-1">Statut :</span>
            {[
              { value: 'pending', label: 'En attente', icon: Clock, color: 'amber' },
              { value: 'active', label: 'Approuvés', icon: CheckCircle2, color: 'emerald' },
              { value: 'suspended', label: 'Rejetés', icon: XCircle, color: 'red' },
              { value: 'all', label: 'Tous', icon: Filter, color: 'gray' },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setEntityStatusFilter(f.value as typeof entityStatusFilter)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  entityStatusFilter === f.value
                    ? f.value === 'pending'
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : f.value === 'active'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : f.value === 'suspended'
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : 'bg-gray-100 border-gray-300 text-gray-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <f.icon className="w-3.5 h-3.5" />
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase mr-1">Type :</span>
            {[
              { value: '', label: 'Tous types' },
              { value: 'broker', label: 'Courtiers' },
              { value: 'company', label: 'Entreprises' },
            ].map((f) => (
              <button
                key={f.value || 'all'}
                type="button"
                onClick={() => setEntityTypeFilter(f.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  entityTypeFilter === f.value
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {f.value === 'broker' && <Users className="w-3.5 h-3.5" />}
                {f.value === 'company' && <Building2 className="w-3.5 h-3.5" />}
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Demandes d'association (Notifier l'admin) */}
      {associationRequests.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="font-semibold text-amber-900 flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 text-amber-600" />
            {associationRequests.length} demande(s) d&apos;association
          </p>
          <p className="text-sm text-amber-800 mb-3">
            Ces utilisateurs ont cliqué sur &quot;Notifier l&apos;administrateur&quot;. Associez leur profil ci-dessous puis cliquez sur &quot;Traiter&quot; pour retirer la demande.
          </p>
          <ul className="space-y-2">
            {associationRequests.map((req) => (
              <li
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 bg-white rounded-lg border border-amber-100 text-sm"
              >
                <span className="text-gray-700">
                  <strong>{req.email ?? req.full_name ?? req.user_id}</strong>
                  {' — '}
                  {req.entity_type === 'company' ? 'Entreprise' : 'Courtier'}
                  {' · '}
                  {new Date(req.created_at).toLocaleString()}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => dismissAssociationRequest(req.id)}
                  disabled={dismissingRequestId !== null}
                  className="!py-1 !px-2 text-xs text-amber-700 border-amber-300 hover:bg-amber-100"
                >
                  {dismissingRequestId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Traiter'}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Guide : associer puis approuver */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">En tant qu&apos;admin : comment approuver un utilisateur</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            <li><strong>Associer</strong> — Si la colonne « Profil » affiche « — Choisir une entreprise — » ou « — Choisir un courtier — » : cliquez sur le bouton vert <strong>Associer « Nom »</strong> (société créée par l&apos;utilisateur) ou choisissez dans la liste déroulante pour lier le compte.</li>
            <li><strong>Approuver</strong> — Une fois le profil associé, les boutons <strong>Valider</strong> / <strong>Suspendre</strong> apparaissent dans la colonne Actions. Cliquez sur <strong>Approuver</strong> pour passer le statut à Actif.</li>
          </ol>
          {companies.length === 0 && brokers.length === 0 && (
            <p className="mt-2 text-amber-700 font-medium">La liste des entreprises/courtiers est vide. Exécutez le script <code className="bg-white/60 px-1 rounded">supabase/a_ajouter_sur_supabase.sql</code> sur Supabase (SQL Editor) pour que l&apos;admin puisse les lire.</p>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {tAuth('email')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {tAdmin('role')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {tAdmin('companyBroker')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {tAdmin('dateCreated')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {tAdmin('noUsersFound')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{user.email}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'company'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tRoles(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.company_id || user.broker_id ? (
                        <div>
                          <div>{getCompanyBrokerName(user)}</div>
                          {user.entityStatus && (
                            <span className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                              user.entityStatus === 'active' ? 'bg-green-100 text-green-700' :
                              user.entityStatus === 'suspended' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {user.entityStatus === 'active' ? 'Actif' : user.entityStatus === 'suspended' ? 'Suspendu' : 'En attente'}
                            </span>
                          )}
                        </div>
                      ) : user.role === 'company' ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {(() => {
                            const ownedCompany = companies.find((c) => c.owner_id === user.id);
                            return ownedCompany ? (
                              <Button
                                size="sm"
                                onClick={() => handleLinkProfile(user.id, 'company', ownedCompany.id)}
                                disabled={linkingUserId === user.id}
                                className="bg-emerald-600 hover:bg-emerald-700 !py-1 !px-2 text-xs"
                              >
                                {linkingUserId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                Associer « {ownedCompany.name} »
                              </Button>
                            ) : null;
                          })()}
                          <select
                            className="px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 min-w-[180px]"
                            defaultValue=""
                            onChange={(e) => {
                              const id = e.target.value;
                              if (id) handleLinkProfile(user.id, 'company', id);
                            }}
                            disabled={linkingUserId === user.id}
                          >
                            <option value="">{companies.length ? '— Choisir une entreprise —' : '— Aucune entreprise —'}</option>
                            {companies.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      ) : user.role === 'broker' ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {(() => {
                            const ownedBroker = brokers.find((b) => b.owner_id === user.id);
                            return ownedBroker ? (
                              <Button
                                size="sm"
                                onClick={() => handleLinkProfile(user.id, 'broker', ownedBroker.id)}
                                disabled={linkingUserId === user.id}
                                className="bg-emerald-600 hover:bg-emerald-700 !py-1 !px-2 text-xs"
                              >
                                {linkingUserId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                Associer « {ownedBroker.name} »
                              </Button>
                            ) : null;
                          })()}
                          <select
                            className="px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500 min-w-[180px]"
                            defaultValue=""
                            onChange={(e) => {
                              const id = e.target.value;
                              if (id) handleLinkProfile(user.id, 'broker', id);
                            }}
                            disabled={linkingUserId === user.id}
                          >
                            <option value="">{brokers.length ? '— Choisir un courtier —' : '— Aucun courtier —'}</option>
                            {brokers.map((b) => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <select
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white w-fit"
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value as UserRole)
                          }
                          disabled={updatingId === user.id}
                        >
                          <option value="admin">{tRoles('admin')}</option>
                          <option value="company">{tRoles('company')}</option>
                          <option value="broker">{tRoles('broker')}</option>
                        </select>
                        {(user.role === 'company' || user.role === 'broker') && (user.company_id || user.broker_id) && (
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleEntityStatus(user.id, 'approve')}
                              disabled={statusUserId !== null}
                              className="!py-0.5 !px-2 text-[11px] bg-emerald-600 hover:bg-emerald-700"
                            >
                              {statusUserId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <BadgeCheck className="w-2.5 h-2.5 mr-0.5" />}
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEntityStatus(user.id, 'suspend')}
                              disabled={statusUserId !== null}
                              className="!py-0.5 !px-2 text-[11px] text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Ban className="w-2.5 h-2.5 mr-0.5" />
                              Suspendre
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEntityStatus(user.id, 'pending')}
                              disabled={statusUserId !== null}
                              className="!py-0.5 !px-2 text-[11px] text-amber-600 border-amber-200 hover:bg-amber-50"
                            >
                              <Clock className="w-2.5 h-2.5 mr-0.5" />
                              En attente
                            </Button>
                            {(user.company_id || user.broker_id) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (confirm('Dissocier cet utilisateur de son entreprise/courtier ?')) {
                                    handleEntityStatus(user.id, 'unlink');
                                  }
                                }}
                                disabled={statusUserId !== null}
                                className="!py-0.5 !px-2 text-[11px] text-gray-600 border-gray-200 hover:bg-gray-50"
                              >
                                <Trash2 className="w-2.5 h-2.5 mr-0.5" />
                                Supprimer
                              </Button>
                            )}
                          </div>
                        )}
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
