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
  };
};

const generateMockHourlyMetrics = (): HourlyMetrics[] => {
  const data: HourlyMetrics[] = [];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  last7Days.forEach(date => {
    for (let hour = 0; hour < 24; hour++) {
      data.push({
        date_brt: date,
        hour_of_day: hour,
        spend_hour: Math.random() * 200 + 10,
        real_sales_hour: Math.floor(Math.random() * 10),
        impressions_hour: Math.floor(Math.random() * 5000 + 500),
        clicks_hour: Math.floor(Math.random() * 200 + 50),
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

export function useHourlyMetrics() {
  return useQuery({
    queryKey: ['hourly-metrics'],
    queryFn: async (): Promise<HourlyMetrics[]> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return generateMockHourlyMetrics();
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}