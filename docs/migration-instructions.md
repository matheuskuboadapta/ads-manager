# Instruções para Aplicar a Migration

## Problema Identificado

A aba de Upload de Ads não estava listando os funis porque as tabelas `ads_manager_copies` e `ads_manager_actors` não existiam no banco de dados ou não tinham as permissões corretas configuradas.

## Solução

Foi criada uma migration SQL que:
1. Cria as tabelas necessárias (`ads_manager_actors` e `ads_manager_copies`)
2. Configura as permissões RLS (Row Level Security)
3. Insere dados padrão nas tabelas

## Como Aplicar a Migration

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o Dashboard do Supabase (https://app.supabase.com)
2. Selecione seu projeto
3. Vá para a seção **SQL Editor**
4. Copie o conteúdo do arquivo `supabase/migrations/20250101000000_create_ads_manager_tables.sql`
5. Cole no editor SQL e clique em **Run**

### Opção 2: Via Supabase CLI

Se você tem o Supabase CLI instalado:

```bash
# Instalar o Supabase CLI (se necessário)
npm install -g supabase

# Fazer login
supabase login

# Aplicar as migrations
supabase db push
```

## Verificação

Após aplicar a migration, você pode verificar se as tabelas foram criadas executando:

```sql
-- Verificar se as tabelas existem
SELECT * FROM public.ads_manager_actors LIMIT 5;
SELECT * FROM public.ads_manager_copies LIMIT 5;

-- Verificar se as políticas RLS foram criadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('ads_manager_actors', 'ads_manager_copies');
```

## Estrutura das Tabelas

### ads_manager_actors
- `id`: SERIAL PRIMARY KEY
- `actor`: VARCHAR NOT NULL
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

### ads_manager_copies
- `id`: SERIAL PRIMARY KEY
- `funnel`: VARCHAR NOT NULL
- `actor`: VARCHAR
- `ad_link`: TEXT
- `group_name`: VARCHAR
- `created_at`: TIMESTAMPTZ DEFAULT NOW()

## Como Adicionar Novos Funis e Atores

Após aplicar a migration, você pode adicionar novos funis e atores diretamente no banco:

```sql
-- Adicionar novo ator
INSERT INTO public.ads_manager_actors (actor) VALUES ('Nome do Ator');

-- Adicionar novo funil
INSERT INTO public.ads_manager_copies (funnel) VALUES ('Nome do Funil');
```

## Testando a Funcionalidade

1. Acesse a aba de Upload de Ads na aplicação
2. Clique no campo "Funil"
3. Verifique se os funis da tabela `ads_manager_copies` estão sendo listados
4. Clique no campo "Ator"
5. Verifique se os atores da tabela `ads_manager_actors` estão sendo listados

Se os dados não aparecerem, verifique o console do navegador (F12) para ver os logs de debug.

