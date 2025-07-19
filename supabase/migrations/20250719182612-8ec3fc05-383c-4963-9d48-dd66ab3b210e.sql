-- Create function to get ad logs from ad_metrics_logs table
CREATE OR REPLACE FUNCTION public.get_ad_logs(ad_id text)
RETURNS TABLE (
  log_id integer,
  log_created_at timestamp with time zone,
  edit_details text,
  metrics_details json,
  "user" character varying,
  object_id character varying,
  level character varying
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aml.log_id,
    aml.log_created_at,
    aml.edit_details::text,
    aml.metrics_details,
    aml."user",
    aml.object_id,
    aml.level
  FROM public.ad_metrics_logs aml
  WHERE aml.object_id = ad_id
  ORDER BY aml.log_created_at DESC;
END;
$$;