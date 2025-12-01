# Integração com Supabase Storage

## Visão Geral

A integração foi implementada para fazer upload dos anúncios para o Supabase Storage antes de enviar os links para o webhook. Isso garante que os arquivos estejam hospedados em um local confiável e acessível.

## Implementações Disponíveis

### 1. Via API do Supabase (Recomendado)

**Arquivo:** `src/utils/storage.ts`

Esta implementação usa a API oficial do Supabase Client. É a opção mais simples e integrada.

**Vantagens:**
- Usa a autenticação existente do Supabase
- Integração nativa com o cliente já configurado
- Gerenciamento automático de políticas RLS

### 2. Via S3 API Diretamente

**Arquivo:** `src/utils/storage-s3.ts`

Esta implementação usa o AWS SDK para conectar diretamente ao S3 endpoint do Supabase.

**Vantagens:**
- Controle mais direto sobre o upload
- Compatível com outras ferramentas S3
- Usa as credenciais S3 fornecidas

## Fluxo de Upload

1. Usuário cola os links do Google Drive no formulário
2. Ao submeter, o sistema:
   - Baixa cada arquivo do Google Drive
   - Faz upload para o Supabase Storage
   - Coleta as URLs públicas dos arquivos
   - Envia as URLs do Storage para o webhook

## Configuração do Bucket

O bucket `ads-storage` é criado automaticamente pela migration:
- **Nome:** ads-storage
- **Público:** Sim (para acesso direto aos anúncios)
- **Limite de tamanho:** 50MB por arquivo
- **Tipos permitidos:** Vídeos (MP4, MPEG, MOV, AVI, WebM) e Imagens (JPEG, PNG, GIF, WebP)

## Alternar Entre Implementações

Para usar a implementação S3 em vez da padrão, modifique o import em `UploadAds.tsx`:

```typescript
// De:
import { uploadMultipleAds } from '@/utils/storage';

// Para:
import { uploadMultipleAdsToS3 as uploadMultipleAds } from '@/utils/storage-s3';
```

## Troubleshooting

### Erro de CORS
Se houver problemas de CORS ao baixar do Google Drive, considere implementar um proxy server ou usar uma Edge Function do Supabase.

### Arquivo muito grande
O limite atual é 50MB. Para arquivos maiores, ajuste o `file_size_limit` na migration do bucket.

### Erro de autenticação
Verifique se o usuário está autenticado no Supabase antes de permitir o upload.

