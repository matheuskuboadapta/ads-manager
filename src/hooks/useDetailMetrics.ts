import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

interface DetailMetricsData {
  date: string;
  spend: number;
  cpa: number;
}

const useDetailMetrics = (type: 'campaign' | 'adset' | 'ad', name: string) => {
  return useQuery({
    queryKey: ['detailMetrics', type, name],
    queryFn: async (): Promise<DetailMetricsData[]> => {
      // Use current local time directly since we're already in GMT-3
      const now = new Date();
      
      // Create dates using YYYY-MM-DD format to avoid timezone issues
      const todayStr = now.toISOString().split('T')[0];
      const sevenDaysAgoStr = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString().split('T')[0];
      
      // For the end date, we need to include the entire day, so we use the next day as the upper limit
      const nextDay = new Date(todayStr);
      nextDay.setDate(nextDay.getDate() + 1);
      const upperLimit = nextDay.toISOString().split('T')[0];

      let query = supabase
        .from('meta_ads_view')
        .select('date_start, spend, real_sales, ad_id')
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
      const dailyMetrics = new Map<string, { spend: number; sales: number }>();

      data?.forEach(row => {
        const date = row.date_start || '';
        const spend = Number(row.spend) || 0;
        const sales = Number(row.real_sales) || 0;

        if (dailyMetrics.has(date)) {
          const current = dailyMetrics.get(date)!;
          dailyMetrics.set(date, {
            spend: current.spend + spend,
            sales: current.sales + sales
          });
        } else {
          dailyMetrics.set(date, { spend, sales });
        }
      });

      // Criar array dos últimos 7 dias com os dados
      const result: DetailMetricsData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(now, i), 'yyyy-MM-dd');
        const metrics = dailyMetrics.get(date) || { spend: 0, sales: 0 };
        
        // Para CPA, só mostrar quando há vendas
        let cpa = 0;
        if (metrics.spend > 0 && metrics.sales > 0) {
          cpa = Number((metrics.spend / metrics.sales).toFixed(2));
        }
        
        result.push({
          date: format(subDays(now, i), 'dd/MM'),
          spend: Number(metrics.spend.toFixed(2)),
          cpa: cpa
        });
      }

      console.log('DetailView processed data:', result);

      return result;
    },
    enabled: !!name,
    staleTime: 15 * 60 * 1000, // 15 minutos
  });
};

export default useDetailMetrics;