import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdLog {
  log_id: number;
  log_created_at: string;
  edit_details: string;
  metrics_details: any;
  user: string;
  object_id: string;
  level: string;
}

export const useAdLogs = (adId: string) => {
  return useQuery({
    queryKey: ['ad-logs', adId],
    queryFn: async (): Promise<AdLog[]> => {
      const { data, error } = await supabase.rpc('get_ad_logs', { 
        ad_id: adId 
      }) as { data: AdLog[] | null; error: any };

      if (error) {
        console.error('Error fetching ad logs:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!adId,
  });
};