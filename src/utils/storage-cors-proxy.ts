import { supabase } from '@/integrations/supabase/client';

interface UploadResult {
  url: string;
  error?: string;
}

// Normalizar URL do Google Drive usando o padrão do n8n
function normalizeGoogleDriveUrl(url: string): { fileId: string; normalizedUrl: string } {
  const match = url.match(/[?&/](?:id=|d\/)([a-zA-Z0-9_-]+)/);
  
  if (!match || !match[1]) {
    throw new Error('URL do Google Drive inválida');
  }
  
  const fileId = match[1];
  const normalizedUrl = `https://drive.google.com/file/d/${fileId}/view?usp=drive_link`;
  
  return { fileId, normalizedUrl };
}

/**
 * Faz download via proxy CORS e upload para Supabase
 */
export async function uploadAdViaCorsProxy(
  driveUrl: string,
  groupName: string,
  index: number
): Promise<UploadResult> {
  console.log(`[Upload CORS Proxy ${index + 1}] Iniciando upload: ${driveUrl}`);
  
  try {
    // Normalizar URL
    const { fileId } = normalizeGoogleDriveUrl(driveUrl);
    console.log(`[Upload CORS Proxy ${index + 1}] File ID: ${fileId}`);
    
    // URLs de download do Google Drive
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    // Usar proxy CORS público (temporário para testes)
    // NOTA: Em produção, use sua própria Edge Function ou servidor proxy
    const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(downloadUrl)}`;
    
    console.log(`[Upload CORS Proxy ${index + 1}] Tentando download via proxy...`);
    
    let blob: Blob;
    let contentType = 'video/mp4';
    
    try {
      // Tentar download via proxy
      const response = await fetch(corsProxyUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      blob = await response.blob();
      contentType = response.headers.get('content-type') || 'video/mp4';
      
      console.log(`[Upload CORS Proxy ${index + 1}] Download concluído: ${blob.size} bytes`);
    } catch (proxyError) {
      console.error(`[Upload CORS Proxy ${index + 1}] Erro no proxy, tentando método alternativo...`);
      
      // Método alternativo: criar um iframe invisível para baixar
      // Este método funciona apenas se o arquivo for público
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = downloadUrl;
      document.body.appendChild(iframe);
      
      // Aguardar um pouco e remover
      await new Promise(resolve => setTimeout(resolve, 2000));
      document.body.removeChild(iframe);
      
      // Como não conseguimos obter o blob diretamente, vamos salvar apenas a referência
      throw new Error('Download direto não disponível, use Edge Function do Supabase');
    }
    
    // Determinar extensão
    const extensionMap: Record<string, string> = {
      'video/mp4': '.mp4',
      'video/mpeg': '.mpeg',
      'video/quicktime': '.mov',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'application/octet-stream': '.mp4'
    };
    const extension = extensionMap[contentType] || '.mp4';
    
    // Criar nome único
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${groupName.replace(/\s+/g, '-')}_${index + 1}_${timestamp}${extension}`;
    const filePath = `ads/${fileName}`;
    
    console.log(`[Upload CORS Proxy ${index + 1}] Fazendo upload para Supabase...`);
    
    // Upload para Supabase
    const { data, error } = await supabase.storage
      .from('ads-storage')
      .upload(filePath, blob, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error(`[Upload CORS Proxy ${index + 1}] Erro no upload:`, error);
      throw error;
    }

    // Gerar URL pública
    const { data: urlData } = supabase.storage
      .from('ads-storage')
      .getPublicUrl(filePath);

    console.log(`[Upload CORS Proxy ${index + 1}] Upload concluído: ${urlData.publicUrl}`);

    return {
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error(`[Upload CORS Proxy ${index + 1}] Erro completo:`, error);
    return {
      url: '',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Upload múltiplo via CORS proxy
 */
export async function uploadMultipleAdsViaCorsProxy(
  driveUrls: string[],
  groupName: string
): Promise<{ success: string[]; failed: { url: string; error: string }[] }> {
  // Processar um por vez para não sobrecarregar o proxy
  const success: string[] = [];
  const failed: { url: string; error: string }[] = [];
  
  for (let i = 0; i < driveUrls.length; i++) {
    const url = driveUrls[i];
    const result = await uploadAdViaCorsProxy(url, groupName, i);
    
    if (result.url && !result.error) {
      success.push(result.url);
    } else {
      failed.push({ url, error: result.error || 'Erro desconhecido' });
    }
    
    // Pequeno delay entre requisições
    if (i < driveUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { success, failed };
}

