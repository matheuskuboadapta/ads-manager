
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { useAccountsData } from '@/hooks/useAdsData';
import FilterBar from './FilterBar';
import ColumnOrderDialog from './ColumnOrderDialog';
import { useColumnOrder } from '@/hooks/useColumnOrder';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';

interface AccountsTabProps {
  onAccountSelect: (accountId: string) => void;
}

const AccountsTab = ({ onAccountSelect }: AccountsTabProps) => {
  const { columnOrders, updateColumnOrder, resetColumnOrder } = useColumnOrder();
  const { settings, updateDateFilter, updateNameFilter, updateStatusFilter } = useGlobalSettings();
  
  const { data: accounts, isLoading, error } = useAccountsData(settings.dateFilter);

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];

    return accounts.filter(account => {
      const matchesName = account.name.toLowerCase().includes(settings.nameFilter.toLowerCase());
      return matchesName;
    });
  }, [accounts, settings.nameFilter]);

  // Cálculo das métricas de resumo
  const summaryMetrics = useMemo(() => {
    if (!filteredAccounts.length) return null;

    const totalSpend = filteredAccounts.reduce((sum, acc) => sum + acc.spend, 0);
    const totalRevenue = filteredAccounts.reduce((sum, acc) => sum + acc.revenue, 0);
    const totalSales = filteredAccounts.reduce((sum, acc) => sum + acc.sales, 0);
    const totalProfit = filteredAccounts.reduce((sum, acc) => sum + acc.profit, 0);
    const totalClicks = filteredAccounts.reduce((sum, acc) => sum + acc.clicks, 0);
    const totalImpressions = filteredAccounts.reduce((sum, acc) => sum + acc.impressions, 0);

    return {
      spend: totalSpend,
      revenue: totalRevenue,
      sales: totalSales,
      profit: totalProfit,
      cpa: totalSales > 0 ? totalSpend / totalSales : 0,
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      clickCv: totalClicks > 0 ? (totalSales / totalClicks) * 100 : 0,
      epc: totalClicks > 0 ? totalRevenue / totalClicks : 0,
    };
  }, [filteredAccounts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600">Carregando contas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 mb-2">Erro ao carregar dados das contas</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-slate-600 mb-2">Nenhuma conta encontrada</p>
          <p className="text-slate-500 text-sm">Verifique se há dados na view meta_ads_view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Contas Publicitárias</h2>
          <p className="text-slate-600">Visualize e gerencie suas contas do Meta Ads</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="px-3 py-1">
            {filteredAccounts.length} contas
          </Badge>
          <ColumnOrderDialog
            columnOrder={columnOrders.accounts}
            onColumnOrderChange={(newOrder) => updateColumnOrder('accounts', newOrder)}
            onReset={() => resetColumnOrder('accounts')}
          />
        </div>
      </div>

      <FilterBar
        activeTab="accounts"
        onNameFilter={updateNameFilter}
        onStatusFilter={updateStatusFilter}
        onDateFilter={updateDateFilter}
        nameFilter={settings.nameFilter}
        statusFilter={settings.statusFilter}
        dateFilter={settings.dateFilter}
      />

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                {columnOrders.accounts.map((column) => {
                  const isRightAligned = column !== 'name';
                  return (
                    <TableHead 
                      key={column}
                      className={`font-semibold min-w-[80px] ${isRightAligned ? 'text-right' : ''} ${column === 'name' ? 'min-w-[200px]' : ''}`}
                    >
                      {column === 'name' && 'Nome da Conta'}
                      {column === 'spend' && 'Valor Gasto'}
                      {column === 'revenue' && 'Faturamento'}
                      {column === 'sales' && 'Vendas'}
                      {column === 'profit' && 'Profit'}
                      {column === 'cpa' && 'CPA'}
                      {column === 'cpm' && 'CPM'}
                      {column === 'roas' && 'ROAS'}
                      {column === 'ctr' && 'CTR'}
                      {column === 'clickCv' && 'Click CV'}
                      {column === 'epc' && 'EPC'}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id} className="hover:bg-slate-50">
                  {columnOrders.accounts.map((column) => {
                    const isRightAligned = column !== 'name';
                    
                    return (
                      <TableCell 
                        key={column}
                        className={`${isRightAligned ? 'text-right font-mono text-sm' : 'font-medium'}`}
                      >
                        {column === 'name' && (
                          <div 
                            className="flex items-center space-x-2 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => onAccountSelect(account.name)}
                          >
                            <BarChart3 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="underline-offset-4 hover:underline truncate">{account.name}</span>
                          </div>
                        )}
                        {column === 'spend' && formatCurrency(account.spend)}
                        {column === 'revenue' && (
                          <span className="text-green-600">{formatCurrency(account.revenue)}</span>
                        )}
                        {column === 'sales' && (
                          <span className="font-semibold">{account.sales}</span>
                        )}
                        {column === 'profit' && (
                          <span className={account.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(account.profit)}
                          </span>
                        )}
                        {column === 'cpa' && formatCurrency(account.cpa)}
                        {column === 'cpm' && formatCurrency(account.cpm)}
                        {column === 'roas' && (
                          <span className="font-semibold">{account.roas.toFixed(2)}x</span>
                        )}
                        {column === 'ctr' && formatPercentage(account.ctr)}
                        {column === 'clickCv' && formatPercentage(account.clickCv)}
                        {column === 'epc' && formatCurrency(account.epc)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              {summaryMetrics && (
                <TableRow className="bg-blue-50 border-t-2 border-blue-200 font-semibold">
                  {columnOrders.accounts.map((column) => {
                    const isRightAligned = column !== 'name';
                    
                    return (
                      <TableCell 
                        key={column}
                        className={`${isRightAligned ? 'text-right font-mono text-sm text-blue-900' : ''}`}
                      >
                        {column === 'name' && (
                          <span className="font-bold text-blue-900">
                            RESUMO ({filteredAccounts.length} contas)
                          </span>
                        )}
                        {column === 'spend' && formatCurrency(summaryMetrics.spend)}
                        {column === 'revenue' && (
                          <span className="text-green-700">{formatCurrency(summaryMetrics.revenue)}</span>
                        )}
                        {column === 'sales' && (
                          <span className="font-semibold">{summaryMetrics.sales}</span>
                        )}
                        {column === 'profit' && (
                          <span className={summaryMetrics.profit > 0 ? 'text-green-700' : 'text-red-700'}>
                            {formatCurrency(summaryMetrics.profit)}
                          </span>
                        )}
                        {column === 'cpa' && formatCurrency(summaryMetrics.cpa)}
                        {column === 'cpm' && formatCurrency(summaryMetrics.cpm)}
                        {column === 'roas' && (
                          <span className="font-semibold">{summaryMetrics.roas.toFixed(2)}x</span>
                        )}
                        {column === 'ctr' && formatPercentage(summaryMetrics.ctr)}
                        {column === 'clickCv' && formatPercentage(summaryMetrics.clickCv)}
                        {column === 'epc' && formatCurrency(summaryMetrics.epc)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AccountsTab;
