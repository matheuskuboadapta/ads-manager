import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

interface HomeMetrics {
  todaySpend: number;
  todaySales: number;
  todayRevenue: number;
  todayImpressions: number;
  todayClicks: number;
  todayCPA: number;
  previousDaySpend: number;
  previousDaySales: number;
  previousDayRevenue: number;
  previousDayImpressions: number;
  previousDayClicks: number;
  previousDayCPA: number;
  // Last 7 days data for mini charts
  last7DaysSpend: number[];
  last7DaysSales: number[];
  last7DaysRevenue: number[];
  last7DaysImpressions: number[];
  last7DaysClicks: number[];
  last7DaysCPA: number[];
}

interface HourlyMetrics {
  hour_of_day: number;
  spend_hour: number;
  real_sales_hour: number;
  impressions_hour: number;
  clicks_hour: number;
  date_brt: string;
}

// Fetch real data from meta_ads_view using the same logic as other tabs
const fetchRealHomeMetrics = async (): Promise<HomeMetrics> => {
  console.log('Fetching real home metrics from meta_ads_view...');
  
  const today = new Date();
  const yesterday = subDays(today, 1);
  const sevenDaysAgo = subDays(today, 6);
  
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
  const sevenDaysAgoStr = format(sevenDaysAgo, 'yyyy-MM-dd');

  console.log('Date range:', { today: todayStr, yesterday: yesterdayStr, sevenDaysAgo: sevenDaysAgoStr });

  // Fetch all data from the last 7 days (same as other tabs)
  const { data: rawData, error } = await supabase
    .from('meta_ads_view')
    .select('date_start, spend, real_sales, real_revenue, impressions, clicks')
    .gte('date_start', sevenDaysAgoStr)
    .lte('date_start', todayStr)
    .order('date_start', { ascending: true });

  if (error) {
    console.error('Error fetching home metrics:', error);
    throw error;
  }

  console.log('Raw data fetched:', rawData?.length, 'records');
  console.log('Sample raw data:', rawData?.slice(0, 5));

  if (!rawData || rawData.length === 0) {
    console.log('No data found for home metrics');
    return {
      todaySpend: 0, todaySales: 0, todayRevenue: 0, todayImpressions: 0, todayClicks: 0, todayCPA: 0,
      previousDaySpend: 0, previousDaySales: 0, previousDayRevenue: 0, previousDayImpressions: 0, previousDayClicks: 0, previousDayCPA: 0,
      last7DaysSpend: [], last7DaysSales: [], last7DaysRevenue: [], last7DaysImpressions: [], last7DaysClicks: [], last7DaysCPA: [],
    };
  }

  // Group data by date and aggregate (same logic as AccountsTab)
  const dailyData = new Map();
  
  rawData.forEach(row => {
    if (!row.date_start) return;
    
    const existing = dailyData.get(row.date_start) || {
      spend: 0,
      sales: 0,
      revenue: 0,
      impressions: 0,
      clicks: 0,
    };
    
    existing.spend += row.spend || 0;
    existing.sales += row.real_sales || 0;
    existing.revenue += row.real_revenue || 0;
    existing.impressions += row.impressions || 0;
    existing.clicks += row.clicks || 0;
    
    dailyData.set(row.date_start, existing);
  });

  console.log('Daily aggregated data:', Object.fromEntries(dailyData));

  // Get today's and yesterday's metrics
  const todayData = dailyData.get(todayStr) || { spend: 0, sales: 0, revenue: 0, impressions: 0, clicks: 0 };
  const yesterdayData = dailyData.get(yesterdayStr) || { spend: 0, sales: 0, revenue: 0, impressions: 0, clicks: 0 };

  console.log('Today data:', todayData);
  console.log('Yesterday data:', yesterdayData);

  // Create arrays for last 7 days for mini charts
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    return format(subDays(today, 6 - i), 'yyyy-MM-dd');
  });

  const last7DaysSpend = last7Days.map(date => dailyData.get(date)?.spend || 0);
  const last7DaysSales = last7Days.map(date => dailyData.get(date)?.sales || 0);
  const last7DaysRevenue = last7Days.map(date => dailyData.get(date)?.revenue || 0);
  const last7DaysImpressions = last7Days.map(date => dailyData.get(date)?.impressions || 0);
  const last7DaysClicks = last7Days.map(date => dailyData.get(date)?.clicks || 0);
  const last7DaysCPA = last7DaysSpend.map((spend, i) => {
    const sales = last7DaysSales[i];
    return sales > 0 ? spend / sales : 0;
  });

  console.log('Last 7 days data:', {
    dates: last7Days,
    spend: last7DaysSpend,
    sales: last7DaysSales,
  });

  const result = {
    todaySpend: todayData.spend,
    todaySales: todayData.sales,
    todayRevenue: todayData.revenue,
    todayImpressions: todayData.impressions,
    todayClicks: todayData.clicks,
    todayCPA: todayData.sales > 0 ? todayData.spend / todayData.sales : 0,
    
    previousDaySpend: yesterdayData.spend,
    previousDaySales: yesterdayData.sales,
    previousDayRevenue: yesterdayData.revenue,
    previousDayImpressions: yesterdayData.impressions,
    previousDayClicks: yesterdayData.clicks,
    previousDayCPA: yesterdayData.sales > 0 ? yesterdayData.spend / yesterdayData.sales : 0,
    
    last7DaysSpend,
    last7DaysSales,
    last7DaysRevenue,
    last7DaysImpressions,
    last7DaysClicks,
    last7DaysCPA,
  };

  console.log('Final home metrics result:', result);
  return result;
};

const fetchRealHourlyMetrics = async (accountName?: string | null): Promise<HourlyMetrics[]> => {
  // For now, use fallback metrics since hourly table structure needs verification
  return generateFallbackHourlyMetrics(accountName);
};

const generateFallbackHourlyMetrics = (accountName?: string | null): HourlyMetrics[] => {
  const data: HourlyMetrics[] = [];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const today = new Date();
    const date = subDays(today, 6 - i);
    return format(date, 'yyyy-MM-dd');
  });

  last7Days.forEach(date => {
    for (let hour = 0; hour < 24; hour++) {
      // Generate more realistic hourly distribution
      const hourMultiplier = getHourMultiplier(hour);
      
      data.push({
        date_brt: date,
        hour_of_day: hour,
        spend_hour: Math.random() * 200 * hourMultiplier + 10,
        real_sales_hour: Math.floor(Math.random() * 10 * hourMultiplier),
        impressions_hour: Math.floor(Math.random() * 5000 * hourMultiplier + 500),
        clicks_hour: Math.floor(Math.random() * 200 * hourMultiplier + 50),
      });
    }
  });

  return data;
};

const getHourMultiplier = (hour: number): number => {
  // Peak hours: 10-12, 14-16, 19-22
  if ((hour >= 10 && hour <= 12) || (hour >= 14 && hour <= 16) || (hour >= 19 && hour <= 22)) {
    return 1.5;
  }
  // Low activity: 0-6
  if (hour >= 0 && hour <= 6) {
    return 0.3;
  }
  // Normal hours
  return 1.0;
};

export function useHomeMetrics() {
  return useQuery({
    queryKey: ['home-metrics'],
    queryFn: fetchRealHomeMetrics,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useHourlyMetrics(accountName?: string | null) {
  return useQuery({
    queryKey: ['hourly-metrics', accountName],
    queryFn: () => fetchRealHourlyMetrics(accountName),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook to get available accounts for the dropdown
export function useAvailableAccounts() {
  return useQuery({
    queryKey: ['available-accounts'],
    queryFn: async (): Promise<string[]> => {
      // Mock accounts - in real implementation, this would fetch from the database
      return ['Adapta | Anunciante 1', 'Adapta | Anunciante 2', 'Adapta | Anunciante 3'];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}