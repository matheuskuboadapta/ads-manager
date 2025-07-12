
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DateFilter } from '@/components/ads-manager/FilterBar';

interface AdsViewData {
  account_name: string | null;
  ad_id: string | null;
  ad_name: string | null;
  adset_name: string | null;
  adset_status: string | null;
  campaign_name: string | null;
  campaign_status: string | null;
  clicks: number | null;
  date_start: string | null;
  effective_status: string | null;
  impressions: number | null;
  profit: number | null;
  real_revenue: number | null;
  real_sales: number | null;
  spend: number | null;
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

  const campaignsData = React.useMemo(() => {
    if (!adsData) return [];

    console.log('Processing campaigns data for account:', accountName);
    const campaignsMap = new Map();

    adsData
      .filter(row => !accountName || row.account_name === accountName)
      .forEach(row => {
        if (!row.campaign_name) return;

        const campaignKey = row.campaign_name;
        if (!campaignsMap.has(campaignKey)) {
          campaignsMap.set(campaignKey, {
            id: `camp_${campaignKey.toLowerCase().replace(/\s+/g, '_')}`,
            realId: `campaign_${Math.random().toString(36).substr(2, 9)}`, // Generate a realistic ID
            name: row.campaign_name,
            objective: 'CONVERSIONS',
            status: row.campaign_status || 'PAUSED',
            spend: 0,
            revenue: 0,
            sales: 0,
            profit: 0,
            clicks: 0,
            impressions: 0,
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

    const campaigns = Array.from(campaignsMap.values()).map(campaign => ({
      ...campaign,
      cpa: campaign.sales > 0 ? campaign.spend / campaign.sales : 0,
      cpm: campaign.impressions > 0 ? (campaign.spend / campaign.impressions) * 1000 : 0,
      cpc: campaign.clicks > 0 ? campaign.spend / campaign.clicks : 0,
      ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0,
      clickCv: campaign.clicks > 0 ? (campaign.sales / campaign.clicks) * 100 : 0,
      epc: campaign.clicks > 0 ? campaign.revenue / campaign.clicks : 0,
      roas: campaign.spend > 0 ? campaign.revenue / campaign.spend : 0,
    }));

    console.log('Processed campaigns:', campaigns.length);
    return campaigns;
  }, [adsData, accountName]);

  return { data: campaignsData, isLoading, error };
};

export const useAdsetsData = (campaignName?: string | null, dateFilter?: DateFilter | null) => {
  const { data: adsData, isLoading, error } = useAdsData(dateFilter);

  const adsetsData = React.useMemo(() => {
    if (!adsData) return [];

    console.log('Processing adsets data for campaign:', campaignName);
    const adsetsMap = new Map();

    adsData
      .filter(row => !campaignName || row.campaign_name === campaignName)
      .forEach(row => {
        if (!row.adset_name) return;

        const adsetKey = row.adset_name;
        if (!adsetsMap.has(adsetKey)) {
          adsetsMap.set(adsetKey, {
            id: `adset_${adsetKey.toLowerCase().replace(/\s+/g, '_')}`,
            realId: `adset_${Math.random().toString(36).substr(2, 9)}`, // Generate a realistic ID
            name: row.adset_name,
            status: row.adset_status || 'PAUSED',
            dailyBudget: 200, // Default budget - can be enhanced later
            spend: 0,
            revenue: 0,
            sales: 0,
            profit: 0,
            clicks: 0,
            impressions: 0,
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

    const adsets = Array.from(adsetsMap.values()).map(adset => ({
      ...adset,
      cpa: adset.sales > 0 ? adset.spend / adset.sales : 0,
      cpm: adset.impressions > 0 ? (adset.spend / adset.impressions) * 1000 : 0,
      cpc: adset.clicks > 0 ? adset.spend / adset.clicks : 0,
      ctr: adset.impressions > 0 ? (adset.clicks / adset.impressions) * 100 : 0,
      clickCv: adset.clicks > 0 ? (adset.sales / adset.clicks) * 100 : 0,
      epc: adset.clicks > 0 ? adset.revenue / adset.clicks : 0,
      roas: adset.spend > 0 ? adset.revenue / adset.spend : 0,
    }));

    console.log('Processed adsets:', adsets.length);
    return adsets;
  }, [adsData, campaignName]);

  return { data: adsetsData, isLoading, error };
};

export const useAdsListData = (adsetName?: string | null, dateFilter?: DateFilter | null) => {
  const { data: adsData, isLoading, error } = useAdsData(dateFilter);

  const adsListData = React.useMemo(() => {
    if (!adsData) return [];

    console.log('Processing ads data for adset:', adsetName);
    const adsMap = new Map();

    adsData
      .filter(row => !adsetName || row.adset_name === adsetName)
      .forEach(row => {
        if (!row.ad_name || !row.ad_id) return;

        const adKey = row.ad_id;
        if (!adsMap.has(adKey)) {
          adsMap.set(adKey, {
            id: row.ad_id,
            name: row.ad_name,
            status: row.effective_status || 'PAUSED',
            adFormat: 'Single Image', // Default format - can be enhanced later
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

    const ads = Array.from(adsMap.values()).map(ad => ({
      ...ad,
      cpa: ad.sales > 0 ? ad.spend / ad.sales : 0,
      cpm: ad.impressions > 0 ? (ad.spend / ad.impressions) * 1000 : 0,
      cpc: ad.clicks > 0 ? ad.spend / ad.clicks : 0,
      ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
      clickCv: ad.clicks > 0 ? (ad.sales / ad.clicks) * 100 : 0,
      epc: ad.clicks > 0 ? ad.revenue / ad.clicks : 0,
      roas: ad.spend > 0 ? ad.revenue / ad.spend : 0,
    }));

    console.log('Processed ads:', ads.length);
    return ads;
  }, [adsData, adsetName]);

  return { data: adsListData, isLoading, error };
};
