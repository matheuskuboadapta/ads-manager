import { useState, useCallback, useEffect } from 'react';

// Definir as colunas padrão para cada tipo de tabela
export const DEFAULT_COLUMN_ORDERS = {
  accounts: [
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

// Colunas ocultas padrão (vazias)
export const DEFAULT_HIDDEN_COLUMNS = {
  accounts: [] as string[],
  campaigns: [] as string[],
  adsets: [] as string[],
  ads: [] as string[]
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
const HIDDEN_COLUMNS_KEY = 'ads-manager-hidden-columns';

export const useColumnOrder = () => {
  const [columnOrders, setColumnOrders] = useState(DEFAULT_COLUMN_ORDERS);
  const [hiddenColumns, setHiddenColumns] = useState(DEFAULT_HIDDEN_COLUMNS);

  // Carregar ordens das colunas do localStorage ao inicializar
  useEffect(() => {
    try {
      const savedOrders = localStorage.getItem(STORAGE_KEY);
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        
        // Migration: Remove 'status' column from accounts if it exists
        if (parsed.accounts && parsed.accounts.includes('status')) {
          parsed.accounts = parsed.accounts.filter((col: string) => col !== 'status');
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        
        setColumnOrders(parsed);
      }

      const savedHidden = localStorage.getItem(HIDDEN_COLUMNS_KEY);
      if (savedHidden) {
        const parsed = JSON.parse(savedHidden);
        setHiddenColumns(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações das colunas:', error);
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

  // Salvar colunas ocultas no localStorage
  const saveHiddenColumns = useCallback((newHidden: typeof DEFAULT_HIDDEN_COLUMNS) => {
    try {
      localStorage.setItem(HIDDEN_COLUMNS_KEY, JSON.stringify(newHidden));
      setHiddenColumns(newHidden);
    } catch (error) {
      console.error('Erro ao salvar colunas ocultas:', error);
    }
  }, []);

  const updateColumnOrder = useCallback((tableType: keyof typeof DEFAULT_COLUMN_ORDERS, newOrder: string[]) => {
    const newOrders = {
      ...columnOrders,
      [tableType]: newOrder
    };
    saveColumnOrders(newOrders);
  }, [columnOrders, saveColumnOrders]);

  const toggleColumnVisibility = useCallback((tableType: keyof typeof DEFAULT_COLUMN_ORDERS, column: string) => {
    const currentHidden = hiddenColumns[tableType];
    const isHidden = currentHidden.includes(column);
    
    const newHidden = {
      ...hiddenColumns,
      [tableType]: isHidden 
        ? currentHidden.filter(col => col !== column)
        : [...currentHidden, column]
    };
    
    saveHiddenColumns(newHidden);
  }, [hiddenColumns, saveHiddenColumns]);

  const getVisibleColumns = useCallback((tableType: keyof typeof DEFAULT_COLUMN_ORDERS) => {
    return columnOrders[tableType].filter(column => !hiddenColumns[tableType].includes(column));
  }, [columnOrders, hiddenColumns]);

  const getAllColumns = useCallback((tableType: keyof typeof DEFAULT_COLUMN_ORDERS) => {
    return columnOrders[tableType];
  }, [columnOrders]);

  const isColumnVisible = useCallback((tableType: keyof typeof DEFAULT_COLUMN_ORDERS, column: string) => {
    return !hiddenColumns[tableType].includes(column);
  }, [hiddenColumns]);

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
    const newHidden = {
      ...hiddenColumns,
      [tableType]: [...DEFAULT_HIDDEN_COLUMNS[tableType]]
    };
    saveColumnOrders(newOrders);
    saveHiddenColumns(newHidden);
  }, [columnOrders, hiddenColumns, saveColumnOrders, saveHiddenColumns]);

  return {
    columnOrders,
    hiddenColumns,
    updateColumnOrder,
    toggleColumnVisibility,
    getVisibleColumns,
    getAllColumns,
    isColumnVisible,
    moveColumn,
    resetColumnOrder
  };
};