'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { createClient } from '@/lib/supabase/client';
import { useRequireRole } from '@/hooks/useRequireRole';
import { Link } from '@/lib/i18n/routing';
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, MapPin, Loader2, ChevronRight, ChevronLeft, LayoutList, CalendarDays } from 'lucide-react';
import { cargoTypeFr } from '@/lib/utils/translate-fr';
import { formatLoadLocationLine } from '@/lib/utils/load-location';

function parseLocation(loc: unknown): string {
  return formatLoadLocationLine(loc);
}

type ViewMode = 'list' | 'calendar';

export default function TMSPlanificationPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthorized, role, brokerId, companyId } = useRequireRole(['broker', 'company', 'admin']);
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const supabase = useMemo(() => createClient(), []);

  const fetchLoads = useCallback(async () => {
    if (!role) return;
    try {
      if (role === 'broker' && brokerId) {
        const { data } = await supabase
          .from('loads')
          .select('id, origin, destination, status, cargo_type, weight, pickup_date, delivery_date')
          .eq('broker_id', brokerId)
          .in('status', ['available', 'booked', 'in-transit', 'completed'])
          .order('pickup_date', { ascending: true })
          .limit(150);
        setLoads(data || []);
        return;
      }
      if (role === 'company' && companyId) {
        const { data: trucks } = await supabase.from('trucks').select('id').eq('company_id', companyId);
        const ids = (trucks || []).map((t) => t.id);
        if (ids.length === 0) {
          setLoads([]);
          return;
        }
        const { data: bols } = await supabase.from('bols').select('load_id').in('truck_id', ids);
        const loadIds = [...new Set((bols || []).map((b) => b.load_id))];
        if (loadIds.length === 0) {
          setLoads([]);
          return;
        }
        const { data } = await supabase
          .from('loads')
          .select('id, origin, destination, status, cargo_type, weight, pickup_date, delivery_date')
          .in('id', loadIds)
          .order('pickup_date', { ascending: true })
          .limit(150);
        setLoads(data || []);
        return;
      }
      if (role === 'admin') {
        const { data } = await supabase
          .from('loads')
          .select('id, origin, destination, status, cargo_type, weight, pickup_date, delivery_date')
          .in('status', ['available', 'booked', 'in-transit', 'completed'])
          .order('pickup_date', { ascending: true })
          .limit(150);
        setLoads(data || []);
        return;
      }
      setLoads([]);
    } catch {
      setLoads([]);
    } finally {
      setLoading(false);
    }
  }, [role, brokerId, companyId, supabase]);

  useEffect(() => {
    if (isAuthorized) fetchLoads();
  }, [isAuthorized, fetchLoads]);

  const byDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    loads.forEach((l) => {
      const d = l.pickup_date ? new Date(l.pickup_date).toISOString().slice(0, 10) : 'sans-date';
      if (!map[d]) map[d] = [];
      map[d].push(l);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, list]) => ({ date, list }));
  }, [loads]);

  const loadsByDateKey = useMemo(() => {
    const map: Record<string, any[]> = {};
    loads.forEach((l) => {
      if (!l.pickup_date) return;
      const key = new Date(l.pickup_date).toISOString().slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(l);
    });
    return map;
  }, [loads]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const weekDays = useMemo(() => ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], []);

  if (authLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Planification tournées</h1>
          <p className="text-sm text-gray-500">Vue des chargements par date de pickup</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'calendar' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarDays className="w-4 h-4" /> Calendrier
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutList className="w-4 h-4" /> Liste
            </button>
          </div>
          <Link href="/dashboard/tms" className="text-sm text-primary-600 hover:underline">
            ← Retour TMS
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : byDate.length === 0 && loads.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium">Aucun chargement à planifier</p>
          <Link href="/dashboard/loads/board" className="inline-block mt-4 text-sm text-primary-600 hover:underline">
            Voir le Load Board
          </Link>
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                aria-label="Mois précédent"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
                {format(calendarMonth, 'MMMM yyyy', { locale: fr })}
              </span>
              <button
                type="button"
                onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                aria-label="Mois suivant"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCalendarMonth(new Date())}
              className="text-sm text-primary-600 hover:underline"
            >
              Aujourd&apos;hui
            </button>
          </div>
          <div className="p-4 overflow-x-auto">
            <div className="grid grid-cols-7 min-w-[400px]">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2 border-b border-gray-100">
                  {day}
                </div>
              ))}
              {calendarDays.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayLoads = loadsByDateKey[key] || [];
                const inMonth = isSameMonth(day, calendarMonth);
                const today = isToday(day);
                return (
                  <div
                    key={key}
                    className={`min-h-[100px] sm:min-h-[120px] p-1.5 border-b border-r border-gray-100 last:border-r-0 ${
                      inMonth ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 ${inMonth ? 'text-gray-900' : 'text-gray-400'} ${today ? 'flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-white' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-[90px] sm:max-h-[100px]">
                      {dayLoads.slice(0, 3).map((load) => (
                        <button
                          key={load.id}
                          type="button"
                          onClick={() => router.push(`/dashboard/loads/${load.id}`)}
                          className="w-full text-left px-1.5 py-1 rounded bg-primary-50 hover:bg-primary-100 border border-primary-100 text-[10px] sm:text-xs text-primary-800 truncate block"
                          title={`${parseLocation(load.origin)} → ${parseLocation(load.destination)}`}
                        >
                          {parseLocation(load.origin)} → {parseLocation(load.destination)}
                        </button>
                      ))}
                      {dayLoads.length > 3 && (
                        <span className="text-[10px] text-gray-500 block px-1">+{dayLoads.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {byDate.map(({ date, list }) => (
            <div key={date} className="bg-white rounded-xl border overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-600" />
                <span className="font-semibold text-gray-800">
                  {date === 'sans-date' ? 'Sans date' : new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="text-sm text-gray-500">({list.length} chargement{list.length > 1 ? 's' : ''})</span>
              </div>
              <ul className="divide-y divide-gray-50">
                {list.map((load) => (
                  <li key={load.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/loads/${load.id}`)}
                      className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 flex-1">
                        {parseLocation(load.origin)} → {parseLocation(load.destination)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {load.cargo_type ? cargoTypeFr(load.cargo_type) : '—'} {load.weight ? `· ${load.weight} kg` : ''}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        load.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                        load.status === 'in-transit' || load.status === 'in_transit' ? 'bg-amber-100 text-amber-700' :
                        load.status === 'booked' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {load.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
