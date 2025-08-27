import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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
  
  // Use current local time directly since we're already in GMT-3
  const now = new Date();
  
  // Helper function to get local date string without timezone conversion
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Create dates using local date methods to avoid timezone conversion issues
  const todayStr = getLocalDateString(now);
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(now.getDate() - 2);
  const threeDaysAgoStr = getLocalDateString(threeDaysAgo);
  
  const dateRangeStart = new Date(now);
  dateRangeStart.setDate(now.getDate() - (dateRange - 1));
  const dateRangeStartStr = getLocalDateString(dateRangeStart);

  console.log('Date filters:', {
    today: todayStr,
    threeDaysAgo: threeDaysAgoStr,
    dateRangeStart: dateRangeStartStr
  });

  // Fetch data from the period we need
  // For the end date, we need to include the entire day, so we use the next day as the upper limit
  const nextDay = new Date(todayStr);
  nextDay.setDate(nextDay.getDate() + 1);
  const upperLimit = getLocalDateString(nextDay);
  
  console.log('Query parameters:', { dateRangeStartStr, todayStr, upperLimit });
  
  const { data: rawData, error } = await supabase
    .from('meta_ads_view')
    .select('*')
    .gte('date_start', dateRangeStartStr)
    .lt('date_start', upperLimit)
    .order('date_start', { ascending: true });

  console.log('Raw optimization data fetched:', rawData?.length, 'records');
  console.log('Sample data:', rawData?.slice(0, 2));

  if (error) {
    console.error('Error fetching optimization data:', error);
    throw error;
  }

  if (!rawData || rawData.length === 0) {
    console.log('No data found for optimization in date range');
    return {
      today: [],
      last3Days: [],
      main: [],
    };
  }

  // Helper function to process data by grouping key
  const processDataByGroup = (data: any[], groupBy: string, dateFilter?: (date: string) => boolean) => {
    const grouped = new Map();
    
    console.log(`Processing ${groupBy} data with ${data.length} records`);
    
    data.forEach(row => {
      if (!row.date_start) {
        return;
      }
      
      if (dateFilter && !dateFilter(row.date_start)) {
        return;
      }
      
      const key = groupBy === 'campaigns' ? row.campaign_name : 
                 groupBy === 'adsets' ? row.adset_name : 
                 row.ad_name;
      
      if (!key) {
        return;
      }
      
      const existing = grouped.get(key) || {
        name: key,
        status: groupBy === 'campaigns' ? row.campaign_status_final : 
               groupBy === 'adsets' ? row.adset_status_final : 
               row.ad_status_final,
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
      
      // For budget, use daily_budget from the view
      if (row.daily_budget && row.daily_budget > existing.budget) {
        existing.budget = row.daily_budget;
      }
      
      grouped.set(key, existing);
    });

    // Convert to array and calculate derived metrics
    const result = Array.from(grouped.values()).map(item => ({
      ...item,
      cpa: item.sales > 0 ? item.spend / item.sales : 0,
      ctr: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0,
      cpc: item.clicks > 0 ? item.spend / item.clicks : 0,
      cpm: item.impressions > 0 ? (item.spend / item.impressions) * 1000 : 0,
      profit: item.revenue - item.spend,
      roas: item.spend > 0 ? (item.revenue / item.spend) * 100 : 0,
    }));
    
    console.log(`Processed ${groupBy}:`, result.length, 'items');
    return result;
  };

  // Get today's data
  console.log('Getting today data for date:', todayStr);
  const todayData = processDataByGroup(rawData, type, (date) => {
    const isToday = date === todayStr;
    console.log('Today filter:', date, '===', todayStr, '?', isToday);
    return isToday;
  });
  
  // Get last 3 days data
  console.log('Getting last 3 days data from:', threeDaysAgoStr, 'to:', todayStr);
  const last3DaysData = processDataByGroup(rawData, type, (date) => {
    const isInRange = date >= threeDaysAgoStr && date <= todayStr;
    console.log('3 days filter:', date, 'in range [', threeDaysAgoStr, '-', todayStr, ']?', isInRange);
    return isInRange;
  });
  
  // Get main period data (already filtered by the query)
  console.log('Getting main period data (all fetched data)');
  const mainData = processDataByGroup(rawData, type);

  const result = {
    today: todayData,
    last3Days: last3DaysData,
    main: mainData,
  };

  console.log('Final optimization data result:', {
    type,
    todayCount: todayData.length,
    last3DaysCount: last3DaysData.length,
    mainCount: mainData.length,
  });

  return result;
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