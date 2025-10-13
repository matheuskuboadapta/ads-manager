import { useState, useCallback, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export const useTableSort = <T>(data: T[], defaultSort?: SortConfig) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(defaultSort || null);

  const handleSort = useCallback((column: string) => {
    setSortConfig(current => {
      if (!current || current.column !== column) {
        // First click: sort ascending
        return { column, direction: 'asc' };
      } else if (current.direction === 'asc') {
        // Second click: sort descending
        return { column, direction: 'desc' };
      } else {
        // Third click: remove sorting
        return null;
      }
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sortConfig || !data.length) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortConfig.column];
      const bValue = (b as Record<string, unknown>)[sortConfig.column];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string values
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      
      if (aString < bString) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aString > bString) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const getSortDirection = useCallback((column: string): SortDirection => {
    if (!sortConfig || sortConfig.column !== column) return null;
    return sortConfig.direction;
  }, [sortConfig]);

  const resetSort = useCallback(() => {
    setSortConfig(defaultSort || null);
  }, [defaultSort]);

  return {
    sortedData,
    sortConfig,
    handleSort,
    getSortDirection,
    resetSort
  };
}; 