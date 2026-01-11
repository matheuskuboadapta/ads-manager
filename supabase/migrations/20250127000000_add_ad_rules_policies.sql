-- Enable Row Level Security for ad_rules table
ALTER TABLE public.ad_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read ad_rules" ON public.ad_rules;
DROP POLICY IF EXISTS "Allow authenticated users to insert ad_rules" ON public.ad_rules;
DROP POLICY IF EXISTS "Allow authenticated users to update ad_rules" ON public.ad_rules;
DROP POLICY IF EXISTS "Allow authenticated users to delete ad_rules" ON public.ad_rules;

-- Create policy to allow authenticated users to read from ad_rules
CREATE POLICY "Allow authenticated users to read ad_rules"
ON public.ad_rules
FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated users to insert into ad_rules
CREATE POLICY "Allow authenticated users to insert ad_rules"
ON public.ad_rules
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update ad_rules
CREATE POLICY "Allow authenticated users to update ad_rules"
ON public.ad_rules
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to delete from ad_rules
CREATE POLICY "Allow authenticated users to delete ad_rules"
ON public.ad_rules
FOR DELETE
TO authenticated
USING (true);


