import { supabase } from '@/integrations/supabase/client';

/**
 * Testa a conexão e configuração do Supabase Storage
 */
export async function testStorageConnection() {
  console.log('=== Testando conexão com Supabase Storage ===');
  
  try {
    // 1. Verificar se o bucket existe
    console.log('1. Verificando buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Erro ao listar buckets:', bucketsError);
    } else {
      console.log('Buckets disponíveis:', buckets);
      
      const adsStorage = buckets?.find(b => b.id === 'ads-storage' || b.name === 'ads-storage');
      if (adsStorage) {
        console.log('✓ Bucket ads-storage encontrado:', adsStorage);
      } else {
        console.error('✗ Bucket ads-storage NÃO encontrado!');
        console.log('Buckets existentes:', buckets?.map(b => b.name).join(', '));
      }
    }
    
    // 2. Tentar fazer upload de um arquivo de teste
    console.log('\n2. Testando upload...');
    const testBlob = new Blob(['Test file content'], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ads-storage')
      .upload(testFileName, testBlob);
    
    if (uploadError) {
      console.error('Erro no upload de teste:', uploadError);
    } else {
      console.log('✓ Upload de teste bem-sucedido:', uploadData);
      
      // 3. Tentar obter URL pública
      const { data: urlData } = supabase.storage
        .from('ads-storage')
        .getPublicUrl(testFileName);
      
      console.log('✓ URL pública gerada:', urlData.publicUrl);
      
      // 4. Limpar arquivo de teste
      const { error: deleteError } = await supabase.storage
        .from('ads-storage')
        .remove([testFileName]);
      
      if (deleteError) {
        console.error('Erro ao deletar arquivo de teste:', deleteError);
      } else {
        console.log('✓ Arquivo de teste removido');
      }
    }
    
    // 5. Verificar autenticação
    console.log('\n3. Verificando autenticação...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Erro de autenticação:', authError);
    } else if (user) {
      console.log('✓ Usuário autenticado:', user.email);
    } else {
      console.warn('⚠ Nenhum usuário autenticado');
    }
    
  } catch (error) {
    console.error('Erro geral no teste:', error);
  }
  
  console.log('=== Fim do teste ===');
}

// Executar teste automaticamente quando o módulo for importado
if (typeof window !== 'undefined') {
  window.testStorageConnection = testStorageConnection;
  console.log('Para testar o storage, execute: testStorageConnection()');
}

