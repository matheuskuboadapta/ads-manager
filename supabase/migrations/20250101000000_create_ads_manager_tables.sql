-- Create ads_manager_actors table
CREATE TABLE IF NOT EXISTS public.ads_manager_actors (
  id SERIAL PRIMARY KEY,
  actor VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ads_manager_copies table
CREATE TABLE IF NOT EXISTS public.ads_manager_copies (
  id SERIAL PRIMARY KEY,
  funnel VARCHAR NOT NULL,
  actor VARCHAR,
  ad_link TEXT,
  group_name VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.ads_manager_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads_manager_copies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read actors" ON public.ads_manager_actors;
DROP POLICY IF EXISTS "Allow authenticated users to read copies" ON public.ads_manager_copies;
DROP POLICY IF EXISTS "Allow authenticated users to insert actors" ON public.ads_manager_actors;
DROP POLICY IF EXISTS "Allow authenticated users to insert copies" ON public.ads_manager_copies;

-- Create policies to allow authenticated users to read from ads_manager_actors
CREATE POLICY "Allow authenticated users to read actors"
ON public.ads_manager_actors
FOR SELECT
TO authenticated
USING (true);

-- Create policies to allow authenticated users to read from ads_manager_copies
CREATE POLICY "Allow authenticated users to read copies"
ON public.ads_manager_copies
FOR SELECT
TO authenticated
USING (true);

-- Create policies to allow authenticated users to insert into ads_manager_actors
CREATE POLICY "Allow authenticated users to insert actors"
ON public.ads_manager_actors
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policies to allow authenticated users to insert into ads_manager_copies
CREATE POLICY "Allow authenticated users to insert copies"
ON public.ads_manager_copies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Insert some default data if tables are empty
INSERT INTO public.ads_manager_actors (actor)
SELECT * FROM (
  VALUES 
    ('Adapta'),
    ('Carioca'),
    ('Tramontina'),
    ('Hanah'),
    ('Zuker'),
    ('Duda'),
    ('Leda')
) AS t(actor)
WHERE NOT EXISTS (SELECT 1 FROM public.ads_manager_actors LIMIT 1);

INSERT INTO public.ads_manager_copies (funnel)
SELECT * FROM (
  VALUES 
    ('Tramontina'),
    ('Clube das IAs'),
    ('Pacote'),
    ('IA School')
) AS t(funnel)
WHERE NOT EXISTS (SELECT 1 FROM public.ads_manager_copies LIMIT 1);

