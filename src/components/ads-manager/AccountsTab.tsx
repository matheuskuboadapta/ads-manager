
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, BarChart3 } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { useAccountsData } from '@/hooks/useAdsData';

interface AccountsTabProps {
  onAccountSelect: (accountId: string) => void;
}

const AccountsTab = ({ onAccountSelect }: AccountsTabProps) => {
  const { data: accounts, isLoading, error } = useAccountsData();

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
          {accounts.length} contas
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Nome da Conta</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Valor Gasto</TableHead>
              <TableHead className="font-semibold text-right">Faturamento</TableHead>
              <TableHead className="font-semibold text-right">Vendas</TableHead>
              <TableHead className="font-semibold text-right">Profit</TableHead>
              <TableHead className="font-semibold text-right">CPA</TableHead>
              <TableHead className="font-semibold text-right">ROAS</TableHead>
              <TableHead className="font-semibold text-right">CTR</TableHead>
              <TableHead className="font-semibold text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id} className="hover:bg-slate-50">
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span>{account.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={account.status === 'active' ? 'default' : 'secondary'}
                    className={account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  >
                    {account.status === 'active' ? 'Ativa' : 'Pausada'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(account.spend)}
                </TableCell>
                <TableCell className="text-right font-mono text-green-600">
                  {formatCurrency(account.revenue)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {account.sales}
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span className={account.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(account.profit)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(account.cpa)}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {account.roas.toFixed(2)}x
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPercentage(account.ctr)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    onClick={() => onAccountSelect(account.name)}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Ver Campanhas</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AccountsTab;
