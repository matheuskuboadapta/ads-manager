import { useState, useCallback, useEffect } from 'react';

// Definir as colunas padrão para cada tipo de tabela
export const DEFAULT_COLUMN_ORDERS = {
  accounts: [
    'status',
    'name', 
    'spend',
    'revenue',
    'sales',
    'profit',
    'cpa',
    'cpm',
    'roas',
    'ctr',
    'clickCv',
    'epc'
  ],
  campaigns: [
    'status',
    'name',
    'dailyBudget',
    'spend',
    'revenue', 
    'sales',
    'profit',
    'cpa',
    'cpm',
    'roas',
    'ctr',
    'clickCv',
    'epc'
  ],
  adsets: [
    'status',
    'name',
    'dailyBudget',
    'spend',
    'revenue',
    'sales', 
    'profit',
    'cpa',
    'cpm',
    'roas',
    'ctr',
    'clickCv',
    'epc'
  ],
  ads: [
    'status',
    'name',
    'spend',
    'revenue',
    'sales',
    'profit', 
    'cpa',
    'cpm',
    'roas',
    'ctr',
    'clickCv',
    'epc',
    'videoLink'
  ]
};

export const COLUMN_LABELS: Record<string, string> = {
  status: 'Status',
  name: 'Nome',
  objective: 'Objetivo',
  adFormat: 'Formato',
  dailyBudget: 'Orçamento Diário',
  spend: 'Valor Gasto',
  revenue: 'Faturamento',
  sales: 'Vendas',
  profit: 'Profit',
  cpa: 'CPA',
  cpm: 'CPM',
  roas: 'ROAS',
  ctr: 'CTR',
  clickCv: 'Click CV',
  epc: 'EPC',
  videoLink: 'Vídeo'
};

const STORAGE_KEY = 'ads-manager-column-orders';

export const useColumnOrder = () => {
  const [columnOrders, setColumnOrders] = useState(DEFAULT_COLUMN_ORDERS);

  // Carregar ordens das colunas do localStorage ao inicializar
  useEffect(() => {
    try {
      const savedOrders = localStorage.getItem(STORAGE_KEY);
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        setColumnOrders(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar ordem das colunas:', error);
    }
  }, []);

  // Salvar no localStorage sempre que a ordem mudar
  const saveColumnOrders = useCallback((newOrders: typeof DEFAULT_COLUMN_ORDERS) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
      setColumnOrders(newOrders);
    } catch (error) {
      console.error('Erro ao salvar ordem das colunas:', error);
    }
  }, []);

  const updateColumnOrder = useCallback((tableType: keyof typeof DEFAULT_COLUMN_ORDERS, newOrder: string[]) => {
    const newOrders = {
      ...columnOrders,
      [tableType]: newOrder
    };
    saveColumnOrders(newOrders);
  }, [columnOrders, saveColumnOrders]);

  const moveColumn = useCallback((tableType: keyof typeof DEFAULT_COLUMN_ORDERS, fromIndex: number, toIndex: number) => {
    const currentOrder = [...columnOrders[tableType]];
    const [movedColumn] = currentOrder.splice(fromIndex, 1);
    currentOrder.splice(toIndex, 0, movedColumn);
    
    const newOrders = {
      ...columnOrders,
      [tableType]: currentOrder
    };
    saveColumnOrders(newOrders);
  }, [columnOrders, saveColumnOrders]);

  const resetColumnOrder = useCallback((tableType: keyof typeof DEFAULT_COLUMN_ORDERS) => {
    const newOrders = {
      ...columnOrders,
      [tableType]: [...DEFAULT_COLUMN_ORDERS[tableType]]
    };
    saveColumnOrders(newOrders);
  }, [columnOrders, saveColumnOrders]);

  return {
    columnOrders,
    updateColumnOrder,
    moveColumn,
    resetColumnOrder
  };
};