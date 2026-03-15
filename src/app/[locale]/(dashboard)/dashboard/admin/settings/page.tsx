'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRequireRole } from '@/hooks/useRequireRole';
import { Button } from '@/components/ui/Button';
import {
  Settings, Shield, Bell, Code, Globe, CreditCard, Palette,
  Database, Users, Truck, Package, Mail, Smartphone, Wifi,
  Save, CheckCircle2, AlertTriangle, Info, ChevronRight,
  Eye, EyeOff, Copy, RefreshCw, Server, HardDrive, Building2,
  MapPin, FileText, Zap, Clock, Lock, Unlock,
  MonitorSmartphone, Languages, DollarSign, Scale,
  Table2, Key, Link2, Hash, BarChart3, Activity,
  ArrowUpRight, ArrowDownRight, Layers, GitBranch,
} from 'lucide-react';
import { ALL_REGION_IDS, ALL_REGION_NAMES } from '@/lib/constants/rdc-provinces';

// ── Toggle Switch Component ──
function Toggle({ enabled, onChange, disabled = false }: { enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
        enabled ? 'bg-primary-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ── Setting Row Component ──
function SettingRow({ icon: Icon, iconColor, label, description, children }: {
  icon: any; iconColor: string; label: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`p-1.5 rounded-lg mt-0.5 ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">{children}</div>
    </div>
  );
}

// ── Section Component ──
function Section({ icon: Icon, title, subtitle, children, badge }: {
  icon: any; title: string; subtitle?: string; children: React.ReactNode; badge?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-primary-600" />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {badge && (
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary-100 text-primary-700">{badge}</span>
          )}
        </div>
      </div>
      <div className="px-5 py-2">{children}</div>
    </div>
  );
}

// ── Stat Card ──
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// DATABASE TAB COMPONENT
// ══════════════════════════════════════════

interface TableSchema {
  name: string;
  displayName: string;
  icon: any;
  iconColor: string;
  count: number;
  columns: { name: string; type: string; nullable: boolean; isPrimary?: boolean; isForeign?: boolean; refTable?: string; hasDefault?: boolean }[];
  indexes: string[];
  rlsPolicies: { name: string; action: string; description: string }[];
  triggers: string[];
  recentEntries: any[];
  growth: number[];
}

function DatabaseTab({ dbStats }: { dbStats: { users: number; companies: number; brokers: number; trucks: number; loads: number; bols: number; payments: number } }) {
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [recentData, setRecentData] = useState<Record<string, any[]>>({});
  const [loadingRecent, setLoadingRecent] = useState<string | null>(null);
  const supabase = createClient();

  const totalRecords = Object.values(dbStats).reduce((a, b) => a + b, 0);

  const tables: TableSchema[] = [
    {
      name: 'users', displayName: 'Utilisateurs', icon: Users, iconColor: 'bg-blue-100 text-blue-600',
      count: dbStats.users,
      columns: [
        { name: 'id', type: 'UUID', nullable: false, isPrimary: true, hasDefault: true },
        { name: 'email', type: 'TEXT', nullable: false },
        { name: 'role', type: 'TEXT', nullable: false, hasDefault: true },
        { name: 'full_name', type: 'TEXT', nullable: true },
        { name: 'phone', type: 'TEXT', nullable: true },
        { name: 'company_id', type: 'UUID', nullable: true, isForeign: true, refTable: 'companies' },
        { name: 'broker_id', type: 'UUID', nullable: true, isForeign: true, refTable: 'brokers' },
        { name: 'created_at', type: 'TIMESTAMPTZ', nullable: true, hasDefault: true },
        { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: true, hasDefault: true },
      ],
      indexes: ['idx_users_email (email)', 'idx_users_role (role)', 'idx_users_company (company_id)', 'idx_users_broker (broker_id)'],
      rlsPolicies: [
        { name: 'users_select_own', action: 'SELECT', description: 'Utilisateur voit son propre profil' },
        { name: 'users_update_own', action: 'UPDATE', description: 'Utilisateur modifie son profil' },
        { name: 'users_admin_all', action: 'ALL', description: 'Admin a acces total' },
      ],
      triggers: ['update_updated_at_column BEFORE UPDATE'],
      recentEntries: [], growth: [2, 3, 1, 5, 4, 3, 6, 2, 4, 5, 3, 7],
    },
    {
      name: 'companies', displayName: 'Entreprises', icon: Building2, iconColor: 'bg-purple-100 text-purple-600',
      count: dbStats.companies,
      columns: [
        { name: 'id', type: 'UUID', nullable: false, isPrimary: true, hasDefault: true },
        { name: 'name', type: 'TEXT', nullable: false },
        { name: 'rccm', type: 'TEXT', nullable: true },
        { name: 'id_nat', type: 'TEXT', nullable: true },
        { name: 'address', type: 'TEXT', nullable: false },
        { name: 'city', type: 'TEXT', nullable: false },
        { name: 'province', type: 'TEXT', nullable: false },
        { name: 'phone', type: 'TEXT', nullable: true },
        { name: 'email', type: 'TEXT', nullable: true },
        { name: 'created_at', type: 'TIMESTAMPTZ', nullable: true, hasDefault: true },
        { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: true, hasDefault: true },
      ],
      indexes: ['idx_companies_name (name)', 'idx_companies_province (province)'],
      rlsPolicies: [
        { name: 'companies_select_own', action: 'SELECT', description: 'Employes voient leur entreprise' },
        { name: 'companies_admin_all', action: 'ALL', description: 'Admin a acces total' },
      ],
      triggers: ['update_updated_at_column BEFORE UPDATE'],
      recentEntries: [], growth: [1, 0, 2, 1, 0, 1, 2, 1, 0, 3, 1, 2],
    },
    {
      name: 'brokers', displayName: 'Courtiers', icon: Users, iconColor: 'bg-indigo-100 text-indigo-600',
      count: dbStats.brokers,
      columns: [
        { name: 'id', type: 'UUID', nullable: false, isPrimary: true, hasDefault: true },
        { name: 'name', type: 'TEXT', nullable: false },
        { name: 'license_number', type: 'TEXT', nullable: true },
        { name: 'address', type: 'TEXT', nullable: false },
        { name: 'city', type: 'TEXT', nullable: false },
        { name: 'province', type: 'TEXT', nullable: false },
        { name: 'phone', type: 'TEXT', nullable: true },
        { name: 'email', type: 'TEXT', nullable: true },
        { name: 'created_at', type: 'TIMESTAMPTZ', nullable: true, hasDefault: true },
        { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: true, hasDefault: true },
      ],
      indexes: ['idx_brokers_name (name)', 'idx_brokers_province (province)'],
      rlsPolicies: [
        { name: 'brokers_select_own', action: 'SELECT', description: 'Courtier voit son profil' },
        { name: 'brokers_admin_all', action: 'ALL', description: 'Admin a acces total' },
      ],
      triggers: ['update_updated_at_column BEFORE UPDATE'],
      recentEntries: [], growth: [0, 1, 0, 1, 1, 0, 2, 0, 1, 1, 0, 1],
    },
    {
      name: 'trucks', displayName: 'Camions', icon: Truck, iconColor: 'bg-emerald-100 text-emerald-600',
      count: dbStats.trucks,
      columns: [
        { name: 'id', type: 'UUID', nullable: false, isPrimary: true, hasDefault: true },
        { name: 'company_id', type: 'UUID', nullable: false, isForeign: true, refTable: 'companies' },
        { name: 'type', type: 'TEXT', nullable: false },
        { name: 'capacity', type: 'DECIMAL(10,2)', nullable: false },
        { name: 'current_location', type: 'JSONB', nullable: false, hasDefault: true },
        { name: 'available_date', type: 'TIMESTAMPTZ', nullable: false, hasDefault: true },
        { name: 'destination', type: 'JSONB', nullable: true },
        { name: 'price', type: 'DECIMAL(10,2)', nullable: false, hasDefault: true },
        { name: 'price_per_km', type: 'DECIMAL(10,2)', nullable: false, hasDefault: true },
        { name: 'status', type: 'TEXT', nullable: true, hasDefault: true },
        { name: 'features', type: 'TEXT[]', nullable: true, hasDefault: true },
        { name: 'created_at', type: 'TIMESTAMPTZ', nullable: true, hasDefault: true },
        { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: true, hasDefault: true },
      ],
      indexes: ['idx_trucks_company (company_id)', 'idx_trucks_status (status)', 'idx_trucks_type (type)'],
      rlsPolicies: [
        { name: 'trucks_select_auth', action: 'SELECT', description: 'Utilisateurs authentifies' },
        { name: 'trucks_insert_company', action: 'INSERT', description: 'Entreprise ajoute ses camions' },
        { name: 'trucks_update_company', action: 'UPDATE', description: 'Entreprise modifie ses camions' },
        { name: 'trucks_admin_all', action: 'ALL', description: 'Admin a acces total' },
      ],
      triggers: ['update_updated_at_column BEFORE UPDATE'],
      recentEntries: [], growth: [3, 2, 4, 1, 5, 3, 2, 6, 4, 3, 5, 4],
    },
    {
      name: 'loads', displayName: 'Chargements', icon: Package, iconColor: 'bg-orange-100 text-orange-600',
      count: dbStats.loads,
      columns: [
        { name: 'id', type: 'UUID', nullable: false, isPrimary: true, hasDefault: true },
        { name: 'broker_id', type: 'UUID', nullable: false, isForeign: true, refTable: 'brokers' },
        { name: 'origin', type: 'JSONB', nullable: false, hasDefault: true },
        { name: 'destination', type: 'JSONB', nullable: false, hasDefault: true },
        { name: 'distance', type: 'DECIMAL(10,2)', nullable: false },
        { name: 'duration', type: 'TEXT', nullable: false },
        { name: 'trailer_type', type: 'TEXT', nullable: false, hasDefault: true },
        { name: 'weight', type: 'DECIMAL(10,2)', nullable: false },
        { name: 'price', type: 'DECIMAL(10,2)', nullable: false },
        { name: 'price_per_km', type: 'DECIMAL(10,2)', nullable: false },
        { name: 'pickup_date', type: 'TIMESTAMPTZ', nullable: false, hasDefault: true },
        { name: 'delivery_date', type: 'TIMESTAMPTZ', nullable: false, hasDefault: true },
        { name: 'cargo_type', type: 'TEXT', nullable: true },
        { name: 'status', type: 'TEXT', nullable: true, hasDefault: true },
        { name: 'created_at', type: 'TIMESTAMPTZ', nullable: true, hasDefault: true },
        { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: true, hasDefault: true },
      ],
      indexes: ['idx_loads_broker (broker_id)', 'idx_loads_status (status)', 'idx_loads_pickup (pickup_date)', 'idx_loads_trailer (trailer_type)'],
      rlsPolicies: [
        { name: 'loads_select_auth', action: 'SELECT', description: 'Utilisateurs authentifies' },
        { name: 'loads_insert_broker', action: 'INSERT', description: 'Courtier poste ses chargements' },
        { name: 'loads_update_broker', action: 'UPDATE', description: 'Courtier modifie ses chargements' },
        { name: 'loads_admin_all', action: 'ALL', description: 'Admin a acces total' },
      ],
      triggers: ['update_updated_at_column BEFORE UPDATE'],
      recentEntries: [], growth: [5, 4, 6, 3, 8, 5, 7, 4, 9, 6, 5, 8],
    },
    {
      name: 'bols', displayName: 'Bordereaux (BOL)', icon: FileText, iconColor: 'bg-amber-100 text-amber-600',
      count: dbStats.bols,
      columns: [
        { name: 'id', type: 'UUID', nullable: false, isPrimary: true, hasDefault: true },
        { name: 'bol_number', type: 'TEXT', nullable: true },
        { name: 'load_id', type: 'UUID', nullable: false, isForeign: true, refTable: 'loads' },
        { name: 'truck_id', type: 'UUID', nullable: false, isForeign: true, refTable: 'trucks' },
        { name: 'shipper', type: 'JSONB', nullable: false, hasDefault: true },
        { name: 'carrier', type: 'JSONB', nullable: false, hasDefault: true },
        { name: 'consignee', type: 'JSONB', nullable: true, hasDefault: true },
        { name: 'origin', type: 'JSONB', nullable: false, hasDefault: true },
        { name: 'destination', type: 'JSONB', nullable: false, hasDefault: true },
        { name: 'items', type: 'JSONB', nullable: false, hasDefault: true },
        { name: 'total_weight', type: 'DECIMAL(10,2)', nullable: false, hasDefault: true },
        { name: 'total_value', type: 'DECIMAL(10,2)', nullable: false, hasDefault: true },
        { name: 'pickup_date', type: 'TIMESTAMPTZ', nullable: false, hasDefault: true },
        { name: 'delivery_date', type: 'TIMESTAMPTZ', nullable: false, hasDefault: true },
        { name: 'special_instructions', type: 'TEXT', nullable: true },
        { name: 'signature', type: 'TEXT', nullable: true },
        { name: 'status', type: 'TEXT', nullable: true, hasDefault: true },
        { name: 'created_at', type: 'TIMESTAMPTZ', nullable: true, hasDefault: true },
        { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: true, hasDefault: true },
      ],
      indexes: ['UNIQUE (bol_number)', 'idx_bols_load (load_id)', 'idx_bols_status (status)'],
      rlsPolicies: [
        { name: 'bols_select_auth', action: 'SELECT', description: 'Utilisateurs authentifies' },
        { name: 'bols_insert_auth', action: 'INSERT', description: 'Utilisateurs authentifies' },
        { name: 'bols_update_auth', action: 'UPDATE', description: 'Utilisateurs authentifies' },
        { name: 'bols_admin_all', action: 'ALL', description: 'Admin a acces total' },
      ],
      triggers: ['update_updated_at_column BEFORE UPDATE'],
      recentEntries: [], growth: [0, 1, 0, 2, 1, 0, 1, 2, 1, 3, 1, 2],
    },
    {
      name: 'subscriptions', displayName: 'Abonnements', icon: CreditCard, iconColor: 'bg-pink-100 text-pink-600',
      count: 0,
      columns: [
        { name: 'id', type: 'UUID', nullable: false, isPrimary: true, hasDefault: true },
        { name: 'user_id', type: 'UUID', nullable: false, isForeign: true, refTable: 'users' },
        { name: 'plan', type: 'TEXT', nullable: false },
        { name: 'status', type: 'TEXT', nullable: true, hasDefault: true },
        { name: 'start_date', type: 'TIMESTAMPTZ', nullable: false, hasDefault: true },
        { name: 'end_date', type: 'TIMESTAMPTZ', nullable: false, hasDefault: true },
        { name: 'created_at', type: 'TIMESTAMPTZ', nullable: true, hasDefault: true },
        { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: true, hasDefault: true },
      ],
      indexes: ['idx_subscriptions_user (user_id)', 'idx_subscriptions_status (status)'],
      rlsPolicies: [
        { name: 'subscriptions_select_own', action: 'SELECT', description: 'Utilisateur voit son abonnement' },
        { name: 'subscriptions_admin_all', action: 'ALL', description: 'Admin a acces total' },
      ],
      triggers: ['update_updated_at_column BEFORE UPDATE'],
      recentEntries: [], growth: [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0],
    },
    {
      name: 'payments', displayName: 'Paiements', icon: DollarSign, iconColor: 'bg-green-100 text-green-600',
      count: dbStats.payments,
      columns: [
        { name: 'id', type: 'UUID', nullable: false, isPrimary: true, hasDefault: true },
        { name: 'user_id', type: 'UUID', nullable: false, isForeign: true, refTable: 'users' },
        { name: 'subscription_id', type: 'UUID', nullable: false, isForeign: true, refTable: 'subscriptions' },
        { name: 'amount', type: 'DECIMAL(10,2)', nullable: false },
        { name: 'currency', type: 'TEXT', nullable: true, hasDefault: true },
        { name: 'method', type: 'TEXT', nullable: true },
        { name: 'provider', type: 'TEXT', nullable: true },
        { name: 'status', type: 'TEXT', nullable: true, hasDefault: true },
        { name: 'created_at', type: 'TIMESTAMPTZ', nullable: true, hasDefault: true },
        { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: true, hasDefault: true },
      ],
      indexes: ['idx_payments_user (user_id)', 'idx_payments_status (status)', 'idx_payments_subscription (subscription_id)'],
      rlsPolicies: [
        { name: 'payments_select_own', action: 'SELECT', description: 'Utilisateur voit ses paiements' },
        { name: 'payments_admin_all', action: 'ALL', description: 'Admin a acces total' },
      ],
      triggers: ['update_updated_at_column BEFORE UPDATE'],
      recentEntries: [], growth: [1, 0, 2, 1, 0, 1, 2, 0, 1, 3, 1, 2],
    },
  ];

  const totalColumns = tables.reduce((s, t) => s + t.columns.length, 0);
  const totalIndexes = tables.reduce((s, t) => s + t.indexes.length, 0);
  const totalPolicies = tables.reduce((s, t) => s + t.rlsPolicies.length, 0);
  const totalForeignKeys = tables.reduce((s, t) => s + t.columns.filter(c => c.isForeign).length, 0);

  const loadRecentEntries = async (tableName: string) => {
    if (recentData[tableName]) return;
    setLoadingRecent(tableName);
    try {
      const { data } = await supabase.from(tableName).select('*').order('created_at', { ascending: false }).limit(5);
      setRecentData(prev => ({ ...prev, [tableName]: data || [] }));
    } catch { /* ignore */ }
    setLoadingRecent(null);
  };

  const getTypeColor = (type: string) => {
    if (type.includes('UUID')) return 'text-purple-600 bg-purple-50';
    if (type.includes('TEXT')) return 'text-blue-600 bg-blue-50';
    if (type.includes('DECIMAL') || type.includes('INT')) return 'text-green-600 bg-green-50';
    if (type.includes('JSONB')) return 'text-orange-600 bg-orange-50';
    if (type.includes('TIMESTAMP')) return 'text-amber-600 bg-amber-50';
    if (type.includes('BOOLEAN')) return 'text-pink-600 bg-pink-50';
    if (type.includes('TEXT[]')) return 'text-cyan-600 bg-cyan-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getActionColor = (action: string) => {
    if (action === 'ALL') return 'bg-red-100 text-red-700';
    if (action === 'SELECT') return 'bg-blue-100 text-blue-700';
    if (action === 'INSERT') return 'bg-emerald-100 text-emerald-700';
    if (action === 'UPDATE') return 'bg-amber-100 text-amber-700';
    if (action === 'DELETE') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4">
      {/* ── Health Overview ── */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Etat de la base de donnees</h2>
              <p className="text-xs text-gray-400">PostgreSQL via Supabase</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 rounded-full text-xs font-medium text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              En ligne
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Tables', value: tables.length, icon: Table2, color: 'text-blue-300' },
            { label: 'Enregistrements', value: totalRecords.toLocaleString(), icon: Layers, color: 'text-emerald-300' },
            { label: 'Colonnes', value: totalColumns, icon: Hash, color: 'text-purple-300' },
            { label: 'Index', value: totalIndexes, icon: Zap, color: 'text-amber-300' },
            { label: 'Policies RLS', value: totalPolicies, icon: Shield, color: 'text-red-300' },
            { label: 'Foreign Keys', value: totalForeignKeys, icon: Link2, color: 'text-cyan-300' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">{stat.label}</span>
                </div>
                <span className="text-lg font-bold">{stat.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Record distribution bar ── */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Repartition des enregistrements</h3>
          <span className="text-xs text-gray-400">{totalRecords} total</span>
        </div>
        <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
          {tables.filter(t => t.count > 0).map((table) => {
            const pct = totalRecords > 0 ? (table.count / totalRecords) * 100 : 0;
            const colors: Record<string, string> = {
              users: '#3b82f6', companies: '#8b5cf6', brokers: '#6366f1', trucks: '#10b981',
              loads: '#f97316', bols: '#f59e0b', subscriptions: '#ec4899', payments: '#059669',
            };
            return (
              <div
                key={table.name}
                className="h-full transition-all duration-500 hover:opacity-80 relative group"
                style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: colors[table.name] || '#9ca3af' }}
                title={`${table.displayName}: ${table.count} (${pct.toFixed(1)}%)`}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                    {table.displayName}: {table.count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          {tables.filter(t => t.count > 0).map((table) => {
            const Icon = table.icon;
            const colors: Record<string, string> = {
              users: '#3b82f6', companies: '#8b5cf6', brokers: '#6366f1', trucks: '#10b981',
              loads: '#f97316', bols: '#f59e0b', subscriptions: '#ec4899', payments: '#059669',
            };
            return (
              <div key={table.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors[table.name] }} />
                {table.displayName} <span className="font-semibold">{table.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tables detail ── */}
      <div className="space-y-3">
        {tables.map((table) => {
          const Icon = table.icon;
          const isExpanded = expandedTable === table.name;
          const foreignKeys = table.columns.filter(c => c.isForeign);
          const recent = recentData[table.name] || [];

          return (
            <div key={table.name} className="bg-white rounded-xl border overflow-hidden transition-shadow hover:shadow-md">
              {/* Table header */}
              <button
                onClick={() => {
                  setExpandedTable(isExpanded ? null : table.name);
                  if (!isExpanded) loadRecentEntries(table.name);
                }}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${table.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{table.displayName}</span>
                      <code className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">public.{table.name}</code>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-500">
                      <span>{table.columns.length} colonnes</span>
                      <span>{table.indexes.length} index</span>
                      <span>{table.rlsPolicies.length} policies</span>
                      <span>{foreignKeys.length} FK</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Mini growth sparkline */}
                  <div className="hidden sm:flex items-end gap-px h-5">
                    {table.growth.map((v, i) => (
                      <div key={i} className="w-1.5 bg-primary-400 rounded-t transition-all" style={{ height: `${Math.max((v / Math.max(...table.growth, 1)) * 100, 5)}%`, opacity: 0.3 + (i / 12) * 0.7 }} />
                    ))}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-800">{table.count.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 ml-1">lignes</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t bg-gray-50/50">
                  {/* Columns */}
                  <div className="px-5 py-3">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Hash className="w-3 h-3" /> Schema des colonnes
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="px-3 py-1.5 text-left font-semibold text-gray-500">Colonne</th>
                            <th className="px-3 py-1.5 text-left font-semibold text-gray-500">Type</th>
                            <th className="px-3 py-1.5 text-center font-semibold text-gray-500">PK</th>
                            <th className="px-3 py-1.5 text-center font-semibold text-gray-500">FK</th>
                            <th className="px-3 py-1.5 text-center font-semibold text-gray-500">NULL</th>
                            <th className="px-3 py-1.5 text-center font-semibold text-gray-500">Default</th>
                            <th className="px-3 py-1.5 text-left font-semibold text-gray-500">Reference</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {table.columns.map((col) => (
                            <tr key={col.name} className="hover:bg-white">
                              <td className="px-3 py-1.5 font-mono font-semibold text-gray-800 flex items-center gap-1.5">
                                {col.isPrimary && <Key className="w-3 h-3 text-amber-500" />}
                                {col.isForeign && !col.isPrimary && <Link2 className="w-3 h-3 text-blue-500" />}
                                {col.name}
                              </td>
                              <td className="px-3 py-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${getTypeColor(col.type)}`}>
                                  {col.type}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 text-center">
                                {col.isPrimary ? <Key className="w-3 h-3 text-amber-500 mx-auto" /> : <span className="text-gray-300">-</span>}
                              </td>
                              <td className="px-3 py-1.5 text-center">
                                {col.isForeign ? <Link2 className="w-3 h-3 text-blue-500 mx-auto" /> : <span className="text-gray-300">-</span>}
                              </td>
                              <td className="px-3 py-1.5 text-center">
                                {col.nullable ? <span className="text-amber-500 font-medium">YES</span> : <span className="text-gray-400">NO</span>}
                              </td>
                              <td className="px-3 py-1.5 text-center">
                                {col.hasDefault ? <CheckCircle2 className="w-3 h-3 text-emerald-500 mx-auto" /> : <span className="text-gray-300">-</span>}
                              </td>
                              <td className="px-3 py-1.5 font-mono text-[10px] text-blue-600">
                                {col.refTable ? `→ ${col.refTable}` : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Indexes + RLS side by side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                    {/* Indexes */}
                    <div className="px-5 py-3">
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Zap className="w-3 h-3" /> Index ({table.indexes.length})
                      </h4>
                      <div className="space-y-1">
                        {table.indexes.map((idx, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <code className="font-mono text-gray-700">{idx}</code>
                          </div>
                        ))}
                      </div>
                      {table.triggers.length > 0 && (
                        <>
                          <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-3 mb-2 flex items-center gap-1.5">
                            <GitBranch className="w-3 h-3" /> Triggers ({table.triggers.length})
                          </h4>
                          {table.triggers.map((trigger, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <GitBranch className="w-3 h-3 text-purple-400 flex-shrink-0" />
                              <code className="font-mono text-gray-700">{trigger}</code>
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    {/* RLS Policies */}
                    <div className="px-5 py-3">
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Shield className="w-3 h-3" /> Policies RLS ({table.rlsPolicies.length})
                      </h4>
                      <div className="space-y-1.5">
                        {table.rlsPolicies.map((policy, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getActionColor(policy.action)}`}>
                              {policy.action}
                            </span>
                            <span className="font-mono text-gray-600">{policy.name}</span>
                            <span className="text-gray-400 text-[10px]">- {policy.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent entries */}
                  <div className="px-5 py-3 border-t">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Activity className="w-3 h-3" /> 5 derniers enregistrements
                    </h4>
                    {loadingRecent === table.name ? (
                      <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Chargement...
                      </div>
                    ) : recent.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">Aucun enregistrement</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-[10px]">
                          <thead>
                            <tr className="border-b">
                              {Object.keys(recent[0]).slice(0, 6).map((key) => (
                                <th key={key} className="px-2 py-1 text-left font-semibold text-gray-500 whitespace-nowrap">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {recent.map((row: any, i: number) => (
                              <tr key={i} className="hover:bg-white">
                                {Object.entries(row).slice(0, 6).map(([key, val], j) => (
                                  <td key={j} className="px-2 py-1 font-mono text-gray-600 max-w-[150px] truncate whitespace-nowrap">
                                    {val === null ? <span className="text-gray-300 italic">null</span> :
                                     typeof val === 'object' ? <span className="text-orange-500">{'{...}'}</span> :
                                     String(val).substring(0, 40)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Relations diagram (text) ── */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary-500" /> Relations entre tables
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { from: 'users', to: 'companies', via: 'company_id', type: 'N:1' },
            { from: 'users', to: 'brokers', via: 'broker_id', type: 'N:1' },
            { from: 'trucks', to: 'companies', via: 'company_id', type: 'N:1' },
            { from: 'loads', to: 'brokers', via: 'broker_id', type: 'N:1' },
            { from: 'bols', to: 'loads', via: 'load_id', type: 'N:1' },
            { from: 'bols', to: 'trucks', via: 'truck_id', type: 'N:1' },
            { from: 'subscriptions', to: 'users', via: 'user_id', type: 'N:1' },
            { from: 'payments', to: 'users', via: 'user_id', type: 'N:1' },
            { from: 'payments', to: 'subscriptions', via: 'subscription_id', type: 'N:1' },
          ].map((rel, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-xs">
              <code className="font-mono font-semibold text-blue-600">{rel.from}</code>
              <div className="flex items-center gap-1 text-gray-400">
                <span className="text-[9px] font-bold">{rel.type}</span>
                <ChevronRight className="w-3 h-3" />
              </div>
              <code className="font-mono font-semibold text-emerald-600">{rel.to}</code>
              <span className="text-[9px] text-gray-400 ml-auto font-mono">via {rel.via}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer info ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs text-amber-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Pour modifier la structure de la base de donnees, utilisez le <strong>SQL Editor de Supabase</strong> ou executez le fichier
            <code className="bg-amber-100 px-1.5 py-0.5 rounded mx-1 font-mono">supabase/full_setup.sql</code>.
            Toutes les tables ont <strong>RLS active</strong> avec la fonction <code className="bg-amber-100 px-1 rounded font-mono">is_admin()</code> pour l&apos;acces administrateur.
          </span>
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════
export default function AdminSettingsPage() {
  const { isLoading: authLoading, isAuthorized } = useRequireRole(['admin']);

  // ── States ── (all hooks called before any conditional return)
  const [activeTab, setActiveTab] = useState('general');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showApiKey, setShowApiKey] = useState(false);
  const [dbStats, setDbStats] = useState({ users: 0, companies: 0, brokers: 0, trucks: 0, loads: 0, bols: 0, payments: 0 });

  // General
  const [general, setGeneral] = useState({
    platformName: 'Nzela',
    companyName: 'Maintenance de Matériel au Congo (M M C SARL)',
    description: 'Plateforme de transport et logistique pour la RDC',
    supportEmail: 'support@nzela.cd',
    supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+243 990 243 584',
    website: 'https://nzela.cd',
    address: '04, Avenue Monga, Quartier Craa, Lubumbashi, RDC — RCCM LSHI 17-B-6981',
  });

  // Localisation
  const [locale, setLocale] = useState({
    defaultLanguage: 'fr',
    defaultCurrency: 'CDF',
    secondaryCurrency: 'USD',
    timezone: 'Africa/Lubumbashi',
    dateFormat: 'DD/MM/YYYY',
    weightUnit: 'kg',
    distanceUnit: 'km',
  });

  // Security
  const [security, setSecurity] = useState({
    requireEmailVerification: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    passwordRequireSpecialChar: true,
    blockAfterMaxAttempts: true,
    autoLogoutInactive: true,
    ipWhitelist: false,
  });

  // Notifications
  const [notifications, setNotifications] = useState({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    newUserNotification: true,
    newLoadNotification: true,
    newTruckNotification: false,
    paymentNotification: true,
    matchingNotification: true,
    weeklyReport: true,
    monthlyReport: true,
  });

  // API
  const [api, setApi] = useState({
    rateLimiting: true,
    rateLimitPerMinute: 60,
    apiVersioning: true,
    currentVersion: 'v1.0.0',
    corsEnabled: true,
    webhooksEnabled: false,
    debugMode: false,
    maintenanceMode: false,
  });

  // Business
  const [business, setBusiness] = useState({
    defaultCommission: 5,
    matchingRadius: 100,
    maxMatchingResults: 50,
    autoMatchEnabled: true,
    bolAutoNumbering: true,
    bolPrefix: 'BOL',
    requireBOLForDelivery: true,
    allowGuestAccess: false,
    trialDays: 14,
    maxFreeLoads: 5,
    maxFreeTrucks: 3,
  });

  // Monétisation : exiger abonnement après période gratuite (stocké en base, pas dans le formulaire General)
  const [subscriptionGateEnabled, setSubscriptionGateEnabled] = useState(false);
  const [subscriptionGateLoading, setSubscriptionGateLoading] = useState(false);
  const [subscriptionGateSaving, setSubscriptionGateSaving] = useState(false);

  // Provinces/régions actives (RDC + Zambie)
  const [activeProvinces, setActiveProvinces] = useState<string[]>([...ALL_REGION_IDS]);

  const allProvinces = [...ALL_REGION_IDS];
  const provinceNames = ALL_REGION_NAMES;

  const supabase = createClient();

  // Load DB stats
  useEffect(() => {
    const loadStats = async () => {
      const [u, c, b, t, l, bo, p] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('brokers').select('id', { count: 'exact', head: true }),
        supabase.from('trucks').select('id', { count: 'exact', head: true }),
        supabase.from('loads').select('id', { count: 'exact', head: true }),
        supabase.from('bols').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('id', { count: 'exact', head: true }),
      ]);
      setDbStats({
        users: u.count || 0, companies: c.count || 0, brokers: b.count || 0,
        trucks: t.count || 0, loads: l.count || 0, bols: bo.count || 0, payments: p.count || 0,
      });
    };
    if (isAuthorized) loadStats();
  }, [isAuthorized, supabase]);

  // Charger le flag « exiger abonnement » (Admin > Métier)
  useEffect(() => {
    if (!isAuthorized) return;
    setSubscriptionGateLoading(true);
    fetch('/api/admin/settings/subscription-gate')
      .then((r) => r.ok ? r.json() : { enabled: false })
      .then((data) => setSubscriptionGateEnabled(!!data?.enabled))
      .catch(() => setSubscriptionGateEnabled(false))
      .finally(() => setSubscriptionGateLoading(false));
  }, [isAuthorized]);

  const handleSubscriptionGateToggle = useCallback(async (enabled: boolean) => {
    setSubscriptionGateSaving(true);
    try {
      const res = await fetch('/api/admin/settings/subscription-gate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const data = res.ok ? await res.json() : null;
      if (data && typeof data.enabled === 'boolean') setSubscriptionGateEnabled(data.enabled);
    } finally {
      setSubscriptionGateSaving(false);
    }
  }, []);

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    // Simulate save (in production, this would persist to DB or an API)
    await new Promise(resolve => setTimeout(resolve, 800));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2500);
  }, []);

  const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleProvince = (province: string) => {
    setActiveProvinces(prev =>
      prev.includes(province) ? prev.filter(p => p !== province) : [...prev, province]
    );
  };

  // Conditional return AFTER all hooks
  if (authLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'locale', label: 'Localisation', icon: Globe },
    { id: 'security', label: 'Securite', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'business', label: 'Metier', icon: Package },
    { id: 'provinces', label: 'Provinces', icon: MapPin },
    { id: 'api', label: 'API & Technique', icon: Code },
    { id: 'database', label: 'Base de donnees', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-7 h-7 text-primary-600" />
            Parametres de la plateforme
          </h1>
          <p className="text-gray-500 mt-0.5">Configuration generale de Nzela</p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium animate-pulse">
              <CheckCircle2 className="w-4 h-4" /> Enregistre
            </span>
          )}
          <Button onClick={handleSave} disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex overflow-x-auto border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-700 bg-primary-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* TAB: GENERAL */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section icon={Settings} title="Informations de la plateforme" subtitle="Identite et coordonnees">
            <SettingRow icon={Zap} iconColor="bg-primary-100 text-primary-600" label="Nom de la plateforme" description="Nom affiche partout">
              <input className="text-sm border rounded-lg px-3 py-1.5 w-48 focus:ring-2 focus:ring-primary-500 outline-none" value={general.platformName} onChange={e => setGeneral({ ...general, platformName: e.target.value })} />
            </SettingRow>
            <SettingRow icon={Users} iconColor="bg-blue-100 text-blue-600" label="Societe" description="Nom de la societe proprietaire">
              <input className="text-sm border rounded-lg px-3 py-1.5 w-48 focus:ring-2 focus:ring-primary-500 outline-none" value={general.companyName} onChange={e => setGeneral({ ...general, companyName: e.target.value })} />
            </SettingRow>
            <SettingRow icon={Mail} iconColor="bg-amber-100 text-amber-600" label="Email support" description="Contact principal">
              <input className="text-sm border rounded-lg px-3 py-1.5 w-48 focus:ring-2 focus:ring-primary-500 outline-none" value={general.supportEmail} onChange={e => setGeneral({ ...general, supportEmail: e.target.value })} />
            </SettingRow>
            <SettingRow icon={Smartphone} iconColor="bg-green-100 text-green-600" label="Telephone" description="Numero d'assistance">
              <input className="text-sm border rounded-lg px-3 py-1.5 w-48 focus:ring-2 focus:ring-primary-500 outline-none" value={general.supportPhone} onChange={e => setGeneral({ ...general, supportPhone: e.target.value })} />
            </SettingRow>
            <SettingRow icon={MapPin} iconColor="bg-red-100 text-red-600" label="Adresse" description="Siege social">
              <input className="text-sm border rounded-lg px-3 py-1.5 w-48 focus:ring-2 focus:ring-primary-500 outline-none" value={general.address} onChange={e => setGeneral({ ...general, address: e.target.value })} />
            </SettingRow>
          </Section>

          <Section icon={Info} title="Description" subtitle="Presentation de la plateforme">
            <div className="py-3">
              <textarea
                className="w-full text-sm border rounded-lg px-3 py-2 h-24 resize-none focus:ring-2 focus:ring-primary-500 outline-none"
                value={general.description}
                onChange={e => setGeneral({ ...general, description: e.target.value })}
              />
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700 flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Cette description est utilisee dans les meta-tags SEO et les emails automatiques.
                </p>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* TAB: LOCALISATION */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === 'locale' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section icon={Languages} title="Langue et region" subtitle="Parametres de localisation">
            <SettingRow icon={Languages} iconColor="bg-blue-100 text-blue-600" label="Langue par defaut" description="Langue principale de l'interface">
              <select className="text-sm border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 outline-none bg-white" value={locale.defaultLanguage} onChange={e => setLocale({ ...locale, defaultLanguage: e.target.value })}>
                <option value="fr">Francais</option>
                <option value="en">English</option>
                <option value="sw">Swahili</option>
                <option value="ln">Lingala</option>
              </select>
            </SettingRow>
            <SettingRow icon={Clock} iconColor="bg-amber-100 text-amber-600" label="Fuseau horaire" description="Zone horaire de reference">
              <select className="text-sm border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 outline-none bg-white" value={locale.timezone} onChange={e => setLocale({ ...locale, timezone: e.target.value })}>
                <option value="Africa/Lubumbashi">Africa/Lubumbashi (UTC+2)</option>
                <option value="Africa/Kinshasa">Africa/Kinshasa (UTC+1)</option>
              </select>
            </SettingRow>
            <SettingRow icon={Clock} iconColor="bg-gray-100 text-gray-600" label="Format de date" description="Affichage des dates">
              <select className="text-sm border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 outline-none bg-white" value={locale.dateFormat} onChange={e => setLocale({ ...locale, dateFormat: e.target.value })}>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </SettingRow>
          </Section>

          <Section icon={DollarSign} title="Devises et unites" subtitle="Monnaie et mesures">
            <SettingRow icon={DollarSign} iconColor="bg-green-100 text-green-600" label="Devise principale" description="Monnaie par defaut">
              <select className="text-sm border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 outline-none bg-white" value={locale.defaultCurrency} onChange={e => setLocale({ ...locale, defaultCurrency: e.target.value })}>
                <option value="CDF">CDF - Franc Congolais</option>
                <option value="USD">USD - Dollar US</option>
              </select>
            </SettingRow>
            <SettingRow icon={DollarSign} iconColor="bg-emerald-100 text-emerald-600" label="Devise secondaire" description="Conversion affichee">
              <select className="text-sm border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 outline-none bg-white" value={locale.secondaryCurrency} onChange={e => setLocale({ ...locale, secondaryCurrency: e.target.value })}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="CDF">CDF</option>
              </select>
            </SettingRow>
            <SettingRow icon={Scale} iconColor="bg-purple-100 text-purple-600" label="Unite de poids" description="Pour les chargements">
              <select className="text-sm border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 outline-none bg-white" value={locale.weightUnit} onChange={e => setLocale({ ...locale, weightUnit: e.target.value })}>
                <option value="kg">Kilogrammes (kg)</option>
                <option value="t">Tonnes (t)</option>
              </select>
            </SettingRow>
            <SettingRow icon={MapPin} iconColor="bg-orange-100 text-orange-600" label="Unite de distance" description="Pour les trajets">
              <select className="text-sm border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 outline-none bg-white" value={locale.distanceUnit} onChange={e => setLocale({ ...locale, distanceUnit: e.target.value })}>
                <option value="km">Kilometres (km)</option>
                <option value="mi">Miles (mi)</option>
              </select>
            </SettingRow>
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* TAB: SECURITE */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section icon={Shield} title="Authentification" subtitle="Controle d'acces des utilisateurs" badge="Critique">
            <SettingRow icon={Mail} iconColor="bg-blue-100 text-blue-600" label="Verification email obligatoire" description="Les utilisateurs doivent confirmer leur email">
              <Toggle enabled={security.requireEmailVerification} onChange={v => setSecurity({ ...security, requireEmailVerification: v })} />
            </SettingRow>
            <SettingRow icon={Smartphone} iconColor="bg-purple-100 text-purple-600" label="Authentification 2 facteurs" description="Code SMS ou app d'authentification">
              <Toggle enabled={security.twoFactorAuth} onChange={v => setSecurity({ ...security, twoFactorAuth: v })} />
            </SettingRow>
            <SettingRow icon={Clock} iconColor="bg-amber-100 text-amber-600" label="Timeout de session (min)" description="Duree avant deconnexion automatique">
              <input type="number" className="text-sm border rounded-lg px-3 py-1.5 w-20 text-center focus:ring-2 focus:ring-primary-500 outline-none" value={security.sessionTimeout} onChange={e => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) || 0 })} />
            </SettingRow>
            <SettingRow icon={Lock} iconColor="bg-red-100 text-red-600" label="Deconnexion auto si inactif" description="Deconnecte apres le timeout">
              <Toggle enabled={security.autoLogoutInactive} onChange={v => setSecurity({ ...security, autoLogoutInactive: v })} />
            </SettingRow>
          </Section>

          <Section icon={Lock} title="Politique de mot de passe" subtitle="Regles de securite des mots de passe">
            <SettingRow icon={Lock} iconColor="bg-red-100 text-red-600" label="Longueur minimale" description="Nombre minimum de caracteres">
              <input type="number" className="text-sm border rounded-lg px-3 py-1.5 w-20 text-center focus:ring-2 focus:ring-primary-500 outline-none" value={security.passwordMinLength} onChange={e => setSecurity({ ...security, passwordMinLength: parseInt(e.target.value) || 8 })} />
            </SettingRow>
            <SettingRow icon={Shield} iconColor="bg-orange-100 text-orange-600" label="Caractere special obligatoire" description="Au moins un caractere special (@, #, $...)">
              <Toggle enabled={security.passwordRequireSpecialChar} onChange={v => setSecurity({ ...security, passwordRequireSpecialChar: v })} />
            </SettingRow>
            <SettingRow icon={AlertTriangle} iconColor="bg-yellow-100 text-yellow-600" label="Tentatives max de connexion" description="Avant blocage du compte">
              <input type="number" className="text-sm border rounded-lg px-3 py-1.5 w-20 text-center focus:ring-2 focus:ring-primary-500 outline-none" value={security.maxLoginAttempts} onChange={e => setSecurity({ ...security, maxLoginAttempts: parseInt(e.target.value) || 5 })} />
            </SettingRow>
            <SettingRow icon={Lock} iconColor="bg-gray-100 text-gray-600" label="Bloquer apres echecs max" description="Bloquer le compte temporairement">
              <Toggle enabled={security.blockAfterMaxAttempts} onChange={v => setSecurity({ ...security, blockAfterMaxAttempts: v })} />
            </SettingRow>
            <SettingRow icon={Wifi} iconColor="bg-indigo-100 text-indigo-600" label="Liste blanche IP" description="Restreindre l'acces admin par IP">
              <Toggle enabled={security.ipWhitelist} onChange={v => setSecurity({ ...security, ipWhitelist: v })} />
            </SettingRow>
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* TAB: NOTIFICATIONS */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section icon={Bell} title="Canaux de notification" subtitle="Methodes d'envoi des notifications">
            <SettingRow icon={Mail} iconColor="bg-blue-100 text-blue-600" label="Notifications par email" description="Envoyer des emails automatiques">
              <Toggle enabled={notifications.emailEnabled} onChange={v => setNotifications({ ...notifications, emailEnabled: v })} />
            </SettingRow>
            <SettingRow icon={Smartphone} iconColor="bg-green-100 text-green-600" label="Notifications SMS" description="Envoyer des SMS (necessite un fournisseur)">
              <Toggle enabled={notifications.smsEnabled} onChange={v => setNotifications({ ...notifications, smsEnabled: v })} />
            </SettingRow>
            <SettingRow icon={MonitorSmartphone} iconColor="bg-purple-100 text-purple-600" label="Notifications push" description="Notifications navigateur / PWA">
              <Toggle enabled={notifications.pushEnabled} onChange={v => setNotifications({ ...notifications, pushEnabled: v })} />
            </SettingRow>
          </Section>

          <Section icon={Bell} title="Evenements a notifier" subtitle="Quelles actions declenchent une notification">
            <SettingRow icon={Users} iconColor="bg-blue-100 text-blue-600" label="Nouvel utilisateur" description="Quand un utilisateur s'inscrit">
              <Toggle enabled={notifications.newUserNotification} onChange={v => setNotifications({ ...notifications, newUserNotification: v })} />
            </SettingRow>
            <SettingRow icon={Package} iconColor="bg-orange-100 text-orange-600" label="Nouveau chargement" description="Quand un chargement est poste">
              <Toggle enabled={notifications.newLoadNotification} onChange={v => setNotifications({ ...notifications, newLoadNotification: v })} />
            </SettingRow>
            <SettingRow icon={Truck} iconColor="bg-emerald-100 text-emerald-600" label="Nouveau camion" description="Quand un camion est poste">
              <Toggle enabled={notifications.newTruckNotification} onChange={v => setNotifications({ ...notifications, newTruckNotification: v })} />
            </SettingRow>
            <SettingRow icon={CreditCard} iconColor="bg-green-100 text-green-600" label="Paiement recu" description="Quand un paiement est effectue">
              <Toggle enabled={notifications.paymentNotification} onChange={v => setNotifications({ ...notifications, paymentNotification: v })} />
            </SettingRow>
            <SettingRow icon={Zap} iconColor="bg-yellow-100 text-yellow-600" label="Nouveau matching" description="Quand un match est trouve">
              <Toggle enabled={notifications.matchingNotification} onChange={v => setNotifications({ ...notifications, matchingNotification: v })} />
            </SettingRow>
          </Section>

          <Section icon={FileText} title="Rapports automatiques" subtitle="Rapports periodiques par email">
            <SettingRow icon={FileText} iconColor="bg-indigo-100 text-indigo-600" label="Rapport hebdomadaire" description="Resume des activites chaque lundi">
              <Toggle enabled={notifications.weeklyReport} onChange={v => setNotifications({ ...notifications, weeklyReport: v })} />
            </SettingRow>
            <SettingRow icon={FileText} iconColor="bg-pink-100 text-pink-600" label="Rapport mensuel" description="Bilan complet chaque 1er du mois">
              <Toggle enabled={notifications.monthlyReport} onChange={v => setNotifications({ ...notifications, monthlyReport: v })} />
            </SettingRow>
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* TAB: BUSINESS */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === 'business' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section icon={Package} title="Logistique & Matching" subtitle="Parametres du coeur de metier">
            <SettingRow icon={DollarSign} iconColor="bg-green-100 text-green-600" label="Commission (%)" description="Pourcentage preleve par la plateforme">
              <input type="number" className="text-sm border rounded-lg px-3 py-1.5 w-20 text-center focus:ring-2 focus:ring-primary-500 outline-none" value={business.defaultCommission} onChange={e => setBusiness({ ...business, defaultCommission: parseInt(e.target.value) || 0 })} />
            </SettingRow>
            <SettingRow icon={MapPin} iconColor="bg-blue-100 text-blue-600" label="Rayon de matching (km)" description="Distance max pour le matching automatique">
              <input type="number" className="text-sm border rounded-lg px-3 py-1.5 w-20 text-center focus:ring-2 focus:ring-primary-500 outline-none" value={business.matchingRadius} onChange={e => setBusiness({ ...business, matchingRadius: parseInt(e.target.value) || 0 })} />
            </SettingRow>
            <SettingRow icon={Zap} iconColor="bg-yellow-100 text-yellow-600" label="Resultats matching max" description="Nombre maximum de resultats">
              <input type="number" className="text-sm border rounded-lg px-3 py-1.5 w-20 text-center focus:ring-2 focus:ring-primary-500 outline-none" value={business.maxMatchingResults} onChange={e => setBusiness({ ...business, maxMatchingResults: parseInt(e.target.value) || 10 })} />
            </SettingRow>
            <SettingRow icon={Zap} iconColor="bg-amber-100 text-amber-600" label="Auto-matching" description="Matching automatique en arriere-plan">
              <Toggle enabled={business.autoMatchEnabled} onChange={v => setBusiness({ ...business, autoMatchEnabled: v })} />
            </SettingRow>
          </Section>

          <Section icon={FileText} title="Bordereaux de Chargement" subtitle="Configuration des BOL">
            <SettingRow icon={FileText} iconColor="bg-orange-100 text-orange-600" label="Numerotation auto" description="Generer les numeros BOL automatiquement">
              <Toggle enabled={business.bolAutoNumbering} onChange={v => setBusiness({ ...business, bolAutoNumbering: v })} />
            </SettingRow>
            <SettingRow icon={FileText} iconColor="bg-gray-100 text-gray-600" label="Prefixe BOL" description="Prefixe des numeros de bordereau">
              <input className="text-sm border rounded-lg px-3 py-1.5 w-24 text-center focus:ring-2 focus:ring-primary-500 outline-none" value={business.bolPrefix} onChange={e => setBusiness({ ...business, bolPrefix: e.target.value })} />
            </SettingRow>
            <SettingRow icon={CheckCircle2} iconColor="bg-emerald-100 text-emerald-600" label="BOL obligatoire pour livraison" description="Exiger un BOL signe avant livraison">
              <Toggle enabled={business.requireBOLForDelivery} onChange={v => setBusiness({ ...business, requireBOLForDelivery: v })} />
            </SettingRow>
          </Section>

          <Section icon={CreditCard} title="Plan gratuit" subtitle="Limites de l'offre gratuite">
            <SettingRow icon={Clock} iconColor="bg-blue-100 text-blue-600" label="Jours d'essai" description="Duree de la periode d'essai">
              <input type="number" className="text-sm border rounded-lg px-3 py-1.5 w-20 text-center focus:ring-2 focus:ring-primary-500 outline-none" value={business.trialDays} onChange={e => setBusiness({ ...business, trialDays: parseInt(e.target.value) || 0 })} />
            </SettingRow>
            <SettingRow icon={Package} iconColor="bg-orange-100 text-orange-600" label="Chargements gratuits max" description="Nombre max de loads en plan gratuit">
              <input type="number" className="text-sm border rounded-lg px-3 py-1.5 w-20 text-center focus:ring-2 focus:ring-primary-500 outline-none" value={business.maxFreeLoads} onChange={e => setBusiness({ ...business, maxFreeLoads: parseInt(e.target.value) || 0 })} />
            </SettingRow>
            <SettingRow icon={Truck} iconColor="bg-emerald-100 text-emerald-600" label="Camions gratuits max" description="Nombre max de trucks en plan gratuit">
              <input type="number" className="text-sm border rounded-lg px-3 py-1.5 w-20 text-center focus:ring-2 focus:ring-primary-500 outline-none" value={business.maxFreeTrucks} onChange={e => setBusiness({ ...business, maxFreeTrucks: parseInt(e.target.value) || 0 })} />
            </SettingRow>
            <SettingRow icon={Users} iconColor="bg-purple-100 text-purple-600" label="Acces invites" description="Permettre la navigation sans inscription">
              <Toggle enabled={business.allowGuestAccess} onChange={v => setBusiness({ ...business, allowGuestAccess: v })} />
            </SettingRow>
          </Section>

          <Section icon={DollarSign} title="Monetisation" subtitle="Exiger un abonnement apres la periode gratuite pour publier" badge={subscriptionGateEnabled ? 'Actif' : 'Suspendu'}>
            <SettingRow icon={Lock} iconColor="bg-rose-100 text-rose-600" label="Exiger un abonnement" description="Apres la periode gratuite, entreprises et courtiers doivent sabonner pour publier trucks/loads">
              {subscriptionGateLoading ? (
                <span className="text-xs text-gray-500">Chargement…</span>
              ) : (
                <Toggle
                  enabled={subscriptionGateEnabled}
                  onChange={(v) => handleSubscriptionGateToggle(v)}
                  disabled={subscriptionGateSaving}
                />
              )}
            </SettingRow>
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* TAB: PROVINCES */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === 'provinces' && (
        <Section icon={MapPin} title="Provinces actives" subtitle={`${activeProvinces.length} provinces sur ${allProvinces.length} activees`}>
          <div className="py-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-500">Selectionnez les provinces ou Nzela est operationnel</p>
              <div className="flex gap-2">
                <button className="text-xs text-primary-600 font-medium hover:underline" onClick={() => setActiveProvinces([...allProvinces])}>
                  Tout activer
                </button>
                <span className="text-gray-300">|</span>
                <button className="text-xs text-gray-500 font-medium hover:underline" onClick={() => setActiveProvinces([])}>
                  Tout desactiver
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {allProvinces.map((prov) => {
                const active = activeProvinces.includes(prov);
                return (
                  <button
                    key={prov}
                    onClick={() => toggleProvince(prov)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                      active
                        ? 'bg-primary-50 border-primary-300 text-primary-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-primary-500' : 'bg-gray-300'}`} />
                    <span className="font-medium text-xs">{provinceNames[prov] || prov}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* TAB: API & TECHNIQUE */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === 'api' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section icon={Code} title="API Configuration" subtitle="Parametres techniques de l'API" badge={api.currentVersion}>
            <SettingRow icon={Shield} iconColor="bg-red-100 text-red-600" label="Rate Limiting" description="Limiter le nombre de requetes par minute">
              <Toggle enabled={api.rateLimiting} onChange={v => setApi({ ...api, rateLimiting: v })} />
            </SettingRow>
            {api.rateLimiting && (
              <SettingRow icon={Clock} iconColor="bg-amber-100 text-amber-600" label="Requetes max / minute" description="Par utilisateur authentifie">
                <input type="number" className="text-sm border rounded-lg px-3 py-1.5 w-20 text-center focus:ring-2 focus:ring-primary-500 outline-none" value={api.rateLimitPerMinute} onChange={e => setApi({ ...api, rateLimitPerMinute: parseInt(e.target.value) || 60 })} />
              </SettingRow>
            )}
            <SettingRow icon={Code} iconColor="bg-blue-100 text-blue-600" label="Versioning API" description="Gerer les versions de l'API">
              <Toggle enabled={api.apiVersioning} onChange={v => setApi({ ...api, apiVersioning: v })} />
            </SettingRow>
            <SettingRow icon={Globe} iconColor="bg-green-100 text-green-600" label="CORS active" description="Cross-Origin Resource Sharing">
              <Toggle enabled={api.corsEnabled} onChange={v => setApi({ ...api, corsEnabled: v })} />
            </SettingRow>
            <SettingRow icon={Zap} iconColor="bg-purple-100 text-purple-600" label="Webhooks" description="Envoyer des evenements a des URLs externes">
              <Toggle enabled={api.webhooksEnabled} onChange={v => setApi({ ...api, webhooksEnabled: v })} />
            </SettingRow>
          </Section>

          <Section icon={Server} title="Environnement" subtitle="Etat du serveur et mode">
            <SettingRow icon={AlertTriangle} iconColor="bg-red-100 text-red-600" label="Mode maintenance" description="Afficher une page de maintenance">
              <Toggle enabled={api.maintenanceMode} onChange={v => setApi({ ...api, maintenanceMode: v })} />
            </SettingRow>
            <SettingRow icon={Code} iconColor="bg-yellow-100 text-yellow-600" label="Mode debug" description="Logs detailles (desactiver en production)">
              <Toggle enabled={api.debugMode} onChange={v => setApi({ ...api, debugMode: v })} />
            </SettingRow>
            <div className="py-3 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">URL Supabase</label>
                <div className="flex">
                  <input readOnly value={apiUrl} className="flex-1 text-xs border rounded-l-lg px-3 py-2 bg-gray-50 text-gray-600 font-mono" />
                  <button onClick={() => copyToClipboard(apiUrl)} className="px-3 py-2 border border-l-0 rounded-r-lg bg-gray-50 hover:bg-gray-100 transition-colors" title="Copier">
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Cle Anon</label>
                <div className="flex">
                  <input readOnly type={showApiKey ? 'text' : 'password'} value={anonKey} className="flex-1 text-xs border rounded-l-lg px-3 py-2 bg-gray-50 text-gray-600 font-mono" />
                  <button onClick={() => setShowApiKey(!showApiKey)} className="px-3 py-2 border border-l-0 bg-gray-50 hover:bg-gray-100 transition-colors">
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5 text-gray-400" /> : <Eye className="w-3.5 h-3.5 text-gray-400" />}
                  </button>
                  <button onClick={() => copyToClipboard(anonKey)} className="px-3 py-2 border border-l-0 rounded-r-lg bg-gray-50 hover:bg-gray-100 transition-colors" title="Copier">
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* TAB: DATABASE */}
      {/* ══════════════════════════════════════════ */}
      {activeTab === 'database' && (
        <DatabaseTab dbStats={dbStats} />
      )}

      {/* ── Footer ── */}
      <div className="flex justify-between items-center pt-2">
        <p className="text-xs text-gray-400">Nzela v1.0.0 | Supabase + Next.js</p>
        <Button onClick={handleSave} disabled={saveStatus === 'saving'}>
          {saveStatus === 'saving' ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}
