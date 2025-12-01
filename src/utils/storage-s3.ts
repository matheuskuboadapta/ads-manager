import AWS from 'aws-sdk';

// Configuração do S3 usando as credenciais fornecidas
const s3 = new AWS.S3({
  endpoint: 'https://ybzqouohzbstumyorivf.storage.supabase.co/storage/v1/s3',
  region: 'sa-east-1',
  accessKeyId: '613367b8a9e0b5fa4e8bc04b573ec4ea',
  secretAccessKey: 'b41fc30d6e3c3195f5b7c4cbcc71d8f9d8f3a82c74db295345879ed3e3ac2047',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

interface UploadResult {
  url: string;
  error?: string;
}

/**
 * Faz o download de um arquivo do Google Drive e faz upload para o S3 do Supabase
 * @param driveUrl - URL do arquivo no Google Drive
 * @param groupName - Nome do grupo de anúncios
 * @param index - Índice do anúncio no array
 * @returns URL do arquivo no S3 ou erro
 */
export async function uploadAdToS3(
  driveUrl: string,
  groupName: string,
  index: number
): Promise<UploadResult> {
  try {
    // Extrair o ID do arquivo do Google Drive
    const fileIdMatch = driveUrl.match(/\/d\/(.*?)\//);
    if (!fileIdMatch) {
      throw new Error('URL do Google Drive inválida');
    }
    const fileId = fileIdMatch[1];

    // URL direta para download do Google Drive
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    // Fazer o download do arquivo
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error('Erro ao baixar arquivo do Google Drive');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Determinar a extensão do arquivo baseada no tipo MIME
    const contentType = response.headers.get('content-type') || 'video/mp4';
    const extension = getFileExtension(contentType);
    
    // Criar um nome único para o arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${groupName.replace(/\s+/g, '-')}_${index + 1}_${timestamp}${extension}`;
    const key = `ads/${fileName}`;

    // Fazer upload para o S3
    const uploadParams = {
      Bucket: 'ads-storage',
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
      CacheControl: 'max-age=3600'
    };

    await s3.upload(uploadParams).promise();

    // Gerar a URL pública do arquivo
    const publicUrl = `https://ybzqouohzbstumyorivf.supabase.co/storage/v1/object/public/ads-storage/${key}`;

    return {
      url: publicUrl
    };
  } catch (error) {
    console.error('Erro no upload S3:', error);
    return {
      url: '',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Faz upload de múltiplos anúncios para o S3
 * @param driveUrls - Array de URLs do Google Drive
 * @param groupName - Nome do grupo de anúncios
 * @returns Array com as URLs do S3
 */
export async function uploadMultipleAdsToS3(
  driveUrls: string[],
  groupName: string
): Promise<{ success: string[]; failed: { url: string; error: string }[] }> {
  const results = await Promise.all(
    driveUrls.map((url, index) => 
      uploadAdToS3(url, groupName, index)
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

