import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFunnelOptions = () => {
  return useQuery({
    queryKey: ['funnel-options'],
    queryFn: async () => {
      console.log('🔍 Buscando opções de funil da tabela ads_manager_copies...');
      
      try {
        // Consulta simples para buscar todos os funis
        const { data, error } = await supabase
          .from('ads_manager_copies')
          .select('funnel');

        if (error) {
          console.error('❌ Erro ao buscar opções de funil:', error);
          console.error('Detalhes do erro:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        console.log('📊 Dados recebidos:', data);

        if (!data || data.length === 0) {
          console.log('⚠️ Nenhum dado encontrado na tabela ads_manager_copies');
          // Retornar opções padrão se a tabela estiver vazia
          return ['Tramontina', 'Clube das IAs', 'Pacote', 'IA School'];
        }

        // Extrair valores únicos da coluna funnel
        const uniqueFunnels = Array.from(
          new Set(data.map(item => item.funnel).filter(Boolean))
        ).sort();

        console.log('✅ Opções de funil extraídas:', uniqueFunnels);

        return uniqueFunnels;
      } catch (err) {
        console.error('💥 Erro geral na consulta:', err);
        // Em caso de erro, retornar opções padrão
        console.log('🔄 Retornando opções padrão devido ao erro');
        return ['Tramontina', 'Clube das IAs', 'Pacote', 'IA School'];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1, // Reduzir tentativas
  });
};
