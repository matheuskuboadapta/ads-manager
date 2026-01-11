# Troubleshooting: Tab de Regras Vazia

## 🔍 Componente de Debug Adicionado

Adicionei um componente de debug na tab de Regras que vai mostrar exatamente qual é o problema. Quando você acessar a tab de Regras agora, verá um card de debug com 3 testes:

1. **Authentication Check** - Verifica se o usuário está autenticado
2. **Query ad_rules** - Tenta buscar dados da tabela ad_rules
3. **Check RLS Policies** - Verifica as políticas de RLS

## 📋 Possíveis Problemas e Soluções

### Problema 1: RLS Bloqueando Acesso (Mais Provável)

**Sintoma:** O teste "Query ad_rules" falha com erro de permissão.

**Solução:** Execute este SQL no Supabase Dashboard:

```sql
-- 1. Verificar se RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'ad_rules';

-- 2. Se rowsecurity = true, verificar políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'ad_rules';

-- 3. Adicionar políticas necessárias
ALTER TABLE public.ad_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read ad_rules" ON public.ad_rules;
DROP POLICY IF EXISTS "Allow authenticated users to insert ad_rules" ON public.ad_rules;
DROP POLICY IF EXISTS "Allow authenticated users to update ad_rules" ON public.ad_rules;
DROP POLICY IF EXISTS "Allow authenticated users to delete ad_rules" ON public.ad_rules;

CREATE POLICY "Allow authenticated users to read ad_rules"
ON public.ad_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert ad_rules"
ON public.ad_rules FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update ad_rules"
ON public.ad_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete ad_rules"
ON public.ad_rules FOR DELETE TO authenticated USING (true);
```

### Problema 2: Tabela Vazia (Sem Dados)

**Sintoma:** O teste "Query ad_rules" tem sucesso mas retorna count = 0.

**Solução:** Inserir dados de teste:

```sql
-- Verificar se há dados
SELECT COUNT(*) FROM ad_rules;

-- Se não houver, inserir regra de teste
INSERT INTO ad_rules (name, is_active, level, conditions, actions, description)
VALUES 
  ('Regra de Teste 1', true, 'campaign', 
   '{"filters": [{"field": "spend", "operator": "GREATER_THAN", "value": 100}]}'::jsonb,
   '{"execution_type": "NOTIFY", "execution_options": []}'::jsonb,
   'Regra de teste para verificar funcionamento'),
  ('Regra de Teste 2', false, 'adset',
   '{"filters": [{"field": "cpa", "operator": "GREATER_THAN", "value": 50}]}'::jsonb,
   '{"execution_type": "PAUSE", "execution_options": []}'::jsonb,
   'Regra pausada de teste');

-- Verificar se foram inseridas
SELECT id, name, is_active, level, created_at FROM ad_rules;
```

### Problema 3: Usuário Não Autenticado

**Sintoma:** O teste "Authentication Check" falha.

**Solução:** 
1. Fazer logout e login novamente
2. Limpar localStorage: `localStorage.clear()` no console do navegador
3. Recarregar a página

### Problema 4: Tabela não existe

**Sintoma:** Erro "relation 'ad_rules' does not exist"

**Solução:** Criar a tabela:

```sql
CREATE TABLE IF NOT EXISTS public.ad_rules (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  level VARCHAR NOT NULL,
  target_id VARCHAR,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  sql_query TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ad_rules_is_active ON public.ad_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_ad_rules_level ON public.ad_rules(level);
CREATE INDEX IF NOT EXISTS idx_ad_rules_created_at ON public.ad_rules(created_at DESC);
```

## 🧪 Como Usar o Debug

1. Acesse a aplicação
2. Vá para a tab "Regras"
3. Veja o card "Debug: ad_rules Table Access"
4. Clique em cada teste para ver os detalhes
5. Se houver erros, expanda "Error Details" para ver mais informações
6. Use as soluções acima baseado no erro específico

## 🗑️ Remover o Debug Depois

Após resolver o problema, remova o componente de debug:

1. Abra `/src/components/ads-manager/RulesTab.tsx`
2. Remova a linha: `import { RulesDebug } from './RulesDebug';`
3. Remova as linhas: `<RulesDebug />` (há 2 ocorrências, uma no mobile e uma no desktop)
4. Opcional: Delete o arquivo `/src/components/ads-manager/RulesDebug.tsx`

## 📞 Informações Úteis

**URL do Supabase:** https://zpibemuugwxaachktrut.supabase.co

**Tabelas relacionadas:**
- `ad_rules` - Tabela principal de regras
- `ad_rules_logs` - Logs de execução das regras
- `ad_tasks` - Tarefas agendadas pelas regras

## 🔗 Links Úteis

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Documentação RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [SQL Editor no Supabase](https://supabase.com/dashboard/project/_/sql)


