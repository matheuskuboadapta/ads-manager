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
      const today = new Date();
      const sevenDaysAgo = subDays(today, 6);

      let query = supabase
        .from('meta_ads_view')
        .select('date_start, spend, real_sales')
        .gte('date_start', format(sevenDaysAgo, 'yyyy-MM-dd'))
        .lte('date_start', format(today, 'yyyy-MM-dd'))
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
        const date = format(subDays(today, i), 'yyyy-MM-dd');
        const metrics = dailyMetrics.get(date) || { spend: 0, sales: 0 };
        
        result.push({
          date: format(subDays(today, i), 'dd/MM'),
          spend: Number(metrics.spend.toFixed(2)),
          cpa: metrics.sales > 0 ? Number((metrics.spend / metrics.sales).toFixed(2)) : 0
        });
      }

      return result;
    },
    enabled: !!name,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export default useDetailMetrics;