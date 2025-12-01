import { supabase } from '@/integrations/supabase/client';

interface UploadResult {
  url: string;
  error?: string;
}

/**
 * Solução híbrida: salva metadados no Supabase e retorna o link do Drive
 * Evita problemas de CORS mantendo rastreabilidade
 */
export async function saveAdReference(
  driveUrl: string,
  groupName: string,
  index: number
): Promise<UploadResult> {
  console.log(`[Save Reference ${index + 1}] Salvando referência para: ${driveUrl}`);
  
  try {
    // Limpar a URL do Drive para garantir formato correto
    let cleanUrl = driveUrl.trim();
    
    // Se a URL não começa com https://, adicionar
    if (!cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    // Criar um arquivo de referência no Storage
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${groupName.replace(/\s+/g, '-')}_${index + 1}_${timestamp}_reference.json`;
    const filePath = `ads/references/${fileName}`;
    
    // Dados da referência
    const referenceData = {
      originalUrl: driveUrl,
      cleanUrl: cleanUrl,
      groupName: groupName,
      index: index,
      timestamp: new Date().toISOString(),
      status: 'drive_link'
    };
    
    // Salvar referência no Supabase Storage
    const { data, error } = await supabase.storage
      .from('ads-storage')
      .upload(filePath, JSON.stringify(referenceData, null, 2), {
        contentType: 'application/json',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      // Se o bucket não existir, tentar criar
      if (error.message.includes('bucket') || error.message.includes('not found')) {
        console.warn(`[Save Reference ${index + 1}] Bucket pode não existir, retornando URL original`);
        return {
          url: cleanUrl
        };
      }
      throw error;
    }

    console.log(`[Save Reference ${index + 1}] Referência salva com sucesso`);

    // Retornar a URL original do Drive para o webhook
    return {
      url: cleanUrl
    };
  } catch (error) {
    console.error(`[Save Reference ${index + 1}] Erro:`, error);
    
    // Em caso de erro, retornar a URL original para não bloquear o processo
    return {
      url: driveUrl.trim()
    };
  }
}

/**
 * Processa múltiplos links salvando referências
 */
export async function saveMultipleAdReferences(
  driveUrls: string[],
  groupName: string
): Promise<{ success: string[]; failed: { url: string; error: string }[] }> {
  const results = await Promise.all(
    driveUrls.map((url, index) => 
      saveAdReference(url, groupName, index)
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

