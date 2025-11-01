import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useActorOptions = () => {
  return useQuery({
    queryKey: ['actor-options'],
    queryFn: async () => {
      console.log('🔍 Buscando opções de ator da tabela ads_manager_actors...');
      
      try {
        // Consulta simples para buscar todos os atores
        const { data, error } = await supabase
          .from('ads_manager_actors')
          .select('actor');

        if (error) {
          console.error('❌ Erro ao buscar opções de ator:', error);
          console.error('Detalhes do erro:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        console.log('📊 Dados de atores recebidos:', data);

        if (!data || data.length === 0) {
          console.log('⚠️ Nenhum dado encontrado na tabela ads_manager_actors');
          // Retornar opções padrão se a tabela estiver vazia
          return ['Adapta', 'Carioca', 'Tramontina', 'Hanah', 'Zuker', 'Duda', 'Leda'];
        }

        // Extrair valores únicos da coluna actor
        const uniqueActors = Array.from(
          new Set(data.map(item => item.actor).filter(Boolean))
        ).sort();

        console.log('✅ Opções de ator extraídas:', uniqueActors);

        return uniqueActors;
      } catch (err) {
        console.error('💥 Erro geral na consulta de atores:', err);
        // Em caso de erro, retornar opções padrão
        console.log('🔄 Retornando opções padrão de atores devido ao erro');
        return ['Adapta', 'Carioca', 'Tramontina', 'Hanah', 'Zuker', 'Duda', 'Leda'];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1, // Reduzir tentativas
  });
};

