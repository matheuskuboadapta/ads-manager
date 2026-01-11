
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { formatCurrency, formatCurrencyNoDecimals, formatPercentage, getCPAColorClass } from '@/utils/formatters';
import { useAccountsData } from '@/hooks/useAdsData';
import FilterBar from './FilterBar';
import ColumnOrderDialog from './ColumnOrderDialog';
import { useColumnOrder } from '@/hooks/useColumnOrder';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { useTableSort } from '@/hooks/useTableSort';
import { useCustomSort } from '@/hooks/useCustomSort';
import { SortableHeader } from '@/components/ui/sortable-header';

interface AccountsTabProps {
  onAccountSelect: (accountId: string) => void;
}

const AccountsTab = ({ onAccountSelect }: AccountsTabProps) => {
  const { columnOrders, updateColumnOrder, resetColumnOrder, getVisibleColumns, getAllColumns, isColumnVisible, toggleColumnVisibility } = useColumnOrder();
  const { search: nameFilter, status: statusFilter, dateFilter, setSearch: updateNameFilter, setStatus: updateStatusFilter, setDateFilter: updateDateFilter } = useUrlFilters();
  
  // Sempre carregar dados, mesmo que o dateFilter seja null
  const { data: accounts, isLoading, error } = useAccountsData(dateFilter);

  // Apply custom sorting: first by sales (descending), then by spend (descending) as tiebreaker
  const customSortedAccounts = useCustomSort(accounts || []);

  // Keep table sort functionality for manual column sorting
  const { sortedData: sortedAccounts, handleSort, getSortDirection } = useTableSort(customSortedAccounts, { column: 'sales', direction: 'desc' });

  // Filtrar contas por nome
  const filteredAccounts = useMemo(() => {
    if (!sortedAccounts) return [];

    return sortedAccounts.filter(account => {
      const matchesName = account.name.toLowerCase().includes(nameFilter.toLowerCase());
      return matchesName;
    });
  }, [sortedAccounts, nameFilter]);

  // Cálculo das métricas de resumo
  const summaryMetrics = useMemo(() => {
    if (!filteredAccounts.length) {
      console.log('No accounts data available for the selected period');
      return {
        spend: 0,
        revenue: 0,
        sales: 0,
        profit: 0,
        cpa: 0,
        cpm: 0,
        roas: 0,
        ctr: 0,
        clickCv: 0,
        epc: 0,
      };
    }

    const totalSpend = filteredAccounts.reduce((sum, acc) => sum + acc.spend, 0);
    const totalRevenue = filteredAccounts.reduce((sum, acc) => sum + acc.revenue, 0);
    const totalSales = filteredAccounts.reduce((sum, acc) => sum + acc.sales, 0);
    const totalProfit = filteredAccounts.reduce((sum, acc) => sum + acc.profit, 0);
    const totalClicks = filteredAccounts.reduce((sum, acc) => sum + acc.clicks, 0);
    const totalImpressions = filteredAccounts.reduce((sum, acc) => sum + acc.impressions, 0);

    console.log('Summary metrics calculated for period:', {
      accountsCount: filteredAccounts.length,
      totalSpend,
      totalSales,
      totalRevenue,
      totalProfit
    });

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

  return (
    <div className="space-y-4">
      {/* Header sempre visível */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Contas Publicitárias</h2>
          <p className="text-muted-foreground">Visualize e gerencie suas contas do Meta Ads</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="px-3 py-1">
            {filteredAccounts.length} contas
          </Badge>
          <ColumnOrderDialog
            tableType="accounts"
            columnOrder={getVisibleColumns('accounts')}
            onColumnOrderChange={(newOrder) => updateColumnOrder('accounts', newOrder)}
            onReset={() => resetColumnOrder('accounts')}
            getAllColumns={() => getAllColumns('accounts')}
            isColumnVisible={(column) => isColumnVisible('accounts', column)}
            toggleColumnVisibility={(column) => toggleColumnVisibility('accounts', column)}
          />
        </div>

      </div>

      {/* FilterBar sempre visível */}
      <FilterBar
        activeTab="accounts"
        onNameFilter={updateNameFilter}
        onStatusFilter={updateStatusFilter}
        onDateFilter={updateDateFilter}
        nameFilter={nameFilter}
        statusFilter={statusFilter}
        dateFilter={dateFilter}
      />

      {/* Tabela sempre visível */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="overflow-x-auto chat-table-container">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                {getVisibleColumns('accounts').map((column) => {
                  const isRightAligned = column !== 'name';
                  const isSortable = !['name'].includes(column); // Exclude name column from sorting
                  const sortDirection = getSortDirection(column);
                  
                  return (
                    <TableHead 
                      key={column}
                      className={`font-semibold min-w-[80px] ${isRightAligned ? 'text-right' : ''} ${column === 'name' ? 'min-w-[200px]' : ''}`}
                    >
                      {isSortable ? (
                        <SortableHeader
                          column={column}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                          className={`${isRightAligned ? 'justify-end' : ''}`}
                        >
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
                        </SortableHeader>
                      ) : (
                        <>
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
                        </>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Loading state */}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={getVisibleColumns('accounts').length} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-slate-600">Carregando contas...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* Error state */}
              {error && !isLoading && (
                <TableRow>
                  <TableCell colSpan={getVisibleColumns('accounts').length} className="text-center py-8">
                    <div className="text-center">
                      <p className="text-red-600 mb-2">Erro ao carregar dados das contas</p>
                      <p className="text-slate-500 text-sm">{error.message}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* Empty state */}
              {!isLoading && !error && (!accounts || accounts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={getVisibleColumns('accounts').length} className="text-center py-8">
                    <div className="text-center">
                      <p className="text-slate-600 mb-2">Nenhuma conta encontrada</p>
                      <p className="text-slate-500 text-sm">Verifique se há dados na view meta_ads_view</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* Data rows */}
              {!isLoading && !error && filteredAccounts.map((account) => (
                <TableRow key={account.id} className="hover:bg-slate-50">
                  {getVisibleColumns('accounts').map((column) => {
                    const isRightAligned = column !== 'name';
                    
                    return (
                      <TableCell 
                        key={column}
                        className={`${isRightAligned ? 'text-right font-mono text-sm' : 'font-medium'} ${column === 'cpa' ? getCPAColorClass(account.cpa, filteredAccounts.map(a => a.cpa)) : ''}`}
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
                        {column === 'cpm' && formatCurrencyNoDecimals(account.cpm)}
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

              {/* Summary row */}
              {summaryMetrics && (
                <TableRow className="bg-blue-50 border-t-2 border-blue-200 font-semibold">
                  {getVisibleColumns('accounts').map((column) => {
                    const isRightAligned = column !== 'name';
                    
                    return (
                      <TableCell 
                        key={column}
                        className={`${isRightAligned ? 'text-right font-mono text-sm' : 'font-medium'}`}
                      >
                        {column === 'name' && 'Total'}
                        {column === 'spend' && formatCurrency(summaryMetrics.spend)}
                        {column === 'revenue' && (
                          <span className="text-green-600">{formatCurrency(summaryMetrics.revenue)}</span>
                        )}
                        {column === 'sales' && (
                          <span className="font-semibold">{summaryMetrics.sales}</span>
                        )}
                        {column === 'profit' && (
                          <span className={summaryMetrics.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(summaryMetrics.profit)}
                          </span>
                        )}
                        {column === 'cpa' && formatCurrency(summaryMetrics.cpa)}
                        {column === 'cpm' && formatCurrencyNoDecimals(summaryMetrics.cpm)}
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

