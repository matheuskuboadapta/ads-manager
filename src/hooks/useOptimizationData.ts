import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

interface OptimizationMetrics {
  name: string;
  status: string;
  budget: number;
  spend: number;
  cpa: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  revenue: number;
  profit: number;
  roas: number;
}

interface OptimizationData {
  today: OptimizationMetrics[];
  last3Days: OptimizationMetrics[];
  main: OptimizationMetrics[];
}

const fetchOptimizationData = async (type: 'campaigns' | 'adsets' | 'ads', dateRange: number) => {
  console.log('Fetching optimization data for:', type, 'dateRange:', dateRange);
  
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const threeDaysAgoStr = format(subDays(today, 2), 'yyyy-MM-dd');
  const dateRangeStartStr = format(subDays(today, dateRange - 1), 'yyyy-MM-dd');

  // Fetch all data without date filter
  const { data: rawData, error } = await supabase
    .from('meta_ads_view')
    .select('*')
    .order('date_start', { ascending: true });

  if (error) {
    console.error('Error fetching optimization data:', error);
    throw error;
  }

  if (!rawData || rawData.length === 0) {
    console.log('No data found for optimization');
    return {
      today: [],
      last3Days: [],
      main: [],
    };
  }

  // Helper function to process data by grouping key
  const processDataByGroup = (data: any[], groupBy: string, dateFilter?: (date: string) => boolean) => {
    const grouped = new Map();
    
    data.forEach(row => {
      if (!row.date_start || (dateFilter && !dateFilter(row.date_start))) return;
      
      const key = groupBy === 'campaigns' ? row.campaign_name : 
                 groupBy === 'adsets' ? row.adset_name : 
                 row.ad_name;
      
      if (!key) return;
      
      const existing = grouped.get(key) || {
        name: key,
        status: row.ad_status_final || row.adset_status_final || row.campaign_status_final || 'UNKNOWN',
        budget: 0,
        spend: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0,
        sales: 0,
      };
      
      existing.spend += row.spend || 0;
      existing.revenue += row.real_revenue || 0;
      existing.impressions += row.impressions || 0;
      existing.clicks += row.clicks || 0;
      existing.sales += row.real_sales || 0;
      
      // For budget, we'll use daily_budget which is available in the view
      if (row.daily_budget) {
        existing.budget = Math.max(existing.budget, row.daily_budget);
      }
      
      grouped.set(key, existing);
    });

    // Convert to array and calculate derived metrics
    return Array.from(grouped.values()).map(item => ({
      ...item,
      cpa: item.sales > 0 ? item.spend / item.sales : 0,
      ctr: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0,
      cpc: item.clicks > 0 ? item.spend / item.clicks : 0,
      cpm: item.impressions > 0 ? (item.spend / item.impressions) * 1000 : 0,
      profit: item.revenue - item.spend,
      roas: item.spend > 0 ? (item.revenue / item.spend) * 100 : 0,
    }));
  };

  // Get today's data
  const todayData = processDataByGroup(rawData, type, (date) => date === todayStr);
  
  // Get last 3 days data
  const last3DaysData = processDataByGroup(rawData, type, (date) => {
    return date >= threeDaysAgoStr && date <= todayStr;
  });
  
  // Get main period data
  const mainData = processDataByGroup(rawData, type, (date) => {
    return date >= dateRangeStartStr && date <= todayStr;
  });

  console.log('Optimization data processed:', {
    type,
    todayCount: todayData.length,
    last3DaysCount: last3DaysData.length,
    mainCount: mainData.length,
  });

  return {
    today: todayData,
    last3Days: last3DaysData,
    main: mainData,
  };
};

export function useOptimizationData(type: 'campaigns' | 'adsets' | 'ads', dateRange: number) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['optimization-data', type, dateRange],
    queryFn: () => fetchOptimizationData(type, dateRange),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  return {
    campaignsData: type === 'campaigns' ? data || { today: [], last3Days: [], main: [] } : { today: [], last3Days: [], main: [] },
    adsetsData: type === 'adsets' ? data || { today: [], last3Days: [], main: [] } : { today: [], last3Days: [], main: [] },
    adsData: type === 'ads' ? data || { today: [], last3Days: [], main: [] } : { today: [], last3Days: [], main: [] },
    isLoading,
    error,
  };
}