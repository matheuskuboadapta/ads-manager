
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DateFilter } from '@/components/ads-manager/FilterBar';

interface AdsViewData {
  account_name: string | null;
  ad_id: string | null;
  ad_name: string | null;
  adset_name: string | null;
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
      console.log('Fetching ads data from Supabase with date filter:', dateFilter);
      
      let query = supabase.from('meta_ads_view').select('*');
      
      if (dateFilter) {
        const fromDate = dateFilter.from.toISOString().split('T')[0];
        const toDate = dateFilter.to.toISOString().split('T')[0];
        query = query.gte('date_start', fromDate).lte('date_start', toDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching ads data:', error);
        throw error;
      }

      console.log('Ads data fetched successfully:', data?.length, 'records');
      console.log('Sample of raw data:', data?.slice(0, 3));
      return data as AdsViewData[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
};

export const useAccountsData = (dateFilter?: DateFilter | null) => {
  const { data: adsData, isLoading, error } = useAdsData(dateFilter);

  const accountsData = React.useMemo(() => {
    if (!adsData) return [];

    console.log('Processing accounts data...');
    const accountsMap = new Map();

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
          // Store the first ad_id found for this account
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

    console.log('Processed accounts:', accounts.length);
    return accounts;
  }, [adsData]);

  return { data: accountsData, isLoading, error };
};

export const useCampaignsData = (accountName?: string | null, dateFilter?: DateFilter | null) => {
  const { data: adsData, isLoading, error } = useAdsData(dateFilter);
  const [optimisticUpdates, setOptimisticUpdates] = React.useState<Record<string, any>>({});

  const campaignsData = React.useMemo(() => {
    if (!adsData) return [];

    console.log('Processing campaigns data for account:', accountName);
    console.log('Total raw ads data records:', adsData.length);
    
    const campaignsMap = new Map();
    let filteredRows = 0;

    adsData
      .filter(row => {
        const shouldInclude = !accountName || row.account_name === accountName;
        if (shouldInclude) filteredRows++;
        return shouldInclude;
      })
      .forEach(row => {
        if (!row.campaign_name) return;

        const campaignKey = row.campaign_name;
        if (!campaignsMap.has(campaignKey)) {
        // Extract campaign_id from ad_id (assuming ad_id format contains campaign info)
        // For now, we'll use a more meaningful campaign ID
        const campaignId = `campaign_${campaignKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        
        campaignsMap.set(campaignKey, {
          id: `camp_${campaignKey.toLowerCase().replace(/\s+/g, '_')}`,
          realId: campaignId,
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
          // Store the first ad_id found for this campaign
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

    console.log('Filtered rows for account:', filteredRows);
    console.log('Unique campaigns found:', campaignsMap.size);
    console.log('Campaign names:', Array.from(campaignsMap.keys()));

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

    console.log('=== ADSETS DATA PROCESSING ===');
    console.log('Processing adsets data for campaign:', campaignName);
    console.log('Total raw ads data records:', adsData.length);
    
    // Log all campaign names available in the data
    const uniqueCampaignNames = [...new Set(adsData.map(row => row.campaign_name).filter(Boolean))];
    console.log('Available campaign names in data:', uniqueCampaignNames);
    
    const adsetsMap = new Map();
    let filteredRows = 0;

    const filteredData = adsData.filter(row => {
      const shouldInclude = !campaignName || row.campaign_name === campaignName;
      if (shouldInclude) filteredRows++;
      if (campaignName && row.campaign_name === campaignName) {
        console.log('Matching row found:', {
          campaign_name: row.campaign_name,
          adset_name: row.adset_name,
          ad_name: row.ad_name
        });
      }
      return shouldInclude;
    });

    console.log('Filtered rows for campaign:', filteredRows);
    console.log('Filtered data sample:', filteredData.slice(0, 3));

    filteredData.forEach(row => {
      if (!row.adset_name) {
        console.log('Row missing adset_name:', row);
        return;
      }

      const adsetKey = row.adset_name;
      if (!adsetsMap.has(adsetKey)) {
        console.log('Creating new adset:', adsetKey);
        // Extract adset_id from ad_id or create a meaningful one
        const adsetId = `adset_${adsetKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        
        adsetsMap.set(adsetKey, {
          id: `adset_${adsetKey.toLowerCase().replace(/\s+/g, '_')}`,
          realId: adsetId,
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
          // Store the first ad_id found for this adset
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
    console.log('Adset names:', Array.from(adsetsMap.keys()));

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

export const useAdsListData = (adsetName?: string | null, dateFilter?: DateFilter | null) => {
  const [optimisticUpdates, setOptimisticUpdates] = React.useState<Record<string, any>>({});

  const query = useQuery({
    queryKey: ['ads-list-data', adsetName, dateFilter],
    queryFn: async () => {
      console.log('Fetching ads list data with video links for adset:', adsetName);
      
      // Build query for meta_ads_view with date filter
      let query = supabase.from('meta_ads_view').select('*');
      
      if (dateFilter) {
        const fromDate = dateFilter.from.toISOString().split('T')[0];
        const toDate = dateFilter.to.toISOString().split('T')[0];
        query = query.gte('date_start', fromDate).lte('date_start', toDate);
      }
      
      if (adsetName) {
        query = query.eq('adset_name', adsetName);
      }

      const { data: adsData, error } = await query;

      if (error) {
        console.error('Error fetching ads data:', error);
        throw error;
      }

      if (!adsData) return [];

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

      const adsMap = new Map();

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
        return {
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
      });

      console.log('Processed ads with video links:', ads.length);
      return ads;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
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
