import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdsetData {
  id: string;
  realId: string;
  name: string;
  status: string;
  spend: number;
  revenue: number;
  sales: number;
  profit: number;
  cpa: number;
  cpm: number;
  roas: number;
  ctr: number;
  clickCv: number;
  epc: number;
  clicks: number;
  impressions: number;
  dailyBudget: number;
}

interface AdData {
  id: string;
  realId: string;
  name: string;
  status: string;
  spend: number;
  revenue: number;
  sales: number;
  profit: number;
  cpa: number;
  cpm: number;
  roas: number;
  ctr: number;
  clickCv: number;
  epc: number;
  clicks: number;
  impressions: number;
  dailyBudget: number;
  accountName?: string;
}

interface CampaignDetailsData {
  adsets: AdsetData[];
  ads: AdData[];
}

export const useCampaignDetails = (campaignName: string | null, dateFilter: string = 'all', enabled: boolean = true) => {
  return useQuery({
    queryKey: ['campaign-details', campaignName, dateFilter],
    queryFn: async (): Promise<CampaignDetailsData> => {
      if (!campaignName) {
        return { adsets: [], ads: [] };
      }

      let query = supabase
        .from('meta_ads_view')
        .select('*')
        .eq('campaign_name', campaignName);

      // Apply date filter if not "all"
      if (dateFilter !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        
        switch(dateFilter) {
          case 'today':
            startDate = today;
            break;
          case 'yesterday':
            startDate.setDate(today.getDate() - 1);
            break;
          case 'last3days':
            startDate.setDate(today.getDate() - 2);
            break;
          case 'last7days':
            startDate.setDate(today.getDate() - 6);
            break;
          case 'last14days':
            startDate.setDate(today.getDate() - 13);
            break;
          case 'last30days':
            startDate.setDate(today.getDate() - 29);
            break;
        }
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = today.toISOString().split('T')[0];
        
        query = query
          .gte('date_start', startDateStr)
          .lte('date_start', endDateStr);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching campaign details:', error);
        throw error;
      }

      // Group by adsets
      const adsetMap = new Map<string, AdsetData>();
      const adMap = new Map<string, AdData>();

      data?.forEach(row => {
        const spend = Number(row.spend) || 0;
        const revenue = Number(row.real_revenue) || 0;
        const sales = Number(row.real_sales) || 0;
        const profit = Number(row.profit) || 0;
        const clicks = Number(row.clicks) || 0;
        const impressions = Number(row.impressions) || 0;
        
        // Aggregate adset data
        const adsetKey = row.adset_name || '';
        if (adsetKey) {
          const existing = adsetMap.get(adsetKey) || {
            id: row.adset_id || adsetKey,
            realId: row.adset_id || adsetKey,
            name: adsetKey,
            status: row.status || 'ACTIVE',
            spend: 0,
            revenue: 0,
            sales: 0,
            profit: 0,
            clicks: 0,
            impressions: 0,
            cpa: 0,
            cpm: 0,
            roas: 0,
            ctr: 0,
            clickCv: 0,
            epc: 0,
            dailyBudget: Number(row.daily_budget) || 0
          };

          existing.spend += spend;
          existing.revenue += revenue;
          existing.sales += sales;
          existing.profit += profit;
          existing.clicks += clicks;
          existing.impressions += impressions;

          adsetMap.set(adsetKey, existing);
        }

        // Aggregate ad data
        const adKey = row.ad_name || '';
        if (adKey) {
          const existing = adMap.get(adKey) || {
            id: row.ad_id || adKey,
            realId: row.ad_id || adKey,
            name: adKey,
            status: row.status || 'ACTIVE',
            spend: 0,
            revenue: 0,
            sales: 0,
            profit: 0,
            clicks: 0,
            impressions: 0,
            cpa: 0,
            cpm: 0,
            roas: 0,
            ctr: 0,
            clickCv: 0,
            epc: 0,
            dailyBudget: Number(row.daily_budget) || 0,
            accountName: row.account_name || undefined
          };

          existing.spend += spend;
          existing.revenue += revenue;
          existing.sales += sales;
          existing.profit += profit;
          existing.clicks += clicks;
          existing.impressions += impressions;

          adMap.set(adKey, existing);
        }
      });

      // Calculate metrics for adsets
      const adsets = Array.from(adsetMap.values()).map(adset => ({
        ...adset,
        cpa: adset.sales > 0 ? adset.spend / adset.sales : 0,
        cpm: adset.impressions > 0 ? (adset.spend / adset.impressions) * 1000 : 0,
        roas: adset.spend > 0 ? adset.revenue / adset.spend : 0,
        ctr: adset.impressions > 0 ? (adset.clicks / adset.impressions) * 100 : 0,
        clickCv: adset.clicks > 0 ? (adset.sales / adset.clicks) * 100 : 0,
        epc: adset.clicks > 0 ? adset.revenue / adset.clicks : 0
      }));

      // Calculate metrics for ads
      const ads = Array.from(adMap.values()).map(ad => ({
        ...ad,
        cpa: ad.sales > 0 ? ad.spend / ad.sales : 0,
        cpm: ad.impressions > 0 ? (ad.spend / ad.impressions) * 1000 : 0,
        roas: ad.spend > 0 ? ad.revenue / ad.spend : 0,
        ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
        clickCv: ad.clicks > 0 ? (ad.sales / ad.clicks) * 100 : 0,
        epc: ad.clicks > 0 ? ad.revenue / ad.clicks : 0
      }));

      // Sort by spend (descending)
      adsets.sort((a, b) => b.spend - a.spend);
      ads.sort((a, b) => b.spend - a.spend);

      return { adsets, ads };
    },
    enabled: !!campaignName && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
