import { supabase } from '@/integrations/supabase/client';

interface UploadResult {
  url: string;
  error?: string;
}

/**
 * Faz o download de um arquivo do Google Drive e faz upload para o Supabase Storage
 * @param driveUrl - URL do arquivo no Google Drive
 * @param groupName - Nome do grupo de anúncios
 * @param index - Índice do anúncio no array
 * @returns URL do arquivo no Supabase Storage ou erro
 */
export async function uploadAdToSupabaseStorage(
  driveUrl: string,
  groupName: string,
  index: number
): Promise<UploadResult> {
  console.log(`[Upload ${index + 1}] Iniciando upload para URL: ${driveUrl}`);
  
  try {
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
    
    let fileId: string;
    let normalizedUrl: string;
    
    try {
      const result = normalizeGoogleDriveUrl(driveUrl);
      fileId = result.fileId;
      normalizedUrl = result.normalizedUrl;
      console.log(`[Upload ${index + 1}] ID extraído: ${fileId}`);
      console.log(`[Upload ${index + 1}] URL normalizada: ${normalizedUrl}`);
    } catch (error) {
      console.error(`[Upload ${index + 1}] Erro ao normalizar URL: ${driveUrl}`);
      throw error;
    }

    // URL direta para download do Google Drive
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    console.log(`[Upload ${index + 1}] URL de download: ${downloadUrl}`);

    // Fazer o download do arquivo
    console.log(`[Upload ${index + 1}] Iniciando download do Google Drive...`);
    const response = await fetch(downloadUrl);
    console.log(`[Upload ${index + 1}] Status do download: ${response.status}`);
    
    if (!response.ok) {
      console.error(`[Upload ${index + 1}] Erro no download - Status: ${response.status}, StatusText: ${response.statusText}`);
      throw new Error(`Erro ao baixar arquivo do Google Drive: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log(`[Upload ${index + 1}] Arquivo baixado - Tamanho: ${blob.size} bytes, Tipo: ${blob.type}`);
    
    // Determinar a extensão do arquivo baseada no tipo MIME
    const contentType = response.headers.get('content-type') || 'video/mp4';
    const extension = getFileExtension(contentType);
    
    // Criar um nome único para o arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${groupName.replace(/\s+/g, '-')}_${index + 1}_${timestamp}${extension}`;
    const filePath = `ads/${fileName}`;
    console.log(`[Upload ${index + 1}] Nome do arquivo: ${fileName}`);

    // Fazer upload para o Supabase Storage
    console.log(`[Upload ${index + 1}] Iniciando upload para Supabase Storage...`);
    const { data, error } = await supabase.storage
      .from('ads-storage') // Nome do bucket
      .upload(filePath, blob, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error(`[Upload ${index + 1}] Erro no upload para Supabase:`, error);
      throw error;
    }

    console.log(`[Upload ${index + 1}] Upload concluído com sucesso`);

    // Gerar a URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from('ads-storage')
      .getPublicUrl(filePath);

    console.log(`[Upload ${index + 1}] URL pública gerada: ${urlData.publicUrl}`);

    return {
      url: urlData.publicUrl
    };
  } catch (error) {
    console.error(`[Upload ${index + 1}] Erro completo:`, error);
    return {
      url: '',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Faz upload de múltiplos anúncios para o Supabase Storage
 * @param driveUrls - Array de URLs do Google Drive
 * @param groupName - Nome do grupo de anúncios
 * @returns Array com as URLs do Supabase Storage
 */
export async function uploadMultipleAds(
  driveUrls: string[],
  groupName: string
): Promise<{ success: string[]; failed: { url: string; error: string }[] }> {
  const results = await Promise.all(
    driveUrls.map((url, index) => 
      uploadAdToSupabaseStorage(url, groupName, index)
        .then(result => ({ url, result }))
    )
  );

  const success: string[] = [];
  const failed: { url: string; error: string }[] = [];

  results.forEach(({ url, result }) => {
    if (result.url && !result.error) {
      success.push(result.url);
    } else {
      failed.push({ url, error: result.error || 'Erro desconhecido' });
    }
  });

  return { success, failed };
}

/**
 * Determina a extensão do arquivo baseado no tipo MIME
 */
function getFileExtension(contentType: string): string {
  const mimeToExtension: Record<string, string> = {
    'video/mp4': '.mp4',
    'video/mpeg': '.mpeg',
    'video/quicktime': '.mov',
    'video/x-msvideo': '.avi',
    'video/webm': '.webm',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/octet-stream': '.mp4' // Padrão para vídeos
  };

  return mimeToExtension[contentType] || '.mp4';
}
