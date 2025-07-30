import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useAccountsData } from '@/hooks/useAdsData';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { useMemo, useState, useEffect } from 'react';
import React from 'react';

interface HomeMetrics {
  todaySpend: number;
  todaySales: number;
  todayProfit: number;
  todayCTR: number;
  todayCPM: number;
  todayCPA: number;
  previousDaySpend: number;
  previousDaySales: number;
  previousDayProfit: number;
  previousDayCTR: number;
  previousDayCPM: number;
  previousDayCPA: number;
  // Last 7 days data for mini charts
  last7DaysSpend: number[];
  last7DaysSales: number[];
  last7DaysProfit: number[];
  last7DaysCTR: number[];
  last7DaysCPM: number[];
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

// Create a custom hook that uses the same logic as AccountsTab
export function useHomeMetrics() {
  const { settings } = useGlobalSettings();
  
  // Use the same date filter logic as AccountsTab - NO substitutions
  const todayFilter = useMemo(() => {
    // Use current local time directly since we're already in GMT-3
    const now = new Date();
    
    // Create date using YYYY-MM-DD format to avoid timezone issues
    const todayStr = now.toISOString().split('T')[0];
    const today = new Date(todayStr + 'T00:00:00');
    const todayEnd = new Date(todayStr + 'T00:00:00');
    
    const filter = {
      from: today,
      to: todayEnd,
      label: 'Hoje'
    };
    
    console.log('=== TODAY FILTER DEBUG ===');
    console.log('Current time (local):', now.toISOString());
    console.log('Current time (local):', now.toString());
    console.log('Today filter created:', {
      from: filter.from.toISOString(),
      to: filter.to.toISOString(),
      fromDate: filter.from.toISOString().split('T')[0],
      toDate: filter.to.toISOString().split('T')[0],
      label: filter.label
    });
    console.log('=== END TODAY FILTER DEBUG ===');
    
    return filter;
  }, []);

  const yesterdayFilter = useMemo(() => {
    // Use current local time directly since we're already in GMT-3
    const now = new Date();
    
    // Create yesterday date using YYYY-MM-DD format to avoid timezone issues
    const yesterdayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString().split('T')[0];
    const yesterday = new Date(yesterdayStr + 'T00:00:00');
    const yesterdayEnd = new Date(yesterdayStr + 'T00:00:00');
    
    const filter = {
      from: yesterday,
      to: yesterdayEnd,
      label: 'Ontem'
    };
    
    console.log('=== YESTERDAY FILTER DEBUG ===');
    console.log('Yesterday filter created:', {
      from: filter.from.toISOString(),
      to: filter.to.toISOString(),
      fromDate: filter.from.toISOString().split('T')[0],
      toDate: filter.to.toISOString().split('T')[0],
      label: filter.label
    });
    console.log('=== END YESTERDAY FILTER DEBUG ===');
    
    return filter;
  }, []);

  // Use the same data fetching logic as AccountsTab - NO substitutions
  const { data: todayAccounts, isLoading: todayLoading } = useAccountsData(todayFilter);
  const { data: yesterdayAccounts, isLoading: yesterdayLoading } = useAccountsData(yesterdayFilter);



  // Debug: Log the raw data being processed
  console.log('Raw data comparison:', {
    todayAccountsCount: todayAccounts?.length || 0,
    yesterdayAccountsCount: yesterdayAccounts?.length || 0,
    todayAccounts: todayAccounts?.map(acc => ({ name: acc.name, spend: acc.spend, sales: acc.sales })),
    yesterdayAccounts: yesterdayAccounts?.map(acc => ({ name: acc.name, spend: acc.spend, sales: acc.sales }))
  });

  // Debug: Verify that we're not double-counting accounts
  if (yesterdayAccounts) {
    const accountNames = yesterdayAccounts.map(acc => acc.name);
    const uniqueAccountNames = new Set(accountNames);
    
    if (accountNames.length !== uniqueAccountNames.size) {
      console.error('ERROR: Duplicate accounts found in yesterday data!', {
        totalAccounts: accountNames.length,
        uniqueAccounts: uniqueAccountNames.size,
        duplicates: accountNames.filter((name, index) => accountNames.indexOf(name) !== index)
      });
    }
  }

  // Enhanced debug: Compare today vs yesterday data
  console.log('=== TODAY vs YESTERDAY COMPARISON ===');
  if (todayAccounts && yesterdayAccounts) {
    const todayTotalSpend = todayAccounts.reduce((sum, acc) => sum + acc.spend, 0);
    const yesterdayTotalSpend = yesterdayAccounts.reduce((sum, acc) => sum + acc.spend, 0);
    
    console.log('Total spend comparison:', {
      today: todayTotalSpend,
      yesterday: yesterdayTotalSpend,
      difference: yesterdayTotalSpend - todayTotalSpend,
      percentageDiff: todayTotalSpend > 0 ? ((yesterdayTotalSpend - todayTotalSpend) / todayTotalSpend) * 100 : 0
    });
    
    // Check if yesterday values are reasonable (should not be more than 3x today's values)
    if (yesterdayTotalSpend > todayTotalSpend * 3) {
      console.error('ERROR: Yesterday spend is unreasonably high compared to today!', {
        today: todayTotalSpend,
        yesterday: yesterdayTotalSpend,
        ratio: yesterdayTotalSpend / todayTotalSpend
      });
      
      // Log individual account details for debugging
      console.log('Individual account spend details:');
      yesterdayAccounts.forEach(acc => {
        console.log(`${acc.name}: ${acc.spend}`);
      });
    }
    
    // Compare individual accounts
    const todayAccountMap = new Map(todayAccounts.map(acc => [acc.name, acc]));
    const yesterdayAccountMap = new Map(yesterdayAccounts.map(acc => [acc.name, acc]));
    
    const allAccountNames = new Set([
      ...todayAccounts.map(acc => acc.name),
      ...yesterdayAccounts.map(acc => acc.name)
    ]);
    
    console.log('Individual account comparison:');
    allAccountNames.forEach(accountName => {
      const todayAccount = todayAccountMap.get(accountName);
      const yesterdayAccount = yesterdayAccountMap.get(accountName);
      
      if (todayAccount && yesterdayAccount) {
        const spendDiff = yesterdayAccount.spend - todayAccount.spend;
        console.log(`${accountName}:`, {
          today: todayAccount.spend,
          yesterday: yesterdayAccount.spend,
          difference: spendDiff,
          percentageDiff: todayAccount.spend > 0 ? (spendDiff / todayAccount.spend) * 100 : 0
        });
      } else if (todayAccount && !yesterdayAccount) {
        console.log(`${accountName}: Only present today (spend: ${todayAccount.spend})`);
      } else if (!todayAccount && yesterdayAccount) {
        console.log(`${accountName}: Only present yesterday (spend: ${yesterdayAccount.spend})`);
      }
    });
    
    // Check if the values make sense
    if (yesterdayTotalSpend > todayTotalSpend * 1.5) {
      console.warn('WARNING: Yesterday spend is significantly higher than today!', {
        today: todayTotalSpend,
        yesterday: yesterdayTotalSpend,
        ratio: yesterdayTotalSpend / todayTotalSpend
      });
    }
  }
  console.log('=== END TODAY vs YESTERDAY COMPARISON ===');

  // Debug: Check if there are any accounts with unusually high spend
  if (yesterdayAccounts && yesterdayAccounts.length > 0) {
    const highSpendAccounts = yesterdayAccounts.filter(acc => acc.spend > 10000);
    if (highSpendAccounts.length > 0) {
      console.warn('Found accounts with unusually high spend yesterday:', highSpendAccounts.map(acc => ({ name: acc.name, spend: acc.spend })));
    }
  }

  // Debug: Check if there are any accounts with unusually high spend today
  if (todayAccounts && todayAccounts.length > 0) {
    const highSpendAccounts = todayAccounts.filter(acc => acc.spend > 10000);
    if (highSpendAccounts.length > 0) {
      console.warn('Found accounts with unusually high spend today:', highSpendAccounts.map(acc => ({ name: acc.name, spend: acc.spend })));
    }
  }

  // Calculate metrics using the same logic as AccountsTab summaryMetrics
  const todayMetrics = useMemo(() => {
    if (!todayAccounts || todayAccounts.length === 0) {
      console.log('No today accounts data available');
      return {
        spend: 0,
        sales: 0,
        profit: 0,
        ctr: 0,
        cpm: 0,
        cpa: 0,
      };
    }

    console.log('Calculating today metrics with', todayAccounts.length, 'accounts');
    console.log('Today accounts data:', todayAccounts.map(acc => ({ name: acc.name, spend: acc.spend, sales: acc.sales })));

    // Ensure we're not double-counting by using unique account data
    const uniqueAccounts = new Map<string, any>();
    todayAccounts.forEach(acc => {
      if (!uniqueAccounts.has(acc.name)) {
        uniqueAccounts.set(acc.name, acc);
      } else {
        console.warn('Duplicate account found in today data:', acc.name);
      }
    });

    const uniqueAccountsArray = Array.from(uniqueAccounts.values());
    console.log('Unique today accounts:', uniqueAccountsArray.length);

    const totalSpend = uniqueAccountsArray.reduce((sum, acc) => sum + acc.spend, 0);
    const totalProfit = uniqueAccountsArray.reduce((sum, acc) => sum + acc.profit, 0);
    const totalSales = uniqueAccountsArray.reduce((sum, acc) => sum + acc.sales, 0);
    const totalClicks = uniqueAccountsArray.reduce((sum, acc) => sum + acc.clicks, 0);
    const totalImpressions = uniqueAccountsArray.reduce((sum, acc) => sum + acc.impressions, 0);

    // Calculate CTR and CPM using the same logic as useAccountsData
    const totalCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const totalCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

    const result = {
      spend: totalSpend,
      sales: totalSales,
      profit: totalProfit,
      ctr: totalCTR,
      cpm: totalCPM,
      cpa: totalSales > 0 ? totalSpend / totalSales : 0,
    };

    console.log('Today metrics calculated:', result);
    console.log('Today metrics breakdown:', {
      totalSpend,
      totalSales,
      totalProfit,
      totalClicks,
      totalImpressions,
      totalCTR,
      totalCPM,
      cpa: totalSales > 0 ? totalSpend / totalSales : 0
    });
    return result;
  }, [todayAccounts]);

  const yesterdayMetrics = useMemo(() => {
    if (!yesterdayAccounts || yesterdayAccounts.length === 0) {
      console.log('No yesterday accounts data available');
      return {
        spend: 0,
        sales: 0,
        profit: 0,
        ctr: 0,
        cpm: 0,
        cpa: 0,
      };
    }

    console.log('Calculating yesterday metrics with', yesterdayAccounts.length, 'accounts');
    console.log('Yesterday accounts data:', yesterdayAccounts.map(acc => ({ name: acc.name, spend: acc.spend, sales: acc.sales })));

    // Ensure we're not double-counting by using unique account data
    const uniqueAccounts = new Map<string, any>();
    yesterdayAccounts.forEach(acc => {
      if (!uniqueAccounts.has(acc.name)) {
        uniqueAccounts.set(acc.name, acc);
      } else {
        console.warn('Duplicate account found in yesterday data:', acc.name);
      }
    });

    const uniqueAccountsArray = Array.from(uniqueAccounts.values());
    console.log('Unique yesterday accounts:', uniqueAccountsArray.length);

    const totalSpend = uniqueAccountsArray.reduce((sum, acc) => sum + acc.spend, 0);
    const totalProfit = uniqueAccountsArray.reduce((sum, acc) => sum + acc.profit, 0);
    const totalSales = uniqueAccountsArray.reduce((sum, acc) => sum + acc.sales, 0);
    const totalClicks = uniqueAccountsArray.reduce((sum, acc) => sum + acc.clicks, 0);
    const totalImpressions = uniqueAccountsArray.reduce((sum, acc) => sum + acc.impressions, 0);

    // Calculate CTR and CPM using the same logic as useAccountsData
    const totalCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const totalCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

    const result = {
      spend: totalSpend,
      sales: totalSales,
      profit: totalProfit,
      ctr: totalCTR,
      cpm: totalCPM,
      cpa: totalSales > 0 ? totalSpend / totalSales : 0,
    };

    console.log('Yesterday metrics calculated:', result);
    console.log('Yesterday metrics breakdown:', {
      totalSpend,
      totalSales,
      totalProfit,
      totalClicks,
      totalImpressions,
      totalCTR,
      totalCPM,
      cpa: totalSales > 0 ? totalSpend / totalSales : 0
    });
    return result;
  }, [yesterdayAccounts]);

  // Generate date filters for last 7 days using the same logic as FilterBar
  const last7DaysFilters = useMemo(() => {
    // Use current local time directly since we're already in GMT-3
    const now = new Date();
    
    return Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
      const dayStr = dayDate.toISOString().split('T')[0];
      const dayStart = new Date(dayStr + 'T00:00:00');
      const dayEnd = new Date(dayStr + 'T00:00:00');
      
      return {
        from: dayStart,
        to: dayEnd,
        label: format(dayDate, 'dd/MM')
      };
    });
  }, []);

  // Use useAccountsData for each day (same logic as Scorecard)
  const day0Data = useAccountsData(last7DaysFilters[0]);
  const day1Data = useAccountsData(last7DaysFilters[1]);
  const day2Data = useAccountsData(last7DaysFilters[2]);
  const day3Data = useAccountsData(last7DaysFilters[3]);
  const day4Data = useAccountsData(last7DaysFilters[4]);
  const day5Data = useAccountsData(last7DaysFilters[5]);
  const day6Data = useAccountsData(last7DaysFilters[6]);

  // Process last 7 days data using the same logic as Scorecard
  const last7DaysMetrics = useMemo(() => {
    const allDaysData = [
      day0Data.data,
      day1Data.data,
      day2Data.data,
      day3Data.data,
      day4Data.data,
      day5Data.data,
      day6Data.data
    ];

    const spend = allDaysData.map(dayAccounts => {
      if (!dayAccounts || dayAccounts.length === 0) return 0;
      return dayAccounts.reduce((sum, acc) => sum + acc.spend, 0);
    });

    const sales = allDaysData.map(dayAccounts => {
      if (!dayAccounts || dayAccounts.length === 0) return 0;
      return dayAccounts.reduce((sum, acc) => sum + acc.sales, 0);
    });

    const profit = allDaysData.map(dayAccounts => {
      if (!dayAccounts || dayAccounts.length === 0) return 0;
      return dayAccounts.reduce((sum, acc) => sum + acc.profit, 0);
    });

    const clicks = allDaysData.map(dayAccounts => {
      if (!dayAccounts || dayAccounts.length === 0) return 0;
      return dayAccounts.reduce((sum, acc) => sum + acc.clicks, 0);
    });

    const impressions = allDaysData.map(dayAccounts => {
      if (!dayAccounts || dayAccounts.length === 0) return 0;
      return dayAccounts.reduce((sum, acc) => sum + acc.impressions, 0);
    });

    // Calculate CTR and CPM for each day using the same logic as useAccountsData
    const ctr = clicks.map((clicksVal, i) => {
      const impressionsVal = impressions[i];
      return impressionsVal > 0 ? (clicksVal / impressionsVal) * 100 : 0;
    });

    const cpm = spend.map((spendVal, i) => {
      const impressionsVal = impressions[i];
      return impressionsVal > 0 ? (spendVal / impressionsVal) * 1000 : 0;
    });

    const cpa = spend.map((spendVal, i) => {
      const salesVal = sales[i];
      return salesVal > 0 ? spendVal / salesVal : 0;
    });

    return { spend, sales, profit, ctr, cpm, cpa };
  }, [day0Data.data, day1Data.data, day2Data.data, day3Data.data, day4Data.data, day5Data.data, day6Data.data]);

  const isLoading = todayLoading || yesterdayLoading || day0Data.isLoading || day1Data.isLoading || day2Data.isLoading || day3Data.isLoading || day4Data.isLoading || day5Data.isLoading || day6Data.isLoading;

      const result: HomeMetrics = {
      todaySpend: todayMetrics.spend,
      todaySales: todayMetrics.sales,
      todayProfit: todayMetrics.profit,
      todayCTR: todayMetrics.ctr,
      todayCPM: todayMetrics.cpm,
      todayCPA: todayMetrics.cpa,
      
      previousDaySpend: yesterdayMetrics.spend,
      previousDaySales: yesterdayMetrics.sales,
      previousDayProfit: yesterdayMetrics.profit,
      previousDayCTR: yesterdayMetrics.ctr,
      previousDayCPM: yesterdayMetrics.cpm,
      previousDayCPA: yesterdayMetrics.cpa,
      
      last7DaysSpend: last7DaysMetrics.spend,
      last7DaysSales: last7DaysMetrics.sales,
      last7DaysProfit: last7DaysMetrics.profit,
      last7DaysCTR: last7DaysMetrics.ctr,
      last7DaysCPM: last7DaysMetrics.cpm,
      last7DaysCPA: last7DaysMetrics.cpa,
    };

  return { data: result, isLoading };
}

const fetchRealHourlyMetrics = async (accountName?: string | null): Promise<HourlyMetrics[]> => {
  console.log('Fetching real hourly metrics from meta_ads_account_hourly_view for account:', accountName);
  
  // Use current local time directly since we're already in GMT-3
  const now = new Date();
  
  // Create dates using YYYY-MM-DD format to avoid timezone issues
  const todayStr = now.toISOString().split('T')[0];
  const sevenDaysAgoStr = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString().split('T')[0];
  
  // For the end date, we need to include the entire day, so we use the next day as the upper limit
  const nextDay = new Date(todayStr);
  nextDay.setDate(nextDay.getDate() + 1);
  const upperLimit = nextDay.toISOString().split('T')[0];

  console.log('Hourly metrics date range:', { sevenDaysAgo: sevenDaysAgoStr, today: todayStr, upperLimit });

  // Fetch from meta_ads_account_hourly_view
  let query = supabase
    .from('meta_ads_account_hourly_view')
    .select('*')
    .gte('date_brt', sevenDaysAgoStr)
    .lt('date_brt', upperLimit)
    .order('date_brt', { ascending: true })
    .order('hour_of_day', { ascending: true });

  // Filter by account if specified
  if (accountName) {
    query = query.eq('account_name', accountName);
  }

  const { data: hourlyData, error } = await query;

  if (error) {
    console.error('Error fetching hourly metrics from meta_ads_account_hourly_view:', error);
    throw error;
  }

  console.log('Successfully fetched data from meta_ads_account_hourly_view:', hourlyData?.length, 'records');

  if (!hourlyData || hourlyData.length === 0) {
    console.log('No hourly data found in meta_ads_account_hourly_view');
    return [];
  }

  // Debug: Show sample of raw data
  console.log('Sample raw data:', hourlyData.slice(0, 5));

  // Aggregate data by date and hour to handle multiple records for the same day/hour
  const aggregatedMap = new Map<string, HourlyMetrics>();
  
  hourlyData.forEach((row, index) => {
    if (!row.date_brt || row.hour_of_day === null) {
      console.log(`Skipping row ${index} - missing date_brt or hour_of_day:`, row);
      return;
    }
    
    const key = `${row.date_brt}-${row.hour_of_day}`;
    const spendHour = Number(row.spend_hour) || 0;
    const salesHour = Number(row.real_sales_hour) || 0;
    const impressionsHour = Number(row.impressions_hour) || 0;
    const clicksHour = Number(row.clicks_hour) || 0;
    
    if (aggregatedMap.has(key)) {
      // Aggregate with existing data
      const existing = aggregatedMap.get(key)!;
      existing.spend_hour += spendHour;
      existing.real_sales_hour += salesHour;
      existing.impressions_hour += impressionsHour;
      existing.clicks_hour += clicksHour;
      
      console.log(`Aggregating ${key}: spend ${spendHour} -> total ${existing.spend_hour}`);
    } else {
      // Create new entry
      aggregatedMap.set(key, {
        date_brt: row.date_brt,
        hour_of_day: row.hour_of_day,
        spend_hour: spendHour,
        real_sales_hour: salesHour,
        impressions_hour: impressionsHour,
        clicks_hour: clicksHour,
      });
      
      console.log(`Creating new entry ${key}: spend ${spendHour}`);
    }
  });

  // Convert map to array and sort by date and hour
  const result = Array.from(aggregatedMap.values()).sort((a, b) => {
    if (a.date_brt !== b.date_brt) {
      return a.date_brt.localeCompare(b.date_brt);
    }
    return a.hour_of_day - b.hour_of_day;
  });

  // Debug: Calculate totals by date
  const totalsByDate = new Map<string, number>();
  result.forEach(item => {
    const existing = totalsByDate.get(item.date_brt) || 0;
    totalsByDate.set(item.date_brt, existing + item.spend_hour);
  });
  
  console.log('Totals by date:', Object.fromEntries(totalsByDate));
  console.log('Aggregated hourly metrics:', result.length, 'records');
  console.log('Sample aggregated data:', result.slice(0, 3));
  
  return result;
};



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
      console.log('Fetching available accounts from meta_ads_account_hourly_view...');
      
      const { data, error } = await supabase
        .from('meta_ads_account_hourly_view')
        .select('account_name')
        .not('account_name', 'is', null);

      if (error) {
        console.error('Error fetching available accounts:', error);
        throw error;
      }

      // Get unique account names
      const uniqueAccounts = [...new Set(data?.map(row => row.account_name).filter(Boolean))];
      
      console.log('Available accounts found:', uniqueAccounts);
      return uniqueAccounts;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

