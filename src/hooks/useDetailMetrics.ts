import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

interface DetailMetricsData {
  date: string;
  spend: number;
  cpa: number;
}

interface AggregatedMetrics {
  spend: number;
  revenue: number;
  sales: number;
  profit: number;
  clicks: number;
  impressions: number;
  cpa: number;
  cpm: number;
  cpc: number;
  ctr: number;
  clickCv: number;
  epc: number;
  roas: number;
}

interface DetailMetricsResult {
  dailyData: DetailMetricsData[];
  threeDayMetrics: AggregatedMetrics;
  sevenDayMetrics: AggregatedMetrics;
}

const useDetailMetrics = (type: 'campaign' | 'adset' | 'ad', name: string) => {
  return useQuery({
    queryKey: ['detailMetrics', type, name],
    queryFn: async (): Promise<DetailMetricsResult> => {
      // Use current local time directly since we're already in GMT-3
      const now = new Date();
      
      // Create dates using YYYY-MM-DD format to avoid timezone issues
      const todayStr = now.toISOString().split('T')[0];
      const sevenDaysAgo = subDays(now, 6); // 7 dias atrás (incluindo hoje)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      
      // For the end date, we need to include the entire day, so we use the next day as the upper limit
      const nextDay = new Date(todayStr);
      nextDay.setDate(nextDay.getDate() + 1);
      const upperLimit = nextDay.toISOString().split('T')[0];

      let query = supabase
        .from('meta_ads_view')
        .select('date_start, spend, real_sales, real_revenue, profit, clicks, impressions, ad_id')
        .gte('date_start', sevenDaysAgoStr)
        .lt('date_start', upperLimit)
        .order('date_start', { ascending: true });

      // Filtrar baseado no tipo
      if (type === 'campaign') {
        query = query.eq('campaign_name', name);
      } else if (type === 'adset') {
        query = query.eq('adset_name', name);
      } else if (type === 'ad') {
        query = query.eq('ad_name', name);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching detail metrics:', error);
        throw error;
      }

      // Agrupar por data e calcular métricas
      const dailyMetrics = new Map<string, { spend: number; sales: number; revenue: number; profit: number; clicks: number; impressions: number }>();

      data?.forEach(row => {
        const date = row.date_start || '';
        const spend = Number(row.spend) || 0;
        const sales = Number(row.real_sales) || 0;
        const revenue = Number(row.real_revenue) || 0;
        const profit = Number(row.profit) || 0;
        const clicks = Number(row.clicks) || 0;
        const impressions = Number(row.impressions) || 0;

        if (dailyMetrics.has(date)) {
          const current = dailyMetrics.get(date)!;
          dailyMetrics.set(date, {
            spend: current.spend + spend,
            sales: current.sales + sales,
            revenue: current.revenue + revenue,
            profit: current.profit + profit,
            clicks: current.clicks + clicks,
            impressions: current.impressions + impressions
          });
        } else {
          dailyMetrics.set(date, { spend, sales, revenue, profit, clicks, impressions });
        }
      });

      // Criar array dos últimos 7 dias com os dados
      const dailyData: DetailMetricsData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(now, i), 'yyyy-MM-dd');
        const metrics = dailyMetrics.get(date) || { spend: 0, sales: 0, revenue: 0, profit: 0, clicks: 0, impressions: 0 };
        
        // Para CPA, só mostrar quando há vendas
        let cpa = 0;
        if (metrics.spend > 0 && metrics.sales > 0) {
          cpa = Number((metrics.spend / metrics.sales).toFixed(2));
        }
        
        dailyData.push({
          date: format(subDays(now, i), 'dd/MM'),
          spend: Number(metrics.spend.toFixed(2)),
          cpa: cpa
        });
      }

      // Calcular métricas agregadas para 3 dias (últimos 3 dias incluindo hoje)
      // Usar a mesma lógica do date-fns para garantir consistência
      const threeDaysAgo = subDays(now, 2); // Se hoje é 30, vai para 28 (30-2)
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
      
      const threeDayData = Array.from(dailyMetrics.entries())
        .filter(([date]) => {
          return date >= threeDaysAgoStr; // Comparar strings de data para evitar problemas de timezone
        })
        .map(([, metrics]) => metrics);

      console.log('3-day calculation:', {
        today: now.toISOString().split('T')[0],
        threeDaysAgo: threeDaysAgoStr,
        threeDayDates: Array.from(dailyMetrics.keys()).filter(date => date >= threeDaysAgoStr),
        allAvailableDates: Array.from(dailyMetrics.keys()).sort()
      });

      const threeDayMetrics = calculateAggregatedMetrics(threeDayData);

      // Calcular métricas agregadas para 7 dias (todos os dados - últimos 7 dias incluindo hoje)
      const sevenDayData = Array.from(dailyMetrics.values());
      const sevenDayMetrics = calculateAggregatedMetrics(sevenDayData);

      console.log('7-day calculation:', {
        today: now.toISOString().split('T')[0],
        sevenDaysAgo: sevenDaysAgoStr,
        sevenDayDates: Array.from(dailyMetrics.keys())
      });

      console.log('DetailView processed data:', { dailyData, threeDayMetrics, sevenDayMetrics });

      return {
        dailyData,
        threeDayMetrics,
        sevenDayMetrics
      };
    },
    enabled: !!name,
    staleTime: 15 * 60 * 1000, // 15 minutos
  });
};

const calculateAggregatedMetrics = (data: Array<{ spend: number; sales: number; revenue: number; profit: number; clicks: number; impressions: number }>): AggregatedMetrics => {
  const totals = data.reduce((acc, item) => ({
    spend: acc.spend + item.spend,
    revenue: acc.revenue + item.revenue,
    sales: acc.sales + item.sales,
    profit: acc.profit + item.profit,
    clicks: acc.clicks + item.clicks,
    impressions: acc.impressions + item.impressions
  }), { spend: 0, revenue: 0, sales: 0, profit: 0, clicks: 0, impressions: 0 });

  return {
    spend: Number(totals.spend.toFixed(2)),
    revenue: Number(totals.revenue.toFixed(2)),
    sales: totals.sales,
    profit: Number(totals.profit.toFixed(2)),
    clicks: totals.clicks,
    impressions: totals.impressions,
    cpa: totals.sales > 0 ? Number((totals.spend / totals.sales).toFixed(2)) : 0,
    cpm: totals.impressions > 0 ? Number(((totals.spend / totals.impressions) * 1000).toFixed(2)) : 0,
    cpc: totals.clicks > 0 ? Number((totals.spend / totals.clicks).toFixed(2)) : 0,
    ctr: totals.impressions > 0 ? Number(((totals.clicks / totals.impressions) * 100).toFixed(2)) : 0,
    clickCv: totals.clicks > 0 ? Number(((totals.sales / totals.clicks) * 100).toFixed(2)) : 0,
    epc: totals.clicks > 0 ? Number((totals.revenue / totals.clicks).toFixed(2)) : 0,
    roas: totals.spend > 0 ? Number((totals.revenue / totals.spend).toFixed(2)) : 0
  };
};

export default useDetailMetrics;