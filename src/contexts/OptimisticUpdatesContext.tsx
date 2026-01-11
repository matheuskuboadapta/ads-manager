import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// TTL de 7 minutos em milissegundos
const UPDATE_TTL_MS = 7 * 60 * 1000;
// Intervalo de limpeza: 30 segundos
const CLEANUP_INTERVAL_MS = 30 * 1000;

interface OptimisticUpdate {
  data: Record<string, any>;
  timestamp: number;
  type: 'campaign' | 'adset' | 'ad';
}

interface OptimisticUpdatesContextType {
  getUpdates: (type: 'campaign' | 'adset' | 'ad') => Record<string, any>;
  updateOptimistic: (id: string, updates: Record<string, any>, type: 'campaign' | 'adset' | 'ad') => void;
  clearOptimistic: (id: string) => void;
  clearAllOptimistic: () => void;
}

const OptimisticUpdatesContext = createContext<OptimisticUpdatesContextType | undefined>(undefined);

interface OptimisticUpdatesProviderProps {
  children: ReactNode;
}

export function OptimisticUpdatesProvider({ children }: OptimisticUpdatesProviderProps) {
  const [updates, setUpdates] = useState<Map<string, OptimisticUpdate>>(new Map());

  // Limpa updates expirados a cada 30 segundos
  useEffect(() => {
    const cleanupExpiredUpdates = () => {
      const now = Date.now();
      setUpdates(prevUpdates => {
        const newUpdates = new Map(prevUpdates);
        let hasExpired = false;
        
        newUpdates.forEach((update, key) => {
          if (now - update.timestamp > UPDATE_TTL_MS) {
            newUpdates.delete(key);
            hasExpired = true;
            console.log(`[OptimisticUpdates] Expired update for ${key} (age: ${Math.round((now - update.timestamp) / 1000)}s)`);
          }
        });
        
        // Só retorna novo Map se algo foi removido
        return hasExpired ? newUpdates : prevUpdates;
      });
    };

    // Executa limpeza inicial
    cleanupExpiredUpdates();

    // Configura intervalo de limpeza
    const intervalId = setInterval(cleanupExpiredUpdates, CLEANUP_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  // Retorna updates filtrados por tipo
  const getUpdates = useCallback((type: 'campaign' | 'adset' | 'ad'): Record<string, any> => {
    const result: Record<string, any> = {};
    const now = Date.now();
    
    updates.forEach((update, key) => {
      // Filtra por tipo e verifica se ainda é válido (não expirado)
      if (update.type === type && (now - update.timestamp) <= UPDATE_TTL_MS) {
        result[key] = update.data;
      }
    });
    
    return result;
  }, [updates]);

  // Adiciona ou atualiza um optimistic update
  const updateOptimistic = useCallback((id: string, data: Record<string, any>, type: 'campaign' | 'adset' | 'ad') => {
    setUpdates(prevUpdates => {
      const newUpdates = new Map(prevUpdates);
      const existing = newUpdates.get(id);
      
      newUpdates.set(id, {
        data: existing ? { ...existing.data, ...data } : data,
        timestamp: Date.now(),
        type,
      });
      
      console.log(`[OptimisticUpdates] Updated ${type} ${id}:`, data);
      return newUpdates;
    });
  }, []);

  // Remove um optimistic update específico
  const clearOptimistic = useCallback((id: string) => {
    setUpdates(prevUpdates => {
      if (!prevUpdates.has(id)) return prevUpdates;
      
      const newUpdates = new Map(prevUpdates);
      newUpdates.delete(id);
      console.log(`[OptimisticUpdates] Cleared update for ${id}`);
      return newUpdates;
    });
  }, []);

  // Limpa todos os optimistic updates
  const clearAllOptimistic = useCallback(() => {
    setUpdates(new Map());
    console.log('[OptimisticUpdates] Cleared all updates');
  }, []);

  const value: OptimisticUpdatesContextType = {
    getUpdates,
    updateOptimistic,
    clearOptimistic,
    clearAllOptimistic,
  };

  return (
    <OptimisticUpdatesContext.Provider value={value}>
      {children}
    </OptimisticUpdatesContext.Provider>
  );
}

export function useOptimisticUpdates(): OptimisticUpdatesContextType {
  const context = useContext(OptimisticUpdatesContext);
  if (context === undefined) {
    throw new Error('useOptimisticUpdates must be used within an OptimisticUpdatesProvider');
  }
  return context;
}

