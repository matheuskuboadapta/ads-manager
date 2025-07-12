
import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { useAccountsData } from '@/hooks/useAdsData';
import FilterBar, { DateFilter } from './FilterBar';

interface AccountsTabProps {
  onAccountSelect: (accountId: string) => void;
}

const AccountsTab = ({ onAccountSelect }: AccountsTabProps) => {
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter | null>(null);
  
  const { data: accounts, isLoading, error } = useAccountsData(dateFilter);

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];

    return accounts.filter(account => {
      const matchesName = account.name.toLowerCase().includes(nameFilter.toLowerCase());
      return matchesName;
    });
  }, [accounts, nameFilter]);

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
        <Badge variant="secondary" className="px-3 py-1">
          {filteredAccounts.length} contas
        </Badge>
      </div>

      <FilterBar
        activeTab="accounts"
        onNameFilter={setNameFilter}
        onStatusFilter={setStatusFilter}
        onDateFilter={setDateFilter}
        nameFilter={nameFilter}
        statusFilter={statusFilter}
        dateFilter={dateFilter}
      />

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold min-w-[200px]">Nome da Conta</TableHead>
                <TableHead className="font-semibold text-right min-w-[120px]">Valor Gasto</TableHead>
                <TableHead className="font-semibold text-right min-w-[120px]">Faturamento</TableHead>
                <TableHead className="font-semibold text-right min-w-[80px]">Vendas</TableHead>
                <TableHead className="font-semibold text-right min-w-[100px]">Profit</TableHead>
                <TableHead className="font-semibold text-right min-w-[80px]">CPA</TableHead>
                <TableHead className="font-semibold text-right min-w-[80px]">CPM</TableHead>
                <TableHead className="font-semibold text-right min-w-[80px]">ROAS</TableHead>
                <TableHead className="font-semibold text-right min-w-[80px]">CTR</TableHead>
                <TableHead className="font-semibold text-right min-w-[90px]">Click CV</TableHead>
                <TableHead className="font-semibold text-right min-w-[80px]">EPC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">
                    <div 
                      className="flex items-center space-x-2 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => onAccountSelect(account.name)}
                    >
                      <BarChart3 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="underline-offset-4 hover:underline truncate">{account.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(account.spend)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600 text-sm">
                    {formatCurrency(account.revenue)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm">
                    {account.sales}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    <span className={account.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(account.profit)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(account.cpa)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(account.cpm)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-sm">
                    {account.roas.toFixed(2)}x
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatPercentage(account.ctr)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatPercentage(account.clickCv)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(account.epc)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AccountsTab;
