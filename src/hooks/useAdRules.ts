import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdRule {
  id: number;
  name: string;
  is_active: boolean;
  conditions: any;
  actions: any;
  created_at: string | null;
  updated_at: string | null;
}

export const useAdRules = () => {
  return useQuery({
    queryKey: ['ad-rules'],
    queryFn: async () => {
      console.log('Fetching ad rules data from Supabase');
      
      const { data, error } = await supabase
        .from('ad_rules')
        .select('*');

      if (error) {
        console.error('Error fetching ad rules data:', error);
        throw error;
      }

      console.log('Ad rules data fetched successfully:', data?.length, 'records');
      return data as AdRule[];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 15 * 60 * 1000, // Auto-refresh every 15 minutes
  });
};