import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useAccountsData } from '@/hooks/useAdsData';
import { useMemo, useState, useEffect } from 'react';
import React from 'react';

interface HomeMetrics {
  todaySpend: number;
  todaySales: number;
  todayProfit: number;
  todayRevenue: number;
  todayROAS: number;
  todayCTR: number;
  todayCPM: number;
  todayCPA: number;
  previousDaySpend: number;
  previousDaySales: number;
  previousDayProfit: number;
  previousDayRevenue: number;
  previousDayROAS: number;
  previousDayCTR: number;
  previousDayCPM: number;
  previousDayCPA: number;
  // Last 7 days data for mini charts
  last7DaysSpend: number[];
  last7DaysSales: number[];
  last7DaysProfit: number[];
  last7DaysRevenue: number[];
  last7DaysROAS: number[];
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
export function useHomeMetrics(selectedAccount?: string | null) {
  
  // Use the same date filter logic as AccountsTab - NO substitutions
  const todayFilter = useMemo(() => {
    // Use current local time directly since we're already in GMT-3
    const now = new Date();
    
    // Create date using local date methods to avoid timezone conversion issues
    const todayStr = now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0');
    
    // Use the same logic as FilterBar: both from and to use T00:00:00
    // This ensures consistency with how useAdsData processes the filters
    const today = new Date(todayStr + 'T00:00:00');
    const todayEnd = new Date(todayStr + 'T00:00:00');
    
    const filter = {
      from: today,
      to: todayEnd,
      label: 'Hoje'
    };
    
    return filter;
  }, []);

  const yesterdayFilter = useMemo(() => {
    // Use current local time directly since we're already in GMT-3
    const now = new Date();
    
    // Create yesterday date using local date methods to avoid timezone conversion issues
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.getFullYear() + '-' + 
      String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + 
      String(yesterday.getDate()).padStart(2, '0');
    
    // Use the same logic as FilterBar: both from and to use T00:00:00
    // This ensures consistency with how useAdsData processes the filters
    const yesterdayDate = new Date(yesterdayStr + 'T00:00:00');
    const yesterdayEnd = new Date(yesterdayStr + 'T00:00:00');
    
    const filter = {
      from: yesterdayDate,
      to: yesterdayEnd,
      label: 'Ontem'
    };
    
    return filter;
  }, []);

  // Use the same data fetching logic as AccountsTab - NO substitutions
  const { data: todayAccounts, isLoading: todayLoading } = useAccountsData(todayFilter);
  const { data: yesterdayAccounts, isLoading: yesterdayLoading } = useAccountsData(yesterdayFilter);

  // Filter accounts by selected account if specified
  const filteredTodayAccounts = useMemo(() => {
    console.log('=== FILTERING TODAY ACCOUNTS DEBUG ===');
    console.log('selectedAccount:', selectedAccount);
    console.log('todayAccounts length:', todayAccounts?.length || 0);
    console.log('todayAccounts sample:', todayAccounts?.slice(0, 2).map(acc => ({ name: acc.name, spend: acc.spend })));
    
    if (!selectedAccount || !todayAccounts) {
      console.log('No filtering applied - returning all accounts');
      return todayAccounts;
    }
    
    const filtered = todayAccounts.filter(account => account.name === selectedAccount);
    console.log('Filtered accounts length:', filtered.length);
    console.log('Filtered accounts:', filtered.map(acc => ({ name: acc.name, spend: acc.spend })));
    console.log('=== END FILTERING TODAY ACCOUNTS DEBUG ===');
    
    return filtered;
  }, [todayAccounts, selectedAccount]);

  const filteredYesterdayAccounts = useMemo(() => {
    console.log('=== FILTERING YESTERDAY ACCOUNTS DEBUG ===');
    console.log('selectedAccount:', selectedAccount);
    console.log('yesterdayAccounts length:', yesterdayAccounts?.length || 0);
    console.log('yesterdayAccounts sample:', yesterdayAccounts?.slice(0, 2).map(acc => ({ name: acc.name, spend: acc.spend })));
    
    if (!selectedAccount || !yesterdayAccounts) {
      console.log('No filtering applied - returning all accounts');
      return yesterdayAccounts;
    }
    
    const filtered = yesterdayAccounts.filter(account => account.name === selectedAccount);
    console.log('Filtered accounts length:', filtered.length);
    console.log('Filtered accounts:', filtered.map(acc => ({ name: acc.name, spend: acc.spend })));
    console.log('=== END FILTERING YESTERDAY ACCOUNTS DEBUG ===');
    
    return filtered;
  }, [yesterdayAccounts, selectedAccount]);










  // Calculate metrics using the same logic as AccountsTab summaryMetrics
  const todayMetrics = useMemo(() => {
    if (!filteredTodayAccounts || filteredTodayAccounts.length === 0) {
      console.log('No today accounts data available');
      return {
        spend: 0,
        sales: 0,
        profit: 0,
        revenue: 0,
        roas: 0,
        ctr: 0,
        cpm: 0,
        cpa: 0,
      };
    }

    // Use all accounts data directly without deduplication
    // This matches the logic used in AccountsTab
    const totalSpend = filteredTodayAccounts.reduce((sum, acc) => sum + acc.spend, 0);
    const totalProfit = filteredTodayAccounts.reduce((sum, acc) => sum + acc.profit, 0);
    const totalSales = filteredTodayAccounts.reduce((sum, acc) => sum + acc.sales, 0);
    const totalRevenue = filteredTodayAccounts.reduce((sum, acc) => sum + acc.revenue, 0);
    const totalClicks = filteredTodayAccounts.reduce((sum, acc) => sum + acc.clicks, 0);
    const totalImpressions = filteredTodayAccounts.reduce((sum, acc) => sum + acc.impressions, 0);

    // Calculate CTR and CPM using the same logic as useAccountsData
    // Use the same calculation as in useAdsData for consistency
    const totalCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const totalCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
    const totalROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    const result = {
      spend: totalSpend,
      sales: totalSales,
      profit: totalProfit,
      revenue: totalRevenue,
      roas: totalROAS,
      ctr: totalCTR,
      cpm: totalCPM,
      cpa: totalSales > 0 ? totalSpend / totalSales : 0,
    };

    // Debug: Log today metrics
    console.log('=== TODAY METRICS DEBUG ===');
    console.log('Today filter:', todayFilter);
    console.log('Filtered accounts:', filteredTodayAccounts.length);
    console.log('Today metrics calculated:', result);
    console.log('Today metrics breakdown:', {
      totalSpend,
      totalSales,
      totalProfit,
      totalRevenue,
      totalROAS,
      totalClicks,
      totalImpressions,
      totalCTR,
      totalCPM,
      cpa: totalSales > 0 ? totalSpend / totalSales : 0
    });
    
    // Debug: Log detailed breakdown for today
    console.log('Today detailed breakdown:', {
      accounts: filteredTodayAccounts.map(acc => ({
        name: acc.name,
        spend: acc.spend,
        sales: acc.sales,
        clicks: acc.clicks,
        impressions: acc.impressions,
        ctr: acc.impressions > 0 ? (acc.clicks / acc.impressions) * 100 : 0,
        cpm: acc.impressions > 0 ? (acc.spend / acc.impressions) * 1000 : 0,
        cpa: acc.sales > 0 ? acc.spend / acc.sales : 0
      }))
    });
    console.log('=== END TODAY METRICS DEBUG ===');

    return result;
  }, [filteredTodayAccounts, todayFilter]);

  const yesterdayMetrics = useMemo(() => {
    if (!filteredYesterdayAccounts || filteredYesterdayAccounts.length === 0) {
      console.log('No yesterday accounts data available');
      return {
        spend: 0,
        sales: 0,
        profit: 0,
        revenue: 0,
        roas: 0,
        ctr: 0,
        cpm: 0,
        cpa: 0,
      };
    }

    // Use all accounts data directly without deduplication
    // This matches the logic used in AccountsTab
    const totalSpend = filteredYesterdayAccounts.reduce((sum, acc) => sum + acc.spend, 0);
    const totalProfit = filteredYesterdayAccounts.reduce((sum, acc) => sum + acc.profit, 0);
    const totalSales = filteredYesterdayAccounts.reduce((sum, acc) => sum + acc.sales, 0);
    const totalRevenue = filteredYesterdayAccounts.reduce((sum, acc) => sum + acc.revenue, 0);
    const totalClicks = filteredYesterdayAccounts.reduce((sum, acc) => sum + acc.clicks, 0);
    const totalImpressions = filteredYesterdayAccounts.reduce((sum, acc) => sum + acc.impressions, 0);

    // Calculate CTR and CPM using the same logic as useAccountsData
    const totalCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const totalCPM = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
    const totalROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    const result = {
      spend: totalSpend,
      sales: totalSales,
      profit: totalProfit,
      revenue: totalRevenue,
      roas: totalROAS,
      ctr: totalCTR,
      cpm: totalCPM,
      cpa: totalSales > 0 ? totalSpend / totalSales : 0,
    };

    console.log('Yesterday metrics calculated:', result);
    console.log('Yesterday metrics breakdown:', {
      totalSpend,
      totalSales,
      totalProfit,
      totalRevenue,
      totalROAS,
      totalClicks,
      totalImpressions,
      totalCTR,
      totalCPM,
      cpa: totalSales > 0 ? totalSpend / totalSales : 0
    });
    
    // Debug: Log yesterday metrics
    console.log('=== YESTERDAY METRICS DEBUG ===');
    console.log('Yesterday filter:', yesterdayFilter);
    console.log('Filtered accounts:', filteredYesterdayAccounts.length);
    
    // Debug: Log detailed breakdown for yesterday
    console.log('Yesterday detailed breakdown:', {
      accounts: filteredYesterdayAccounts.map(acc => ({
        name: acc.name,
        spend: acc.spend,
        sales: acc.sales,
        clicks: acc.clicks,
        impressions: acc.impressions,
        ctr: acc.impressions > 0 ? (acc.clicks / acc.impressions) * 100 : 0,
        cpm: acc.impressions > 0 ? (acc.spend / acc.impressions) * 1000 : 0,
        cpa: acc.sales > 0 ? acc.spend / acc.sales : 0
      }))
    });
    console.log('=== END YESTERDAY METRICS DEBUG ===');
    
    return result;
  }, [filteredYesterdayAccounts, yesterdayFilter]);

  // Generate date filters for last 7 days using the same logic as FilterBar
  const last7DaysFilters = useMemo(() => {
    // Use current local time directly since we're already in GMT-3
    const now = new Date();
    
    const filters = Array.from({ length: 7 }, (_, i) => {
      const dayDate = new Date(now);
      dayDate.setDate(now.getDate() - (6 - i));
      const dayStr = dayDate.getFullYear() + '-' + 
        String(dayDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(dayDate.getDate()).padStart(2, '0');
      
      // Use the same logic as FilterBar: both from and to use T00:00:00
      // This ensures consistency with how useAdsData processes the filters
      const dayStart = new Date(dayStr + 'T00:00:00');
      const dayEnd = new Date(dayStr + 'T00:00:00');
      
      return {
        from: dayStart,
        to: dayEnd,
        label: format(dayDate, 'dd/MM')
      };
    });

    // Debug: Log the created filters
    console.log('=== LAST 7 DAYS FILTERS DEBUG ===');
    filters.forEach((filter, index) => {
      console.log(`Day ${index} filter:`, {
        label: filter.label,
        from: filter.from.toISOString(),
        to: filter.to.toISOString(),
        fromDate: filter.from.toISOString().split('T')[0],
        toDate: filter.to.toISOString().split('T')[0]
      });
    });
    console.log('=== END LAST 7 DAYS FILTERS DEBUG ===');

    return filters;
  }, []);

  // Use useAccountsData for each day (same logic as Scorecard)
  // Apply account filter to each day's data
  const day0Data = useAccountsData(last7DaysFilters[0]);
  const day1Data = useAccountsData(last7DaysFilters[1]);
  const day2Data = useAccountsData(last7DaysFilters[2]);
  const day3Data = useAccountsData(last7DaysFilters[3]);
  const day4Data = useAccountsData(last7DaysFilters[4]);
  const day5Data = useAccountsData(last7DaysFilters[5]);
  const day6Data = useAccountsData(last7DaysFilters[6]);

  // Filter each day's data by selected account if specified
  const filteredDay0Data = useMemo(() => {
    if (!selectedAccount || !day0Data.data) return day0Data.data;
    return day0Data.data.filter(account => account.name === selectedAccount);
  }, [day0Data.data, selectedAccount]);

  const filteredDay1Data = useMemo(() => {
    if (!selectedAccount || !day1Data.data) return day1Data.data;
    return day1Data.data.filter(account => account.name === selectedAccount);
  }, [day1Data.data, selectedAccount]);

  const filteredDay2Data = useMemo(() => {
    if (!selectedAccount || !day2Data.data) return day2Data.data;
    return day2Data.data.filter(account => account.name === selectedAccount);
  }, [day2Data.data, selectedAccount]);

  const filteredDay3Data = useMemo(() => {
    if (!selectedAccount || !day3Data.data) return day3Data.data;
    return day3Data.data.filter(account => account.name === selectedAccount);
  }, [day3Data.data, selectedAccount]);

  const filteredDay4Data = useMemo(() => {
    if (!selectedAccount || !day4Data.data) return day4Data.data;
    return day4Data.data.filter(account => account.name === selectedAccount);
  }, [day4Data.data, selectedAccount]);

  const filteredDay5Data = useMemo(() => {
    if (!selectedAccount || !day5Data.data) return day5Data.data;
    return day5Data.data.filter(account => account.name === selectedAccount);
  }, [day5Data.data, selectedAccount]);

  const filteredDay6Data = useMemo(() => {
    if (!selectedAccount || !day6Data.data) return day6Data.data;
    return day6Data.data.filter(account => account.name === selectedAccount);
  }, [day6Data.data, selectedAccount]);

  // Debug: Log account filtering for last 7 days
  console.log('=== LAST 7 DAYS ACCOUNT FILTERING DEBUG ===');
  console.log('selectedAccount:', selectedAccount);
  console.log('Day 0 (today):', {
    original: day0Data.data?.length || 0,
    filtered: filteredDay0Data?.length || 0,
    sample: filteredDay0Data?.slice(0, 2).map(acc => ({ name: acc.name, spend: acc.spend }))
  });
  console.log('Day 1 (yesterday):', {
    original: day1Data.data?.length || 0,
    filtered: filteredDay1Data?.length || 0,
    sample: filteredDay1Data?.slice(0, 2).map(acc => ({ name: acc.name, spend: acc.spend }))
  });
  console.log('Day 2:', {
    original: day2Data.data?.length || 0,
    filtered: filteredDay2Data?.length || 0,
    sample: filteredDay2Data?.slice(0, 2).map(acc => ({ name: acc.name, spend: acc.spend }))
  });
  console.log('Day 3:', {
    original: day3Data.data?.length || 0,
    filtered: filteredDay3Data?.length || 0,
    sample: filteredDay3Data?.slice(0, 2).map(acc => ({ name: acc.name, spend: acc.spend }))
  });
  console.log('Day 4:', {
    original: day4Data.data?.length || 0,
    filtered: filteredDay4Data?.length || 0,
    sample: filteredDay4Data?.slice(0, 2).map(acc => ({ name: acc.name, spend: acc.spend }))
  });
  console.log('Day 5:', {
    original: day5Data.data?.length || 0,
    filtered: filteredDay5Data?.length || 0,
    sample: filteredDay5Data?.slice(0, 2).map(acc => ({ name: acc.name, spend: acc.spend }))
  });
  console.log('Day 6:', {
    original: day6Data.data?.length || 0,
    filtered: filteredDay6Data?.length || 0,
    sample: filteredDay6Data?.slice(0, 2).map(acc => ({ name: acc.name, spend: acc.spend }))
  });
  console.log('=== END LAST 7 DAYS ACCOUNT FILTERING DEBUG ===');

  // Process last 7 days data using the same logic as Scorecard
  const last7DaysMetrics = useMemo(() => {
    const allDaysData = [
      filteredDay0Data,
      filteredDay1Data,
      filteredDay2Data,
      filteredDay3Data,
      filteredDay4Data,
      filteredDay5Data,
      filteredDay6Data
    ];

    // Debug: Log the data for each day
    console.log('=== LAST 7 DAYS METRICS DEBUG ===');
    allDaysData.forEach((dayData, index) => {
      const date = last7DaysFilters[index];
      const totalSpend = dayData?.reduce((sum, acc) => sum + acc.spend, 0) || 0;
      console.log(`Day ${index} (${date.label}):`, {
        date: date.from.toISOString().split('T')[0],
        accounts: dayData?.length || 0,
        totalSpend,
        sampleAccounts: dayData?.slice(0, 2).map(acc => ({ name: acc.name, spend: acc.spend }))
      });
    });

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

    const revenue = allDaysData.map(dayAccounts => {
      if (!dayAccounts || dayAccounts.length === 0) return 0;
      return dayAccounts.reduce((sum, acc) => sum + acc.revenue, 0);
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
    // Use the same calculation as in useAdsData for consistency
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

    const roas = spend.map((spendVal, i) => {
      const revenueVal = revenue[i];
      return spendVal > 0 ? revenueVal / spendVal : 0;
    });

    console.log('Last 7 days spend values:', spend);
    console.log('Last 7 days sales values:', sales);
    console.log('Last 7 days profit values:', profit);
    console.log('Last 7 days revenue values:', revenue);
    console.log('Last 7 days clicks values:', clicks);
    console.log('Last 7 days impressions values:', impressions);
    console.log('Last 7 days CTR values:', ctr);
    console.log('Last 7 days CPM values:', cpm);
    console.log('Last 7 days CPA values:', cpa);
    console.log('Last 7 days ROAS values:', roas);
    
    // Debug: Log detailed breakdown for each day
    console.log('=== DETAILED METRICS BREAKDOWN ===');
    allDaysData.forEach((dayData, index) => {
      const date = last7DaysFilters[index];
      const daySpend = spend[index];
      const daySales = sales[index];
      const dayClicks = clicks[index];
      const dayImpressions = impressions[index];
      const dayCTR = ctr[index];
      const dayCPM = cpm[index];
      const dayCPA = cpa[index];
      
      console.log(`Day ${index} (${date.label}) - ${date.from.toISOString().split('T')[0]}:`, {
        spend: daySpend,
        sales: daySales,
        clicks: dayClicks,
        impressions: dayImpressions,
        ctr: dayCTR,
        cpm: dayCPM,
        cpa: dayCPA,
        accounts: dayData?.length || 0
      });
    });
    console.log('=== END DETAILED METRICS BREAKDOWN ===');
    
    console.log('=== END LAST 7 DAYS METRICS DEBUG ===');

    return { spend, sales, profit, revenue, roas, ctr, cpm, cpa };
  }, [filteredDay0Data, filteredDay1Data, filteredDay2Data, filteredDay3Data, filteredDay4Data, filteredDay5Data, filteredDay6Data, last7DaysFilters]);

  const isLoading = todayLoading || yesterdayLoading || day0Data.isLoading || day1Data.isLoading || day2Data.isLoading || day3Data.isLoading || day4Data.isLoading || day5Data.isLoading || day6Data.isLoading;

      const result: HomeMetrics = {
      todaySpend: todayMetrics.spend,
      todaySales: todayMetrics.sales,
      todayProfit: todayMetrics.profit,
      todayRevenue: todayMetrics.revenue,
      todayROAS: todayMetrics.roas,
      todayCTR: todayMetrics.ctr,
      todayCPM: todayMetrics.cpm,
      todayCPA: todayMetrics.cpa,
      
      previousDaySpend: yesterdayMetrics.spend,
      previousDaySales: yesterdayMetrics.sales,
      previousDayProfit: yesterdayMetrics.profit,
      previousDayRevenue: yesterdayMetrics.revenue,
      previousDayROAS: yesterdayMetrics.roas,
      previousDayCTR: yesterdayMetrics.ctr,
      previousDayCPM: yesterdayMetrics.cpm,
      previousDayCPA: yesterdayMetrics.cpa,
      
      last7DaysSpend: last7DaysMetrics.spend,
      last7DaysSales: last7DaysMetrics.sales,
      last7DaysProfit: last7DaysMetrics.profit,
      last7DaysRevenue: last7DaysMetrics.revenue,
      last7DaysROAS: last7DaysMetrics.roas,
      last7DaysCTR: last7DaysMetrics.ctr,
      last7DaysCPM: last7DaysMetrics.cpm,
      last7DaysCPA: last7DaysMetrics.cpa,
    };

  return { data: result, isLoading };
}

const fetchRealHourlyMetrics = async (accountName?: string | null): Promise<HourlyMetrics[]> => {
  console.log('=== FETCH REAL HOURLY METRICS DEBUG ===');
  console.log('Fetching real hourly metrics from meta_ads_account_hourly_view for account:', accountName);
  console.log('Account name type:', typeof accountName);
  console.log('Account name value:', accountName);
  
  // Get current date in local timezone (Brazil GMT-3)
  const now = new Date();
  
  // Create dates using local date methods to avoid timezone conversion issues
  const todayStr = now.getFullYear() + '-' + 
    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
    String(now.getDate()).padStart(2, '0');
  
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.getFullYear() + '-' + 
    String(sevenDaysAgo.getMonth() + 1).padStart(2, '0') + '-' + 
    String(sevenDaysAgo.getDate()).padStart(2, '0');
    
  // Also try with UTC dates in case the database expects UTC
  const utcNow = new Date();
  const utcTodayStr = utcNow.toISOString().split('T')[0];
  const utcSevenDaysAgo = new Date(utcNow);
  utcSevenDaysAgo.setDate(utcNow.getDate() - 6);
  const utcSevenDaysAgoStr = utcSevenDaysAgo.toISOString().split('T')[0];
  


  console.log('Hourly metrics date range (local):', { sevenDaysAgo: sevenDaysAgoStr, today: todayStr });
  console.log('Hourly metrics date range (UTC):', { sevenDaysAgo: utcSevenDaysAgoStr, today: utcTodayStr });
  console.log('Current time (local):', now.toString());
  console.log('Current time (ISO):', now.toISOString());
  console.log('Timezone offset:', now.getTimezoneOffset(), 'minutes');

  // Fetch from meta_ads_account_hourly_view
  // Query for a wider range to see what data is actually available
  let query = supabase
    .from('meta_ads_account_hourly_view')
    .select('*')
    .gte('date_brt', sevenDaysAgoStr)
    .order('date_brt', { ascending: true })
    .order('hour_of_day', { ascending: true });

  // Filter by account if specified
  if (accountName && accountName !== 'all' && accountName !== '' && accountName !== null) {
    console.log('Applying account filter for:', accountName);
    console.log('Account filter type:', typeof accountName);
    console.log('Account filter value:', JSON.stringify(accountName));
    query = query.eq('account_name', accountName);
  } else {
    console.log('No account filter applied - fetching all accounts');
    console.log('accountName value:', accountName);
    console.log('accountName type:', typeof accountName);
    console.log('accountName === null:', accountName === null);
    console.log('accountName === "all":', accountName === 'all');
  }

  const { data: hourlyData, error } = await query;

  if (error) {
    console.error('Error fetching hourly metrics from meta_ads_account_hourly_view:', error);
    throw error;
  }

  console.log('Successfully fetched data from meta_ads_account_hourly_view:', hourlyData?.length, 'records');
  console.log('Sample account names in data:', hourlyData?.slice(0, 5).map(row => row.account_name));
  console.log('Unique account names in data:', [...new Set(hourlyData?.map(row => row.account_name) || [])]);
  
  // Debug: Check the date range of the returned data
  if (hourlyData && hourlyData.length > 0) {
    const dates = [...new Set(hourlyData.map(row => row.date_brt))].sort();
    console.log('Date range in returned data:', {
      earliest: dates[0],
      latest: dates[dates.length - 1],
      allDates: dates,
      requestedRange: { from: sevenDaysAgoStr, to: 'unlimited' }
    });
  }
  
  console.log('=== END FETCH REAL HOURLY METRICS DEBUG ===');

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
  // Use a more explicit query key that clearly distinguishes between null and 'all'
  const queryKey = ['hourly-metrics', accountName === null ? 'all' : accountName];
  
  console.log('=== USE HOURLY METRICS DEBUG ===');
  console.log('accountName parameter:', accountName);
  console.log('accountName type:', typeof accountName);
  console.log('accountName === null:', accountName === null);
  console.log('queryKey:', queryKey);
  console.log('queryKey stringified:', JSON.stringify(queryKey));
  console.log('================================');
  
  return useQuery({
    queryKey,
    queryFn: () => fetchRealHourlyMetrics(accountName),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Force refetch when account changes
    refetchInterval: false,
    // Ensure the query refetches when accountName changes
    enabled: true,
    // Force cache invalidation when account changes
    gcTime: 0,
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

