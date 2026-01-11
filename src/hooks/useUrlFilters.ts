import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DateFilter } from '@/components/ads-manager/FilterBar';

// Map period labels to URL-friendly keys
const PERIOD_MAP: Record<string, string> = {
  'Hoje': 'today',
  'Ontem': 'yesterday',
  'Últimos 3 dias': '3d',
  'Últimos 7 dias': '7d',
  'Últimos 14 dias': '14d',
  'Últimos 30 dias': '30d',
  'Período personalizado': 'custom',
};

const PERIOD_REVERSE_MAP: Record<string, string> = {
  'today': 'Hoje',
  'yesterday': 'Ontem',
  '3d': 'Últimos 3 dias',
  '7d': 'Últimos 7 dias',
  '14d': 'Últimos 14 dias',
  '30d': 'Últimos 30 dias',
  'custom': 'Período personalizado',
};

// Helper function to get local date string without timezone conversion
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to create a date from a string in local timezone
const createLocalDate = (dateStr: string): Date => {
  return new Date(dateStr + 'T00:00:00');
};

// Get preset date ranges based on period key
const getPresetDateRange = (periodKey: string): DateFilter | null => {
  const now = new Date();
  const todayStr = getLocalDateString(now);
  const today = createLocalDate(todayStr);

  switch (periodKey) {
    case 'today': {
      return { from: today, to: today, label: 'Hoje' };
    }
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayDate = createLocalDate(getLocalDateString(yesterday));
      return { from: yesterdayDate, to: yesterdayDate, label: 'Ontem' };
    }
    case '3d': {
      const start = new Date(now);
      start.setDate(now.getDate() - 2);
      return { from: createLocalDate(getLocalDateString(start)), to: today, label: 'Últimos 3 dias' };
    }
    case '7d': {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      return { from: createLocalDate(getLocalDateString(start)), to: today, label: 'Últimos 7 dias' };
    }
    case '14d': {
      const start = new Date(now);
      start.setDate(now.getDate() - 13);
      return { from: createLocalDate(getLocalDateString(start)), to: today, label: 'Últimos 14 dias' };
    }
    case '30d': {
      const start = new Date(now);
      start.setDate(now.getDate() - 29);
      return { from: createLocalDate(getLocalDateString(start)), to: today, label: 'Últimos 30 dias' };
    }
    default:
      return null;
  }
};

export interface UrlFilters {
  tab: string;
  account: string | null;
  campaign: string | null;
  adset: string | null;
  search: string;
  status: string;
  dateFilter: DateFilter | null;
}

export interface UrlFiltersActions {
  setTab: (tab: string) => void;
  setAccount: (account: string | null) => void;
  setCampaign: (campaign: string | null) => void;
  setAdset: (adset: string | null) => void;
  setSearch: (search: string) => void;
  setStatus: (status: string) => void;
  setDateFilter: (dateFilter: DateFilter | null) => void;
  setFilters: (filters: Partial<UrlFilters>) => void;
}

export const useUrlFilters = (): UrlFilters & UrlFiltersActions => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse current URL params into filter values
  const filters = useMemo((): UrlFilters => {
    const tab = searchParams.get('tab') || 'home';
    const account = searchParams.get('account') || null;
    const campaign = searchParams.get('campaign') || null;
    const adset = searchParams.get('adset') || null;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const period = searchParams.get('period');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let dateFilter: DateFilter | null = null;

    if (period === 'custom' && from && to) {
      // Custom date range from URL
      dateFilter = {
        from: createLocalDate(from),
        to: createLocalDate(to),
        label: 'Período personalizado',
      };
    } else if (period) {
      // Preset period
      dateFilter = getPresetDateRange(period);
    }

    return {
      tab,
      account,
      campaign,
      adset,
      search,
      status,
      dateFilter,
    };
  }, [searchParams]);

  // Helper to update search params without losing existing ones
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'all') {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });

      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  const setTab = useCallback((tab: string) => {
    updateParams({ tab: tab === 'home' ? null : tab });
  }, [updateParams]);

  const setAccount = useCallback((account: string | null) => {
    updateParams({ account });
  }, [updateParams]);

  const setCampaign = useCallback((campaign: string | null) => {
    updateParams({ campaign });
  }, [updateParams]);

  const setAdset = useCallback((adset: string | null) => {
    updateParams({ adset });
  }, [updateParams]);

  const setSearch = useCallback((search: string) => {
    updateParams({ search: search || null });
  }, [updateParams]);

  const setStatus = useCallback((status: string) => {
    updateParams({ status: status === 'all' ? null : status });
  }, [updateParams]);

  const setDateFilter = useCallback((dateFilter: DateFilter | null) => {
    if (!dateFilter) {
      updateParams({ period: null, from: null, to: null });
      return;
    }

    const periodKey = PERIOD_MAP[dateFilter.label];
    
    if (periodKey === 'custom') {
      // For custom dates, include from and to
      updateParams({
        period: 'custom',
        from: getLocalDateString(dateFilter.from),
        to: getLocalDateString(dateFilter.to),
      });
    } else if (periodKey) {
      // For presets, only include period
      updateParams({ period: periodKey, from: null, to: null });
    }
  }, [updateParams]);

  const setFilters = useCallback((newFilters: Partial<UrlFilters>) => {
    const updates: Record<string, string | null> = {};

    if ('tab' in newFilters) {
      updates.tab = newFilters.tab === 'home' ? null : (newFilters.tab || null);
    }
    if ('account' in newFilters) {
      updates.account = newFilters.account;
    }
    if ('campaign' in newFilters) {
      updates.campaign = newFilters.campaign;
    }
    if ('adset' in newFilters) {
      updates.adset = newFilters.adset;
    }
    if ('search' in newFilters) {
      updates.search = newFilters.search || null;
    }
    if ('status' in newFilters) {
      updates.status = newFilters.status === 'all' ? null : (newFilters.status || null);
    }
    if ('dateFilter' in newFilters) {
      const dateFilter = newFilters.dateFilter;
      if (!dateFilter) {
        updates.period = null;
        updates.from = null;
        updates.to = null;
      } else {
        const periodKey = PERIOD_MAP[dateFilter.label];
        if (periodKey === 'custom') {
          updates.period = 'custom';
          updates.from = getLocalDateString(dateFilter.from);
          updates.to = getLocalDateString(dateFilter.to);
        } else if (periodKey) {
          updates.period = periodKey;
          updates.from = null;
          updates.to = null;
        }
      }
    }

    updateParams(updates);
  }, [updateParams]);

  return {
    ...filters,
    setTab,
    setAccount,
    setCampaign,
    setAdset,
    setSearch,
    setStatus,
    setDateFilter,
    setFilters,
  };
};

