'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Building2, Users, Truck, Package, CreditCard, TrendingUp,
  TrendingDown, ArrowUpRight, ArrowDownRight, Activity, BarChart3,
  MapPin, Calendar, RefreshCw, Download, FileText, Zap,
  DollarSign, Clock, CheckCircle2, XCircle, AlertTriangle,
  ChevronRight, Filter,
} from 'lucide-react';

// ── Types ──
interface PeriodFilter {
  label: string;
  days: number;
}

interface KPI {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: any;
  color: string;
  bgColor: string;
}

interface LoadsByStatus {
  available: number;
  booked: number;
  'in-transit': number;
  delivered: number;
  completed: number;
  cancelled: number;
}

interface TrucksByStatus {
  available: number;
  booked: number;
  'in-transit': number;
  maintenance: number;
}

interface RouteData {
  origin: string;
  destination: string;
  count: number;
  totalRevenue: number;
}

interface ProvinceData {
  province: string;
  loads: number;
  trucks: number;
  revenue: number;
}

interface MonthlyData {
  month: string;
  loads: number;
  trucks: number;
  revenue: number;
  bols: number;
}

interface RecentActivity {
  id: string;
  type: 'load' | 'truck' | 'bol' | 'payment' | 'user';
  description: string;
  date: string;
  status?: string;
}

interface FullAnalytics {
  // KPIs
  totalCompanies: number;
  totalBrokers: number;
  totalTrucks: number;
  totalLoads: number;
  totalBOLs: number;
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  avgLoadPrice: number;
  avgTruckPrice: number;
  // Previous period for comparison
  prevCompanies: number;
  prevBrokers: number;
  prevTrucks: number;
  prevLoads: number;
  prevRevenue: number;
  // Breakdowns
  loadsByStatus: LoadsByStatus;
  trucksByStatus: TrucksByStatus;
  // Top routes
  topRoutes: RouteData[];
  // Province data
  provinceData: ProvinceData[];
  // Monthly trends
  monthlyData: MonthlyData[];
  // Recent activity
  recentActivity: RecentActivity[];
  // Conversion
  conversionRate: number;
  bolCompletionRate: number;
  avgDeliveryDays: number;
}

const PERIODS: PeriodFilter[] = [
  { label: '7 jours', days: 7 },
  { label: '30 jours', days: 30 },
  { label: '90 jours', days: 90 },
  { label: '1 an', days: 365 },
  { label: 'Tout', days: 9999 },
];

const PROVINCE_NAMES: Record<string, string> = {
  'haut-katanga': 'Haut-Katanga',
  'lualaba': 'Lualaba',
  'haut-lomami': 'Haut-Lomami',
  'tanganyika': 'Tanganyika',
  'kinshasa': 'Kinshasa',
  'kongo-central': 'Kongo-Central',
  'kasai': 'Kasai',
  'kasai-central': 'Kasai-Central',
  'kasai-oriental': 'Kasai-Oriental',
  'lomami': 'Lomami',
  'sankuru': 'Sankuru',
  'maniema': 'Maniema',
  'sud-kivu': 'Sud-Kivu',
  'nord-kivu': 'Nord-Kivu',
  'ituri': 'Ituri',
  'tshopo': 'Tshopo',
  'bas-uele': 'Bas-Uele',
  'haut-uele': 'Haut-Uele',
  'mongala': 'Mongala',
  'nord-ubangi': 'Nord-Ubangi',
  'sud-ubangi': 'Sud-Ubangi',
  'equateur': 'Equateur',
  'tshuapa': 'Tshuapa',
  'kwango': 'Kwango',
  'kwilu': 'Kwilu',
  'mai-ndombe': 'Mai-Ndombe',
};

const STATUS_COLORS: Record<string, string> = {
  available: '#10b981',
  booked: '#f59e0b',
  'in-transit': '#3b82f6',
  delivered: '#8b5cf6',
  completed: '#059669',
  cancelled: '#ef4444',
  maintenance: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  booked: 'Reserve',
  'in-transit': 'En transit',
  delivered: 'Livre',
  completed: 'Complete',
  cancelled: 'Annule',
  maintenance: 'Maintenance',
};

// ── Helper: percentage change ──
function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ── Helper: format number ──
function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k';
  return n.toLocaleString('fr-FR');
}

// ══════════════════════════════════════════
// MINI BAR CHART (Pure CSS)
// ══════════════════════════════════════════
function MiniBarChart({ data, color, height = 120 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((val, i) => (
        <div
          key={i}
          className="flex-1 rounded-t transition-all duration-500"
          style={{
            height: `${(val / max) * 100}%`,
            backgroundColor: color,
            minHeight: val > 0 ? 4 : 0,
            opacity: i === data.length - 1 ? 1 : 0.6 + (i / data.length) * 0.4,
          }}
          title={`${val}`}
        />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════
// DONUT CHART (SVG)
// ══════════════════════════════════════════
function DonutChart({ segments, size = 140, strokeWidth = 24 }: { segments: { value: number; color: string; label: string }[]; size?: number; strokeWidth?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div className="text-gray-400 text-sm text-center py-4">Aucune donnee</div>;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const segmentsWithOffset = segments
    .filter(s => s.value > 0)
    .reduce<{ seg: typeof segments[0]; dash: number; offset: number }[]>((acc, seg) => {
      const pct = seg.value / total;
      const dash = pct * c;
      const offset = acc.length === 0 ? 0 : acc[acc.length - 1].offset + acc[acc.length - 1].dash;
      acc.push({ seg, dash, offset });
      return acc;
    }, []);
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} className="transform -rotate-90">
        {segmentsWithOffset.map(({ seg, dash, offset }, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              className="transition-all duration-700"
            />
          ))}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-gray-800 font-bold"
          fontSize="20"
          transform={`rotate(90, ${size / 2}, ${size / 2})`}
        >
          {total}
        </text>
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
        {segments.filter(s => s.value > 0).map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-600">{seg.label}</span>
            <span className="font-semibold text-gray-800">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// SPARKLINE (SVG)
// ══════════════════════════════════════════
function Sparkline({ data, color, width = 80, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} className="inline-block">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ══════════════════════════════════════════
// PROGRESS BAR
// ══════════════════════════════════════════
function ProgressBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-800">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<FullAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>(PERIODS[1]); // 30 jours
  const [activeTab, setActiveTab] = useState<'overview' | 'loads' | 'trucks' | 'revenue'>('overview');
  const supabase = createClient();

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const periodStart = new Date(now.getTime() - period.days * 24 * 60 * 60 * 1000);
      const prevPeriodStart = new Date(periodStart.getTime() - period.days * 24 * 60 * 60 * 1000);
      const periodStartISO = periodStart.toISOString();
      const prevPeriodStartISO = prevPeriodStart.toISOString();

      // Parallel queries
      const [
        companiesAll, brokersAll, trucksAll, loadsAll, bolsAll, usersAll,
        subscriptionsActive, paymentsAll,
        companiesPrev, brokersPrev, trucksPrev, loadsPrev, paymentsPrev,
        recentLoads, recentTrucks, recentBOLs, recentPayments,
      ] = await Promise.all([
        // Current period counts
        supabase.from('companies').select('id, created_at', { count: 'exact' }),
        supabase.from('brokers').select('id, created_at', { count: 'exact' }),
        supabase.from('trucks').select('id, status, current_location, price, capacity, created_at', { count: 'exact' }),
        supabase.from('loads').select('id, status, origin, destination, price, weight, pickup_date, delivery_date, created_at', { count: 'exact' }),
        supabase.from('bols').select('id, status, total_weight, total_value, created_at', { count: 'exact' }),
        supabase.from('users').select('id, role, created_at', { count: 'exact' }),
        supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('payments').select('amount, status, created_at', { count: 'exact' }),
        // Previous period for comparisons
        supabase.from('companies').select('id', { count: 'exact' }).lt('created_at', periodStartISO),
        supabase.from('brokers').select('id', { count: 'exact' }).lt('created_at', periodStartISO),
        supabase.from('trucks').select('id', { count: 'exact' }).lt('created_at', periodStartISO),
        supabase.from('loads').select('id', { count: 'exact' }).lt('created_at', periodStartISO),
        supabase.from('payments').select('amount', { count: 'exact' }).lt('created_at', periodStartISO).eq('status', 'completed'),
        // Recent activity
        supabase.from('loads').select('id, status, origin, destination, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('trucks').select('id, type, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('bols').select('id, bol_number, status, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('payments').select('id, amount, status, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const allLoads = loadsAll.data || [];
      const allTrucks = trucksAll.data || [];
      const allPayments = paymentsAll.data || [];
      const allBOLs = bolsAll.data || [];

      // ── Revenue ──
      const completedPayments = allPayments.filter((p: any) => p.status === 'completed');
      const totalRevenue = completedPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const prevRevenue = (paymentsPrev.data || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);

      // ── Loads by status ──
      const loadsByStatus: LoadsByStatus = {
        available: 0, booked: 0, 'in-transit': 0, delivered: 0, completed: 0, cancelled: 0,
      };
      allLoads.forEach((l: any) => {
        if (l.status in loadsByStatus) loadsByStatus[l.status as keyof LoadsByStatus]++;
      });

      // ── Trucks by status ──
      const trucksByStatus: TrucksByStatus = {
        available: 0, booked: 0, 'in-transit': 0, maintenance: 0,
      };
      allTrucks.forEach((t: any) => {
        if (t.status in trucksByStatus) trucksByStatus[t.status as keyof TrucksByStatus]++;
      });

      // ── Top Routes ──
      const routeMap = new Map<string, RouteData>();
      allLoads.forEach((l: any) => {
        try {
          const o = typeof l.origin === 'string' ? JSON.parse(l.origin) : l.origin;
          const d = typeof l.destination === 'string' ? JSON.parse(l.destination) : l.destination;
          const key = `${o?.city || '?'}→${d?.city || '?'}`;
          const existing = routeMap.get(key) || { origin: o?.city || '?', destination: d?.city || '?', count: 0, totalRevenue: 0 };
          existing.count++;
          existing.totalRevenue += l.price || 0;
          routeMap.set(key, existing);
        } catch {}
      });
      const topRoutes = Array.from(routeMap.values()).sort((a, b) => b.count - a.count).slice(0, 8);

      // ── Province data ──
      const provinceMap = new Map<string, ProvinceData>();
      allLoads.forEach((l: any) => {
        try {
          const o = typeof l.origin === 'string' ? JSON.parse(l.origin) : l.origin;
          const prov = o?.province || 'inconnu';
          const existing = provinceMap.get(prov) || { province: prov, loads: 0, trucks: 0, revenue: 0 };
          existing.loads++;
          existing.revenue += l.price || 0;
          provinceMap.set(prov, existing);
        } catch {}
      });
      allTrucks.forEach((t: any) => {
        try {
          const loc = typeof t.current_location === 'string' ? JSON.parse(t.current_location) : t.current_location;
          const prov = loc?.province || 'inconnu';
          const existing = provinceMap.get(prov) || { province: prov, loads: 0, trucks: 0, revenue: 0 };
          existing.trucks++;
          provinceMap.set(prov, existing);
        } catch {}
      });
      const provinceData = Array.from(provinceMap.values()).sort((a, b) => (b.loads + b.trucks) - (a.loads + a.trucks)).slice(0, 10);

      // ── Monthly data (last 12 months) ──
      const monthlyMap = new Map<string, MonthlyData>();
      const monthNames = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(key, { month: `${monthNames[d.getMonth()]} ${d.getFullYear() % 100}`, loads: 0, trucks: 0, revenue: 0, bols: 0 });
      }
      allLoads.forEach((l: any) => {
        const d = new Date(l.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const entry = monthlyMap.get(key);
        if (entry) entry.loads++;
      });
      allTrucks.forEach((t: any) => {
        const d = new Date(t.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const entry = monthlyMap.get(key);
        if (entry) entry.trucks++;
      });
      completedPayments.forEach((p: any) => {
        const d = new Date(p.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const entry = monthlyMap.get(key);
        if (entry) entry.revenue += p.amount || 0;
      });
      allBOLs.forEach((b: any) => {
        const d = new Date(b.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const entry = monthlyMap.get(key);
        if (entry) entry.bols++;
      });
      const monthlyData = Array.from(monthlyMap.values());

      // ── Conversion rate ──
      const totalLoadsCount = allLoads.length;
      const deliveredOrCompleted = allLoads.filter((l: any) => l.status === 'delivered' || l.status === 'completed').length;
      const conversionRate = totalLoadsCount > 0 ? Math.round((deliveredOrCompleted / totalLoadsCount) * 100) : 0;

      // ── BOL completion rate ──
      const completedBOLs = allBOLs.filter((b: any) => b.status === 'completed' || b.status === 'signed').length;
      const bolCompletionRate = allBOLs.length > 0 ? Math.round((completedBOLs / allBOLs.length) * 100) : 0;

      // ── Avg delivery days ──
      let totalDays = 0, countDays = 0;
      allLoads.forEach((l: any) => {
        if (l.pickup_date && l.delivery_date) {
          const diff = (new Date(l.delivery_date).getTime() - new Date(l.pickup_date).getTime()) / (1000 * 60 * 60 * 24);
          if (diff > 0 && diff < 365) { totalDays += diff; countDays++; }
        }
      });
      const avgDeliveryDays = countDays > 0 ? Math.round(totalDays / countDays * 10) / 10 : 0;

      // ── Avg prices ──
      const avgLoadPrice = allLoads.length > 0 ? Math.round(allLoads.reduce((s: number, l: any) => s + (l.price || 0), 0) / allLoads.length) : 0;
      const avgTruckPrice = allTrucks.length > 0 ? Math.round(allTrucks.reduce((s: number, t: any) => s + (t.price || 0), 0) / allTrucks.length) : 0;

      // ── Recent Activity ──
      const activity: RecentActivity[] = [];
      (recentLoads.data || []).forEach((l: any) => {
        const o = typeof l.origin === 'string' ? JSON.parse(l.origin) : l.origin;
        const d = typeof l.destination === 'string' ? JSON.parse(l.destination) : l.destination;
        activity.push({ id: l.id, type: 'load', description: `Chargement ${o?.city || '?'} → ${d?.city || '?'}`, date: l.created_at, status: l.status });
      });
      (recentTrucks.data || []).forEach((t: any) => {
        activity.push({ id: t.id, type: 'truck', description: `Camion ${t.type || 'N/A'}`, date: t.created_at, status: t.status });
      });
      (recentBOLs.data || []).forEach((b: any) => {
        activity.push({ id: b.id, type: 'bol', description: `BOL ${b.bol_number || b.id.substring(0, 8)}`, date: b.created_at, status: b.status });
      });
      (recentPayments.data || []).forEach((p: any) => {
        activity.push({ id: p.id, type: 'payment', description: `Paiement ${(p.amount || 0).toLocaleString()} CDF`, date: p.created_at, status: p.status });
      });
      activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setAnalytics({
        totalCompanies: companiesAll.count || 0,
        totalBrokers: brokersAll.count || 0,
        totalTrucks: trucksAll.count || 0,
        totalLoads: loadsAll.count || 0,
        totalBOLs: bolsAll.count || 0,
        totalUsers: usersAll.count || 0,
        activeSubscriptions: subscriptionsActive.count || 0,
        totalRevenue,
        avgLoadPrice,
        avgTruckPrice,
        prevCompanies: companiesPrev.count || 0,
        prevBrokers: brokersPrev.count || 0,
        prevTrucks: trucksPrev.count || 0,
        prevLoads: loadsPrev.count || 0,
        prevRevenue,
        loadsByStatus,
        trucksByStatus,
        topRoutes,
        provinceData,
        monthlyData,
        recentActivity: activity.slice(0, 15),
        conversionRate,
        bolCompletionRate,
        avgDeliveryDays,
      });
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [period, supabase]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // ── KPIs ──
  const kpis: KPI[] = useMemo(() => {
    if (!analytics) return [];
    return [
      {
        label: 'Chargements',
        value: fmt(analytics.totalLoads),
        change: pctChange(analytics.totalLoads, analytics.prevLoads),
        changeLabel: 'vs periode precedente',
        icon: Package,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
      {
        label: 'Camions',
        value: fmt(analytics.totalTrucks),
        change: pctChange(analytics.totalTrucks, analytics.prevTrucks),
        changeLabel: 'vs periode precedente',
        icon: Truck,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
      },
      {
        label: 'Revenus',
        value: `${fmt(analytics.totalRevenue)} CDF`,
        change: pctChange(analytics.totalRevenue, analytics.prevRevenue),
        changeLabel: 'vs periode precedente',
        icon: DollarSign,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      },
      {
        label: 'Entreprises',
        value: fmt(analytics.totalCompanies),
        change: pctChange(analytics.totalCompanies, analytics.prevCompanies),
        changeLabel: 'vs periode precedente',
        icon: Building2,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      },
      {
        label: 'Courtiers',
        value: fmt(analytics.totalBrokers),
        change: pctChange(analytics.totalBrokers, analytics.prevBrokers),
        changeLabel: 'vs periode precedente',
        icon: Users,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
      },
      {
        label: 'BOL emis',
        value: fmt(analytics.totalBOLs),
        change: 0,
        changeLabel: 'bordereaux',
        icon: FileText,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      },
      {
        label: 'Abonnements actifs',
        value: fmt(analytics.activeSubscriptions),
        change: 0,
        changeLabel: 'en cours',
        icon: CreditCard,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
      },
      {
        label: 'Utilisateurs',
        value: fmt(analytics.totalUsers),
        change: 0,
        changeLabel: 'total inscrits',
        icon: Users,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
      },
    ];
  }, [analytics]);

  // ── Loading ──
  if (isLoading && !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Chargement des analytics...</p>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* ══════════ HEADER ══════════ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary-600" />
            Analytics - Tableau de Bord
          </h1>
          <p className="text-gray-500 mt-0.5">Vue d&apos;ensemble de la plateforme Nzela</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  period.days === p.days
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={loadAnalytics}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ══════════ KPI CARDS ══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isPositive = kpi.change >= 0;
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                {kpi.change !== 0 && (
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(kpi.change)}%
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/* ══════════ PERFORMANCE METRICS ══════════ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-gray-600">Taux de conversion</span>
          </div>
          <div className="text-3xl font-bold text-emerald-600">{analytics.conversionRate}%</div>
          <div className="text-[10px] text-gray-400 mt-1">Chargements livres / total</div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${analytics.conversionRate}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-gray-600">BOL completes</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">{analytics.bolCompletionRate}%</div>
          <div className="text-[10px] text-gray-400 mt-1">Bordereaux signes ou completes</div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${analytics.bolCompletionRate}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-gray-600">Delai moyen livraison</span>
          </div>
          <div className="text-3xl font-bold text-amber-600">{analytics.avgDeliveryDays}<span className="text-lg font-normal text-gray-400"> j</span></div>
          <div className="text-[10px] text-gray-400 mt-1">Jours entre ramassage et livraison</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-gray-600">Prix moyen / chargement</span>
          </div>
          <div className="text-3xl font-bold text-green-600">{fmt(analytics.avgLoadPrice)}<span className="text-lg font-normal text-gray-400"> CDF</span></div>
          <div className="text-[10px] text-gray-400 mt-1">Moyenne tous chargements</div>
        </div>
      </div>

      {/* ══════════ CHARTS ROW ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Evolution mensuelle (12 mois)</h2>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Chargements</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Camions</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> BOLs</span>
            </div>
          </div>
          <div className="relative">
            {/* Y axis labels */}
            <div className="flex gap-4 h-[160px]">
              <div className="flex-1">
                <MiniBarChart data={analytics.monthlyData.map(m => m.loads)} color="#3b82f6" height={160} />
              </div>
              <div className="flex-1">
                <MiniBarChart data={analytics.monthlyData.map(m => m.trucks)} color="#10b981" height={160} />
              </div>
              <div className="flex-1">
                <MiniBarChart data={analytics.monthlyData.map(m => m.bols)} color="#f59e0b" height={160} />
              </div>
            </div>
            {/* X axis */}
            <div className="flex justify-between mt-2 text-[10px] text-gray-400 px-1">
              {analytics.monthlyData.map((m, i) => (
                <span key={i} className={i % 2 === 0 ? '' : 'hidden md:inline'}>{m.month}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Status donuts */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Repartition par statut</h2>
          <div className="space-y-6">
            <div>
              <p className="text-xs text-gray-500 mb-2 text-center font-medium">Chargements</p>
              <DonutChart
                size={120}
                strokeWidth={20}
                segments={Object.entries(analytics.loadsByStatus).map(([status, value]) => ({
                  value,
                  color: STATUS_COLORS[status] || '#ccc',
                  label: STATUS_LABELS[status] || status,
                }))}
              />
            </div>
            <div className="border-t pt-4">
              <p className="text-xs text-gray-500 mb-2 text-center font-medium">Camions</p>
              <DonutChart
                size={120}
                strokeWidth={20}
                segments={Object.entries(analytics.trucksByStatus).map(([status, value]) => ({
                  value,
                  color: STATUS_COLORS[status] || '#ccc',
                  label: STATUS_LABELS[status] || status,
                }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ TOP ROUTES + PROVINCES ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top routes */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-500" />
              Routes les plus populaires
            </h2>
          </div>
          <div className="divide-y">
            {analytics.topRoutes.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Aucune route enregistree</div>
            ) : (
              analytics.topRoutes.map((route, i) => {
                const maxCount = analytics.topRoutes[0]?.count || 1;
                return (
                  <div key={i} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                        <span className="text-sm font-medium text-gray-800">{route.origin}</span>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                        <span className="text-sm font-medium text-gray-800">{route.destination}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-primary-600">{route.count} trajets</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-7">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-500"
                          style={{ width: `${(route.count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{fmt(route.totalRevenue)} CDF</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Provinces */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-4 border-b bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              Activite par province
            </h2>
          </div>
          <div className="p-5 space-y-3">
            {analytics.provinceData.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">Aucune donnee provinciale</div>
            ) : (
              analytics.provinceData.map((prov, i) => {
                const maxActivity = analytics.provinceData[0] ? analytics.provinceData[0].loads + analytics.provinceData[0].trucks : 1;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">
                        {PROVINCE_NAMES[prov.province] || prov.province}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Package className="w-3 h-3" />{prov.loads}</span>
                        <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{prov.trucks}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500 flex">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${(prov.loads / maxActivity) * 50}%` }}
                        />
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${(prov.trucks / maxActivity) * 50}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ══════════ REVENUE TREND ══════════ */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Evolution des revenus (12 mois)
          </h2>
          <Sparkline data={analytics.monthlyData.map(m => m.revenue)} color="#10b981" width={100} height={30} />
        </div>
        <div className="h-[120px]">
          <MiniBarChart data={analytics.monthlyData.map(m => m.revenue)} color="#10b981" height={120} />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-gray-400 px-1">
          {analytics.monthlyData.map((m, i) => (
            <span key={i} className={i % 2 === 0 ? '' : 'hidden md:inline'}>{m.month}</span>
          ))}
        </div>
        <div className="flex justify-between mt-3 text-xs text-gray-500 border-t pt-3">
          {analytics.monthlyData.slice(-4).map((m, i) => (
            <div key={i} className="text-center">
              <div className="font-semibold text-gray-800">{fmt(m.revenue)} CDF</div>
              <div>{m.month}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ RECENT ACTIVITY ══════════ */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-500" />
            Activite recente
          </h2>
          <span className="text-xs text-gray-400">{analytics.recentActivity.length} elements</span>
        </div>
        <div className="divide-y max-h-[400px] overflow-y-auto">
          {analytics.recentActivity.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">Aucune activite recente</div>
          ) : (
            analytics.recentActivity.map((item) => {
              const typeIcons: Record<string, any> = { load: Package, truck: Truck, bol: FileText, payment: DollarSign, user: Users };
              const typeColors: Record<string, string> = { load: 'text-blue-500 bg-blue-50', truck: 'text-emerald-500 bg-emerald-50', bol: 'text-orange-500 bg-orange-50', payment: 'text-green-500 bg-green-50', user: 'text-purple-500 bg-purple-50' };
              const Icon = typeIcons[item.type] || Activity;
              const colorCls = typeColors[item.type] || 'text-gray-500 bg-gray-50';
              const timeAgo = getTimeAgo(item.date);
              return (
                <div key={`${item.type}-${item.id}`} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className={`p-2 rounded-lg ${colorCls}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.description}</p>
                    <p className="text-xs text-gray-400">{timeAgo}</p>
                  </div>
                  {item.status && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.status === 'completed' || item.status === 'delivered' || item.status === 'signed' ? 'bg-emerald-100 text-emerald-700' :
                      item.status === 'available' ? 'bg-blue-100 text-blue-700' :
                      item.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      item.status === 'in-transit' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ══════════ FOOTER ══════════ */}
      <div className="text-center text-xs text-gray-400 py-2">
        Derniere mise a jour: {new Date().toLocaleString('fr-FR')} | Nzela Analytics v2.0
      </div>
    </div>
  );
}

// ── Helper: time ago ──
function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (minutes < 1) return 'A l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
