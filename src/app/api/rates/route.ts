import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/checkRole';

// GET - Historique des tarifs par route
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const auth = await requireAuth(supabase, ['broker', 'company', 'admin']);
    if (!auth.allowed) return auth.response!;

    const { searchParams } = new URL(request.url);
    const originCity = searchParams.get('origin');
    const destCity = searchParams.get('destination');
    const months = parseInt(searchParams.get('months') || '6');

    // Recuperer les loads termines des X derniers mois pour calculer les tarifs
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    let query = supabase
      .from('loads')
      .select('origin, destination, price, price_per_km, weight, trailer_type, created_at, distance')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Ne pas filtrer par status pour avoir assez de donnees
    const { data: loads, error } = await query.limit(1000);
    if (error) throw error;

    if (!loads || loads.length === 0) {
      return NextResponse.json({ rates: [], summary: null });
    }

    // Parser les loads et grouper par mois
    const monthlyData: Record<string, { prices: number[]; pricesPerKm: number[]; weights: number[]; distances: number[]; count: number }> = {};
    const routeData: Record<string, { prices: number[]; count: number }> = {};

    loads.forEach((load: any) => {
      const origin = typeof load.origin === 'string' ? JSON.parse(load.origin) : load.origin;
      const dest = typeof load.destination === 'string' ? JSON.parse(load.destination) : load.destination;

      const oCity = origin?.city?.toLowerCase() || '';
      const dCity = dest?.city?.toLowerCase() || '';

      // Filtrer par route si specifie
      if (originCity && oCity !== originCity.toLowerCase()) return;
      if (destCity && dCity !== destCity.toLowerCase()) return;

      // Grouper par mois
      const date = new Date(load.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { prices: [], pricesPerKm: [], weights: [], distances: [], count: 0 };
      }
      monthlyData[monthKey].prices.push(load.price || 0);
      monthlyData[monthKey].pricesPerKm.push(load.price_per_km || 0);
      monthlyData[monthKey].weights.push(load.weight || 0);
      monthlyData[monthKey].distances.push(load.distance || 0);
      monthlyData[monthKey].count++;

      // Routes populaires
      const routeKey = `${origin?.city || 'N/A'} → ${dest?.city || 'N/A'}`;
      if (!routeData[routeKey]) routeData[routeKey] = { prices: [], count: 0 };
      routeData[routeKey].prices.push(load.price || 0);
      routeData[routeKey].count++;
    });

    // Formater les donnees mensuelles pour les graphiques
    const rates = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        label: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        avgPrice: Math.round(data.prices.reduce((s, p) => s + p, 0) / data.prices.length),
        avgPricePerKm: Math.round(data.pricesPerKm.reduce((s, p) => s + p, 0) / data.pricesPerKm.length),
        minPrice: Math.min(...data.prices),
        maxPrice: Math.max(...data.prices),
        avgWeight: Math.round(data.weights.reduce((s, w) => s + w, 0) / data.weights.length),
        avgDistance: Math.round(data.distances.reduce((s, d) => s + d, 0) / data.distances.length),
        loadCount: data.count,
      }));

    // Top routes
    const topRoutes = Object.entries(routeData)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([route, data]) => ({
        route,
        avgPrice: Math.round(data.prices.reduce((s, p) => s + p, 0) / data.prices.length),
        count: data.count,
      }));

    // Resume global
    const allPrices = loads.map((l: any) => l.price || 0).filter((p: number) => p > 0);
    const summary = {
      totalLoads: loads.length,
      avgPrice: allPrices.length > 0 ? Math.round(allPrices.reduce((s: number, p: number) => s + p, 0) / allPrices.length) : 0,
      minPrice: allPrices.length > 0 ? Math.min(...allPrices) : 0,
      maxPrice: allPrices.length > 0 ? Math.max(...allPrices) : 0,
      // Tendance (dernier mois vs avant-dernier)
      trend: rates.length >= 2 ? ((rates[rates.length - 1].avgPrice - rates[rates.length - 2].avgPrice) / rates[rates.length - 2].avgPrice * 100) : 0,
    };

    return NextResponse.json({ rates, topRoutes, summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
