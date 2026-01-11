import { useMemo } from 'react';

/**
 * Custom sorting hook that sorts data by sales (descending) first,
 * then by spend (descending) as a tiebreaker.
 * 
 * This ensures items with more sales appear first, and when sales are equal,
 * items with higher spend appear first.
 */
export const useCustomSort = <T extends Record<string, any>>(data: T[]) => {
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return data;

    return [...data].sort((a, b) => {
      const aSales = a.sales ?? 0;
      const bSales = b.sales ?? 0;
      const aSpend = a.spend ?? 0;
      const bSpend = b.spend ?? 0;

      // Primary sort: by sales (descending - more sales first)
      if (aSales !== bSales) {
        return bSales - aSales;
      }

      // Secondary sort (tiebreaker): by spend (descending - higher spend first)
      return bSpend - aSpend;
    });
  }, [data]);

  return sortedData;
};

