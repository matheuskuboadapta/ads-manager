import { useQuery } from '@tanstack/react-query';

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

// Generate mock data for demonstration
const generateMockHomeMetrics = (): HomeMetrics => {
  const todaySpend = Math.random() * 5000 + 1000;
  const previousDaySpend = Math.random() * 5000 + 1000;
  const todaySales = Math.floor(Math.random() * 50 + 10);
  const previousDaySales = Math.floor(Math.random() * 50 + 10);
  
  // Generate last 7 days data for mini charts
  const last7DaysSpend = Array.from({ length: 7 }, () => Math.random() * 5000 + 1000);
  const last7DaysSales = Array.from({ length: 7 }, () => Math.floor(Math.random() * 50 + 10));
  const last7DaysRevenue = last7DaysSales.map(sales => sales * (Math.random() * 100 + 50));
  const last7DaysImpressions = Array.from({ length: 7 }, () => Math.floor(Math.random() * 100000 + 50000));
  const last7DaysClicks = Array.from({ length: 7 }, () => Math.floor(Math.random() * 5000 + 1000));
  const last7DaysCPA = last7DaysSpend.map((spend, i) => spend / last7DaysSales[i]);
  
  return {
    todaySpend,
    todaySales,
    todayRevenue: todaySales * (Math.random() * 100 + 50),
    todayImpressions: Math.floor(Math.random() * 100000 + 50000),
    todayClicks: Math.floor(Math.random() * 5000 + 1000),
    todayCPA: todaySpend / todaySales,
    previousDaySpend,
    previousDaySales,
    previousDayRevenue: previousDaySales * (Math.random() * 100 + 50),
    previousDayImpressions: Math.floor(Math.random() * 100000 + 50000),
    previousDayClicks: Math.floor(Math.random() * 5000 + 1000),
    previousDayCPA: previousDaySpend / previousDaySales,
    last7DaysSpend,
    last7DaysSales,
    last7DaysRevenue,
    last7DaysImpressions,
    last7DaysClicks,
    last7DaysCPA,
  };
};

const generateMockHourlyMetrics = (accountName?: string | null): HourlyMetrics[] => {
  const data: HourlyMetrics[] = [];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    // Force timezone to Brazil (GMT-3) to ensure correct date calculation
    const now = new Date();
    const brasilOffset = -3 * 60; // GMT-3 in minutes
    const localOffset = now.getTimezoneOffset();
    const brasilTime = new Date(now.getTime() + (localOffset - brasilOffset) * 60 * 1000);
    
    const date = new Date(brasilTime);
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  // Mock accounts
  const accounts = ['Adapta | Anunciante 1', 'Adapta | Anunciante 2', 'Adapta | Anunciante 3'];
  const selectedAccounts = accountName ? [accountName] : accounts;

  last7Days.forEach(date => {
    for (let hour = 0; hour < 24; hour++) {
      let aggregatedSpend = 0;
      let aggregatedSales = 0;
      let aggregatedImpressions = 0;
      let aggregatedClicks = 0;

      // Generate data for each account and aggregate
      selectedAccounts.forEach(() => {
        aggregatedSpend += Math.random() * 200 + 10;
        aggregatedSales += Math.floor(Math.random() * 10);
        aggregatedImpressions += Math.floor(Math.random() * 5000 + 500);
        aggregatedClicks += Math.floor(Math.random() * 200 + 50);
      });

      data.push({
        date_brt: date,
        hour_of_day: hour,
        spend_hour: aggregatedSpend,
        real_sales_hour: aggregatedSales,
        impressions_hour: aggregatedImpressions,
        clicks_hour: aggregatedClicks,
      });
    }
  });

  return data;
};

export function useHomeMetrics() {
  return useQuery({
    queryKey: ['home-metrics'],
    queryFn: async (): Promise<HomeMetrics> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return generateMockHomeMetrics();
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

export function useHourlyMetrics(accountName?: string | null) {
  return useQuery({
    queryKey: ['hourly-metrics', accountName],
    queryFn: async (): Promise<HourlyMetrics[]> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return generateMockHourlyMetrics(accountName);
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
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