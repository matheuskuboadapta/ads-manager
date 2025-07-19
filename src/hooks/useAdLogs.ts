
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

export const useAdLogs = (objectId: string) => {
  return useQuery({
    queryKey: ['ad-logs', objectId],
    queryFn: async (): Promise<AdLog[]> => {
      const { data, error } = await supabase.rpc('get_ad_logs', { 
        ad_id: objectId 
      }) as { data: AdLog[] | null; error: any };

      if (error) {
        console.error('Error fetching ad logs:', error);
        throw error;
      }

      // Parse metrics_details if it's a JSON string
      const processedData = (data || []).map(log => ({
        ...log,
        metrics_details: typeof log.metrics_details === 'string' 
          ? JSON.parse(log.metrics_details) 
          : log.metrics_details
      }));

      return processedData;
    },
    enabled: !!objectId,
  });
};
