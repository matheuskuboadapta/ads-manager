import { useState, useCallback } from 'react';

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

export const useColumnOrder = () => {
  const [columnOrders, setColumnOrders] = useState(DEFAULT_COLUMN_ORDERS);

  const updateColumnOrder = useCallback((tableType: keyof typeof DEFAULT_COLUMN_ORDERS, newOrder: string[]) => {
    setColumnOrders(prev => ({
      ...prev,
      [tableType]: newOrder
    }));
  }, []);

  const moveColumn = useCallback((tableType: keyof typeof DEFAULT_COLUMN_ORDERS, fromIndex: number, toIndex: number) => {
    setColumnOrders(prev => {
      const currentOrder = [...prev[tableType]];
      const [movedColumn] = currentOrder.splice(fromIndex, 1);
      currentOrder.splice(toIndex, 0, movedColumn);
      
      return {
        ...prev,
        [tableType]: currentOrder
      };
    });
  }, []);

  const resetColumnOrder = useCallback((tableType: keyof typeof DEFAULT_COLUMN_ORDERS) => {
    setColumnOrders(prev => ({
      ...prev,
      [tableType]: [...DEFAULT_COLUMN_ORDERS[tableType]]
    }));
  }, []);

  return {
    columnOrders,
    updateColumnOrder,
    moveColumn,
    resetColumnOrder
  };
};