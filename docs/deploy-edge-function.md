# Deploy da Edge Function para Download e Upload

## Por que precisamos de uma Edge Function?

O navegador bloqueia downloads diretos do Google Drive devido ao CORS (Cross-Origin Resource Sharing). Para resolver isso, precisamos de um servidor intermediário (Edge Function) que:

1. Recebe a URL do Drive
2. Faz o download do arquivo (servidor-side, sem CORS)
3. Faz upload para o Supabase Storage
4. Retorna a URL do S3

## Como fazer o deploy

### 1. Instalar Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# ou via npm
npm install -g supabase
```

### 2. Login no Supabase

```bash
supabase login
```

### 3. Linkar ao projeto

```bash
cd /Users/matheuskubo/Downloads/ads-manager-main
supabase link --project-ref zpibemuugwxaachktrut
```

### 4. Deploy da Edge Function

```bash
supabase functions deploy download-and-upload
```

### 5. Testar a função

```bash
supabase functions invoke download-and-upload --body '{
  "driveUrl": "https://drive.google.com/file/d/1abc123/view",
  "groupName": "teste",
  "index": 0
}'
```

## Configurar permissões

No Supabase Dashboard:

1. Vá para Edge Functions
2. Encontre `download-and-upload`
3. Em Settings, marque "Allow anonymous invocations" se necessário

## Alternativa temporária

Enquanto a Edge Function não está deployada, você pode:

1. **Usar a versão que envia links do Drive diretamente** (sem upload para S3)
2. **Fazer upload manual** no Supabase Dashboard
3. **Usar um servidor proxy próprio**

## Solução definitiva

A Edge Function é a solução mais robusta porque:
- Não tem problemas de CORS
- Funciona com arquivos grandes
- É mais segura
- Integra diretamente com o Supabase Storage

## Troubleshooting

### Erro: "Failed to download file from Google Drive"
- Verifique se o arquivo no Drive é público
- Para arquivos privados, seria necessário implementar OAuth

### Erro: "Bucket not found"
- Execute a migration para criar o bucket `ads-storage`

### Arquivos grandes
- A função já lida com confirmação para arquivos grandes
- Limite atual: 50MB (configurável)

