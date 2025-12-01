# Guia de Debug - Erro de Upload

## 1. Verificar Console do Navegador

Abra o console do navegador (F12) e verifique os logs detalhados que foram adicionados. Procure por:

- `=== Iniciando processo de upload ===`
- `[Upload X]` - logs individuais de cada arquivo
- `=== Erro detalhado ===` - detalhes do erro

## 2. Testar Conexão com Storage

No console do navegador, execute:

```javascript
testStorageConnection()
```

Isso verificará:
- Se o bucket existe
- Se você tem permissão de upload
- Se o usuário está autenticado

## 3. Possíveis Causas do Erro

### A) Problema de CORS com Google Drive
**Sintomas:** Erro menciona CORS ou "blocked by CORS policy"

**Soluções:**
1. Garantir que os links do Drive são públicos ("Qualquer pessoa com o link pode ver")
2. Usar a implementação via Edge Function (veja abaixo)

### B) Bucket não existe
**Sintomas:** Erro menciona "bucket not found" ou "storage error"

**Solução:** Execute a migration no Supabase:
```sql
-- Create storage bucket for ads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ads-storage',
  'ads-storage',
  true,
  52428800,
  ARRAY['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
```

### C) Usuário não autenticado
**Sintomas:** Erro 401 ou "unauthorized"

**Solução:** Verificar se o usuário está logado antes de permitir upload

## 4. Soluções Alternativas

### Opção 1: Usar Edge Function (Recomendado para CORS)

1. Deploy a Edge Function:
```bash
supabase functions deploy download-and-upload
```

2. Modificar o import em UploadAds.tsx:
```typescript
// De:
import { uploadMultipleAds } from '@/utils/storage';

// Para:
import { uploadMultipleAdsViaEdge as uploadMultipleAds } from '@/utils/storage-edge';
```

### Opção 2: Usar S3 Diretamente

Modificar o import em UploadAds.tsx:
```typescript
// Para:
import { uploadMultipleAdsToS3 as uploadMultipleAds } from '@/utils/storage-s3';
```

### Opção 3: Upload Manual (Temporário)

Se nenhuma opção funcionar, você pode:
1. Fazer upload manual dos arquivos no Supabase Dashboard
2. Copiar as URLs públicas
3. Enviar diretamente para o webhook

## 5. Informações para Relatar

Se o erro persistir, colete estas informações:

1. **Logs completos do console**
2. **Resultado de `testStorageConnection()`**
3. **Network tab** - verifique requisições falhadas
4. **Tipo de arquivo** que está tentando enviar
5. **Tamanho dos arquivos**

## 6. Teste com Arquivo Pequeno

Para isolar o problema, tente com um link de imagem pequena do Drive:
```
https://drive.google.com/file/d/1L7FvteR8kE8KqO0PpPS_bxFCCuqmJu3c/view
```

Isso ajudará a identificar se é um problema de tamanho ou tipo de arquivo.

