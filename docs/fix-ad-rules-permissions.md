# Como Corrigir as Permissões da Tabela ad_rules

## Problema
A tab de Regras está vazia porque a tabela `ad_rules` tem Row Level Security (RLS) habilitado mas não tem políticas configuradas, bloqueando o acesso aos dados.

## Solução

Execute o seguinte SQL no **SQL Editor** do Supabase Dashboard:

```sql
-- Enable Row Level Security for ad_rules table (se ainda não estiver habilitado)
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
```

## Passos:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Cole o SQL acima
5. Clique em **Run** ou pressione `Ctrl/Cmd + Enter`
6. Recarregue a página do Ads Manager

## Verificação

Após executar o SQL, você pode verificar se as políticas foram criadas:

```sql
-- Verificar políticas da tabela ad_rules
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'ad_rules';
```

## Verificar se há dados na tabela

```sql
-- Ver quantas regras existem
SELECT COUNT(*) FROM ad_rules;

-- Ver as primeiras 10 regras
SELECT id, name, is_active, created_at FROM ad_rules LIMIT 10;
```

Se não houver dados, você pode inserir uma regra de teste:

```sql
INSERT INTO ad_rules (name, is_active, level, conditions, actions)
VALUES (
  'Regra de Teste',
  true,
  'campaign',
  '{"filters": []}'::jsonb,
  '{"execution_type": "NOTIFY"}'::jsonb
);
```

