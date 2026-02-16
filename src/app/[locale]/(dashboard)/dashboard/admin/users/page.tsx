'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Users, Search, BadgeCheck, Ban, Clock, Loader2, Trash2 } from 'lucide-react';
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
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [brokers, setBrokers] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [linkingUserId, setLinkingUserId] = useState<string | null>(null);
  const [statusUserId, setStatusUserId] = useState<string | null>(null);

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
        // fallback: requête directe si l'API échoue
        const [c, b] = await Promise.all([
          supabase.from('companies').select('id, name').order('name'),
          supabase.from('brokers').select('id, name').order('name'),
        ]);
        setCompanies((c.data || []) as { id: string; name: string }[]);
        setBrokers((b.data || []) as { id: string; name: string }[]);
      }
    }
    loadEntities();
  }, [supabase]);

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

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={tAdmin('searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white min-w-[180px]"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | UserRole)}
          >
            <option value="all">{tAdmin('allRoles')}</option>
            <option value="admin">{tRoles('admin')}</option>
            <option value="company">{tRoles('company')}</option>
            <option value="broker">{tRoles('broker')}</option>
          </select>
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
                        <select
                          className="px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500"
                          defaultValue=""
                          onChange={(e) => {
                            const id = e.target.value;
                            if (id) handleLinkProfile(user.id, 'company', id);
                          }}
                          disabled={linkingUserId === user.id}
                        >
                          <option value="">— Associer entreprise —</option>
                          {companies.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : user.role === 'broker' ? (
                        <select
                          className="px-2 py-1 text-xs border rounded focus:ring-2 focus:ring-primary-500"
                          defaultValue=""
                          onChange={(e) => {
                            const id = e.target.value;
                            if (id) handleLinkProfile(user.id, 'broker', id);
                          }}
                          disabled={linkingUserId === user.id}
                        >
                          <option value="">— Associer courtier —</option>
                          {brokers.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
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
