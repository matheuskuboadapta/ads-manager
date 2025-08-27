
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DateFilter } from '@/components/ads-manager/FilterBar';

interface AdsViewData {
  account_name: string | null;
  ad_id: string | null;
  ad_name: string | null;
  adset_id: string | null;
  adset_name: string | null;
  campaign_id: string | null;
  campaign_name: string | null;
  clicks: number | null;
  date_start: string | null;
  impressions: number | null;
  profit: number | null;
  real_revenue: number | null;
  real_sales: number | null;
  spend: number | null;
  // New status columns
  ad_status_final: string | null;
  adset_status_final: string | null;
  campaign_status_final: string | null;
  is_adset_level_budget: boolean | null;
  daily_budget_per_row: number | null;
}

export const useAdsData = (dateFilter?: DateFilter | null) => {
  return useQuery({
    queryKey: ['ads-data', dateFilter],
    queryFn: async () => {
      console.log('=== USEADS_DATA DEBUG ===');
      console.log('Fetching ads data from Supabase with date filter:', dateFilter);
      
      // Se não há dateFilter, retornar array vazio - NÃO usar filtro padrão
      if (!dateFilter) {
        console.log('❌ No date filter provided - returning empty array');
        return [];
      }

      const fromDate = dateFilter.from.toISOString().split('T')[0];
      const toDate = dateFilter.to.toISOString().split('T')[0];
      console.log('Date filter applied:', { fromDate, toDate, label: dateFilter.label });
      console.log('Date filter raw dates:', { 
        from: dateFilter.from.toISOString(), 
        to: dateFilter.to.toISOString() 
      });
      console.log('Date filter local dates:', { 
        from: dateFilter.from.toString(), 
        to: dateFilter.to.toString() 
      });
      console.log('Date filter from.toDateString():', dateFilter.from.toDateString());
      console.log('Date filter to.toDateString():', dateFilter.to.toDateString());
      
      // Debug: Check if this is a single day filter
      if (fromDate === toDate) {
        console.log('✅ Single day filter detected:', fromDate);
        console.log('Expected SQL: SELECT SUM(spend) FROM meta_ads_view WHERE date_start = \'' + fromDate + '\'');
      } else {
        console.log('⚠️ Date range filter detected:', { fromDate, toDate });
        console.log('Expected SQL: SELECT SUM(spend) FROM meta_ads_view WHERE date_start >= \'' + fromDate + '\' AND date_start <= \'' + toDate + '\'');
      }

      // Query to meta_ads_view with exact date range - NO substitutions
      // For the end date, we need to include the entire day, so we use the next day as the upper limit
      const nextDay = new Date(toDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const upperLimit = nextDay.toISOString().split('T')[0];
      
      console.log('Query parameters:', { fromDate, toDate, upperLimit });
      
      const { data: rawData, error } = await supabase
        .from('meta_ads_view')
        .select('*')
        .gte('date_start', fromDate)
        .lt('date_start', upperLimit);

      if (error) {
        console.error('❌ Error fetching data:', error);
        throw error;
      }

      if (!rawData || rawData.length === 0) {
        console.log('❌ No data found for exact date range - returning empty array');
        console.log('Query parameters:', { fromDate, toDate });
        console.log('This means there are NO records for the requested period');
        return [];
      }

      console.log('✅ Raw data fetched:', rawData.length, 'records for exact date range');
      console.log('Sample data:', rawData.slice(0, 2));

      // IMPORTANTE: NÃO fazer deduplicação - usar todos os registros como vêm do banco
      // Isso garante que os dados sejam idênticos à query SQL direta
      console.log('✅ Using ALL records without deduplication to match SQL query exactly');

      // Return data as-is without any deduplication
      const result = rawData.map(row => ({
        account_name: row.account_name,
        ad_id: row.ad_id,
        ad_name: row.ad_name,
        adset_id: row.adset_id,
        adset_name: row.adset_name,
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name,
        date_start: row.date_start,
        ad_status_final: row.ad_status_final,
        adset_status_final: row.adset_status_final,
        campaign_status_final: row.campaign_status_final,
        is_adset_level_budget: row.is_adset_level_budget,
        daily_budget_per_row: row.daily_budget_per_row,
        preview_shareable_link: row.preview_shareable_link,
        spend: Number(row.spend) || 0,
        real_revenue: Number(row.real_revenue) || 0,
        real_sales: Number(row.real_sales) || 0,
        profit: Number(row.profit) || 0,
        clicks: Number(row.clicks) || 0,
        impressions: Number(row.impressions) || 0,
      }));

      console.log('✅ Processed data:', result.length, 'records');

      // Debug: Show total spend by date
      const spendByDate = new Map<string, number>();
      result.forEach(row => {
        const date = row.date_start;
        const spend = row.spend || 0;
        spendByDate.set(date, (spendByDate.get(date) || 0) + spend);
      });
      console.log('Total spend by date:', Object.fromEntries(spendByDate));

      // Debug: Calculate total spend
      const totalSpend = result.reduce((sum, row) => sum + (row.spend || 0), 0);
      console.log('Total spend for exact date range:', totalSpend);
      
      // Debug: Compare with expected SQL result
      console.log('=== SQL COMPARISON DEBUG ===');
      console.log('Expected SQL result for date range:', { fromDate, toDate });
      console.log('Current total spend:', totalSpend);
      console.log('If this matches your SQL query, the data is correct');
      
      // Additional verification: Check if we're getting the exact same data as SQL
      if (fromDate === toDate) {
        console.log('Single date query - should match: SELECT SUM(spend) FROM meta_ads_view WHERE date_start = \'' + fromDate + '\'');
      } else {
        console.log('Date range query - should match: SELECT SUM(spend) FROM meta_ads_view WHERE date_start >= \'' + fromDate + '\' AND date_start < \'' + upperLimit + '\'');
      }
      
      console.log('=== END SQL COMPARISON DEBUG ===');
      
      console.log('=== END USEADS_DATA DEBUG ===');

      return result as AdsViewData[];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 15 * 60 * 1000, // Auto-refresh every 15 minutes
  });
};

export const useAccountsData = (dateFilter?: DateFilter | null) => {
  const { data: adsData, isLoading, error } = useAdsData(dateFilter);

  const accountsData = React.useMemo(() => {
    console.log('=== USEACCOUNTS_DATA DEBUG ===');
    console.log('Processing accounts data with dateFilter:', dateFilter);
    console.log('Ads data received:', adsData?.length || 0, 'records');
    
    if (!adsData) {
      console.log('❌ No ads data available - returning empty array');
      return [];
    }

    if (adsData.length === 0) {
      console.log('❌ Empty ads data array - returning empty accounts array');
      console.log('This means there are NO records for the requested period');
      return [];
    }

    console.log('Processing accounts data...');
    console.log('Total raw ads data records:', adsData.length);
    
    // Group by account_name and sum all metrics, ensuring no duplicates
    const accountsMap = new Map<string, any>();

    adsData.forEach(row => {
      if (!row.account_name) return;

      const accountKey = row.account_name;
      
      if (!accountsMap.has(accountKey)) {
        accountsMap.set(accountKey, {
          id: `acc_${accountKey.toLowerCase().replace(/\s+/g, '_')}`,
          name: row.account_name,
          status: 'active' as const,
          spend: 0,
          revenue: 0,
          sales: 0,
          profit: 0,
          clicks: 0,
          impressions: 0,
          firstAdId: row.ad_id,
        });
      }

      const account = accountsMap.get(accountKey);
      account.spend += row.spend || 0;
      account.revenue += row.real_revenue || 0;
      account.sales += row.real_sales || 0;
      account.profit += row.profit || 0;
      account.clicks += row.clicks || 0;
      account.impressions += row.impressions || 0;
    });

    console.log('Processed accounts:', accountsMap.size);
    console.log('Accounts data:', Array.from(accountsMap.values()).map(acc => ({ name: acc.name, spend: acc.spend, sales: acc.sales })));
    
    // Debug: Calculate total spend across all accounts
    const totalSpend = Array.from(accountsMap.values()).reduce((sum, acc) => sum + acc.spend, 0);
    console.log('Total spend across all accounts:', totalSpend);
    
    // Debug: Verify against raw data total
    const rawDataTotalSpend = adsData.reduce((sum, row) => sum + (row.spend || 0), 0);
    console.log('Raw data total spend:', rawDataTotalSpend);
    console.log('Accounts aggregation total spend:', totalSpend);
    console.log('Difference:', Math.abs(rawDataTotalSpend - totalSpend));
    
    if (Math.abs(rawDataTotalSpend - totalSpend) > 0.01) {
      console.error('❌ MISMATCH: Raw data total and accounts aggregation total are different!');
      console.error('Raw data total:', rawDataTotalSpend);
      console.error('Accounts aggregation total:', totalSpend);
      console.error('Difference:', rawDataTotalSpend - totalSpend);
    } else {
      console.log('✅ MATCH: Raw data total and accounts aggregation total are identical');
    }
    
    // Debug: Execute direct SQL query for comparison
    if (dateFilter) {
      const fromDate = dateFilter.from.toISOString().split('T')[0];
      const toDate = dateFilter.to.toISOString().split('T')[0];
      
      console.log('=== DIRECT SQL COMPARISON ===');
      console.log('Date range for comparison:', { fromDate, toDate });
      console.log('Expected SQL query: SELECT SUM(spend) FROM meta_ads_view WHERE date_start >= \'' + fromDate + '\' AND date_start <= \'' + toDate + '\'');
      console.log('Current processed total spend:', totalSpend);
      console.log('If this matches your SQL query result, the data is correct');
      console.log('=== END DIRECT SQL COMPARISON ===');
    }
    
    // Debug: Check for any unusually high values
    const highSpendAccounts = Array.from(accountsMap.values()).filter(acc => acc.spend > 50000);
    if (highSpendAccounts.length > 0) {
      console.warn('Found accounts with unusually high spend:', highSpendAccounts.map(acc => ({ name: acc.name, spend: acc.spend })));
    }
    
    console.log('=== END USEACCOUNTS_DATA DEBUG ===');
    
    const accounts = Array.from(accountsMap.values()).map(account => ({
      ...account,
      cpa: account.sales > 0 ? account.spend / account.sales : 0,
      cpm: account.impressions > 0 ? (account.spend / account.impressions) * 1000 : 0,
      cpc: account.clicks > 0 ? account.spend / account.clicks : 0,
      ctr: account.impressions > 0 ? (account.clicks / account.impressions) * 100 : 0,
      clickCv: account.clicks > 0 ? (account.sales / account.clicks) * 100 : 0,
      epc: account.clicks > 0 ? account.revenue / account.clicks : 0,
      roas: account.spend > 0 ? account.revenue / account.spend : 0,
    }));

    return accounts;
  }, [adsData, dateFilter]);

  return { data: accountsData, isLoading, error };
};

export const useCampaignsData = (accountName?: string | null, dateFilter?: DateFilter | null) => {
  const { data: adsData, isLoading, error } = useAdsData(dateFilter);
  const [optimisticUpdates, setOptimisticUpdates] = React.useState<Record<string, any>>({});

  const campaignsData = React.useMemo(() => {
    if (!adsData) return [];

    if (adsData.length === 0) {
      console.log('No campaigns data available for the selected period');
      return [];
    }

    console.log('Processing campaigns data for account:', accountName);
    console.log('Total raw ads data records:', adsData.length);
    
    // Group by campaign_name and sum all metrics
    const campaignsMap = new Map<string, any>();

    adsData
      .filter(row => !accountName || row.account_name === accountName)
      .forEach(row => {
        if (!row.campaign_name) return;

        const campaignKey = row.campaign_name;
        
        if (!campaignsMap.has(campaignKey)) {
          campaignsMap.set(campaignKey, {
            id: `camp_${campaignKey.toLowerCase().replace(/\s+/g, '_')}`,
            realId: row.campaign_id,
            name: row.campaign_name,
            objective: 'CONVERSIONS',
            status: row.campaign_status_final === 'ATIVO' ? 'ACTIVE' : 'PAUSED',
            statusFinal: row.campaign_status_final,
            isAdsetLevelBudget: row.is_adset_level_budget,
            dailyBudget: row.daily_budget_per_row || 0,
            spend: 0,
            revenue: 0,
            sales: 0,
            profit: 0,
            clicks: 0,
            impressions: 0,
            firstAdId: row.ad_id,
          });
        }

        const campaign = campaignsMap.get(campaignKey);
        campaign.spend += row.spend || 0;
        campaign.revenue += row.real_revenue || 0;
        campaign.sales += row.real_sales || 0;
        campaign.profit += row.profit || 0;
        campaign.clicks += row.clicks || 0;
        campaign.impressions += row.impressions || 0;
      });

    console.log('Unique campaigns found:', campaignsMap.size);

    const campaigns = Array.from(campaignsMap.values()).map(campaign => {
      const updates = optimisticUpdates[campaign.firstAdId] || {};
      return {
        ...campaign,
        ...updates,
        cpa: campaign.sales > 0 ? campaign.spend / campaign.sales : 0,
        cpm: campaign.impressions > 0 ? (campaign.spend / campaign.impressions) * 1000 : 0,
        cpc: campaign.clicks > 0 ? campaign.spend / campaign.clicks : 0,
        ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0,
        clickCv: campaign.clicks > 0 ? (campaign.sales / campaign.clicks) * 100 : 0,
        epc: campaign.clicks > 0 ? campaign.revenue / campaign.clicks : 0,
        roas: campaign.spend > 0 ? campaign.revenue / campaign.spend : 0,
      };
    });

    console.log('Processed campaigns:', campaigns.length);
    return campaigns;
  }, [adsData, accountName, optimisticUpdates]);

  const updateOptimistic = React.useCallback((adId: string, updates: any) => {
    setOptimisticUpdates(prev => ({
      ...prev,
      [adId]: { ...prev[adId], ...updates }
    }));
  }, []);

  const clearOptimistic = React.useCallback((adId: string) => {
    setOptimisticUpdates(prev => {
      const newUpdates = { ...prev };
      delete newUpdates[adId];
      return newUpdates;
    });
  }, []);

  return { data: campaignsData, isLoading, error, updateOptimistic, clearOptimistic };
};

export const useAdsetsData = (campaignName?: string | null, dateFilter?: DateFilter | null) => {
  const { data: adsData, isLoading, error } = useAdsData(dateFilter);
  const [optimisticUpdates, setOptimisticUpdates] = React.useState<Record<string, any>>({});

  const adsetsData = React.useMemo(() => {
    if (!adsData) return [];

    if (adsData.length === 0) {
      console.log('No adsets data available for the selected period');
      return [];
    }

    console.log('=== ADSETS DATA PROCESSING ===');
    console.log('Processing adsets data for campaign:', campaignName);
    console.log('Total raw ads data records:', adsData.length);
    
    // Group by adset_name and sum all metrics
    const adsetsMap = new Map<string, any>();

    adsData
      .filter(row => !campaignName || row.campaign_name?.toLowerCase().includes(campaignName.toLowerCase()))
      .forEach(row => {
        if (!row.adset_name) return;

        const adsetKey = row.adset_name;
        
        if (!adsetsMap.has(adsetKey)) {
          adsetsMap.set(adsetKey, {
            id: `adset_${adsetKey.toLowerCase().replace(/\s+/g, '_')}`,
            realId: row.adset_id,
            name: row.adset_name,
            status: row.adset_status_final === 'ATIVO' ? 'ACTIVE' : 'PAUSED',
            statusFinal: row.adset_status_final,
            isAdsetLevelBudget: row.is_adset_level_budget,
            dailyBudget: row.daily_budget_per_row || 0,
            spend: 0,
            revenue: 0,
            sales: 0,
            profit: 0,
            clicks: 0,
            impressions: 0,
            firstAdId: row.ad_id,
          });
        }

        const adset = adsetsMap.get(adsetKey);
        adset.spend += row.spend || 0;
        adset.revenue += row.real_revenue || 0;
        adset.sales += row.real_sales || 0;
        adset.profit += row.profit || 0;
        adset.clicks += row.clicks || 0;
        adset.impressions += row.impressions || 0;
      });

    console.log('Unique adsets found:', adsetsMap.size);

    const adsets = Array.from(adsetsMap.values()).map(adset => {
      const updates = optimisticUpdates[adset.firstAdId] || {};
      return {
        ...adset,
        ...updates,
        cpa: adset.sales > 0 ? adset.spend / adset.sales : 0,
        cpm: adset.impressions > 0 ? (adset.spend / adset.impressions) * 1000 : 0,
        cpc: adset.clicks > 0 ? adset.spend / adset.clicks : 0,
        ctr: adset.impressions > 0 ? (adset.clicks / adset.impressions) * 100 : 0,
        clickCv: adset.clicks > 0 ? (adset.sales / adset.clicks) * 100 : 0,
        epc: adset.clicks > 0 ? adset.revenue / adset.clicks : 0,
        roas: adset.spend > 0 ? adset.revenue / adset.spend : 0,
      };
    });

    console.log('Final processed adsets:', adsets.length);
    console.log('=== END ADSETS DATA PROCESSING ===');
    return adsets;
  }, [adsData, campaignName, optimisticUpdates]);

  const updateOptimistic = React.useCallback((adId: string, updates: any) => {
    setOptimisticUpdates(prev => ({
      ...prev,
      [adId]: { ...prev[adId], ...updates }
    }));
  }, []);

  const clearOptimistic = React.useCallback((adId: string) => {
    setOptimisticUpdates(prev => {
      const newUpdates = { ...prev };
      delete newUpdates[adId];
      return newUpdates;
    });
  }, []);

  return { data: adsetsData, isLoading, error, updateOptimistic, clearOptimistic };
};

export const useAdsListData = (adsetName?: string | null, campaignName?: string | null, dateFilter?: DateFilter | null) => {
  const [optimisticUpdates, setOptimisticUpdates] = React.useState<Record<string, any>>({});

  const query = useQuery({
    queryKey: ['ads-list-data', adsetName, campaignName, dateFilter],
    queryFn: async () => {
      console.log('Fetching ads list data with video links for adset:', adsetName, 'and campaign:', campaignName);
      
      // Build query for meta_ads_view with date filter
      let query = supabase.from('meta_ads_view').select('*');
      
      if (dateFilter) {
        const fromDate = dateFilter.from.toISOString().split('T')[0];
        const toDate = dateFilter.to.toISOString().split('T')[0];
        
        // For the end date, we need to include the entire day, so we use the next day as the upper limit
        const nextDay = new Date(toDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const upperLimit = nextDay.toISOString().split('T')[0];
        
        query = query.gte('date_start', fromDate).lt('date_start', upperLimit);
      } else {
        console.log('No date filter provided - returning empty array');
        return [];
      }
      
      if (adsetName) {
        query = query.eq('adset_name', adsetName);
      }

      if (campaignName) {
        query = query.eq('campaign_name', campaignName);
      }

      const { data: adsData, error } = await query;

      if (error) {
        console.error('Error fetching ads data:', error);
        throw error;
      }

      if (!adsData || adsData.length === 0) {
        console.log('No ads data found for the selected period');
        return [];
      }

      // Get unique ad IDs
      const adIds = [...new Set(adsData.map(row => row.ad_id).filter(Boolean))];
      
      // Fetch video links from meta_ads_metrics
      const videoLinksMap = new Map();
      if (adIds.length > 0) {
        const { data: videoLinksData } = await supabase
          .from('meta_ads_metrics')
          .select('ad_id, preview_shareable_link')
          .in('ad_id', adIds);
        
        if (videoLinksData) {
          videoLinksData.forEach(row => {
            if (row.preview_shareable_link) {
              videoLinksMap.set(row.ad_id, row.preview_shareable_link);
            }
          });
        }
      }

      // Group by ad_id and sum all metrics
      const adsMap = new Map<string, any>();

      adsData.forEach(row => {
        if (!row.ad_name || !row.ad_id) return;

        const adKey = row.ad_id;
        
        if (!adsMap.has(adKey)) {
          adsMap.set(adKey, {
            id: row.ad_id,
            name: row.ad_name,
            status: row.ad_status_final === 'ATIVO' ? 'ACTIVE' : 'PAUSED',
            statusFinal: row.ad_status_final,
            adFormat: 'Single Image',
            videoLink: videoLinksMap.get(row.ad_id) || null,
            spend: 0,
            revenue: 0,
            sales: 0,
            profit: 0,
            clicks: 0,
            impressions: 0,
          });
        }

        const ad = adsMap.get(adKey);
        ad.spend += row.spend || 0;
        ad.revenue += row.real_revenue || 0;
        ad.sales += row.real_sales || 0;
        ad.profit += row.profit || 0;
        ad.clicks += row.clicks || 0;
        ad.impressions += row.impressions || 0;
      });

      const ads = Array.from(adsMap.values()).map(ad => {
        const updates = optimisticUpdates[ad.id] || {};
        const finalAd = {
          ...ad,
          ...updates,
          cpa: ad.sales > 0 ? ad.spend / ad.sales : 0,
          cpm: ad.impressions > 0 ? (ad.spend / ad.impressions) * 1000 : 0,
          cpc: ad.clicks > 0 ? ad.spend / ad.clicks : 0,
          ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
          clickCv: ad.clicks > 0 ? (ad.sales / ad.clicks) * 100 : 0,
          epc: ad.clicks > 0 ? ad.revenue / ad.clicks : 0,
          roas: ad.spend > 0 ? ad.revenue / ad.spend : 0,
        };
        
        return finalAd;
      });

      console.log('Processed ads with video links:', ads.length);
      return ads;
    },
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });

  const updateOptimistic = React.useCallback((adId: string, updates: any) => {
    setOptimisticUpdates(prev => ({
      ...prev,
      [adId]: { ...prev[adId], ...updates }
    }));
  }, []);

  const clearOptimistic = React.useCallback((adId: string) => {
    setOptimisticUpdates(prev => {
      const newUpdates = { ...prev };
      delete newUpdates[adId];
      return newUpdates;
    });
  }, []);

  return { 
    ...query, 
    updateOptimistic, 
    clearOptimistic 
  };
};
