
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, BarChart3 } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatters';

interface Account {
  id: string;
  name: string;
  status: 'active' | 'paused';
  spend: number;
  revenue: number;
  sales: number;
  profit: number;
  cpa: number;
  clicks: number;
  cpm: number;
  cpc: number;
  ctr: number;
  clickCv: number;
  epc: number;
  roas: number;
}

interface AccountsTabProps {
  onAccountSelect: (accountId: string) => void;
}

// Mock data - em produção virá do PostgreSQL
const mockAccounts: Account[] = [
  {
    id: 'acc_001',
    name: 'Adapta Beauty - Principal',
    status: 'active',
    spend: 15420.50,
    revenue: 52800.30,
    sales: 142,
    profit: 37379.80,
    cpa: 108.60,
    clicks: 2847,
    cpm: 12.45,
    cpc: 5.42,
    ctr: 2.3,
    clickCv: 4.98,
    epc: 18.54,
    roas: 3.42
  },
  {
    id: 'acc_002',
    name: 'Adapta Health - Suplementos',
    status: 'active',
    spend: 8760.25,
    revenue: 24150.80,
    sales: 89,
    profit: 15390.55,
    cpa: 98.43,
    clicks: 1654,
    cpm: 15.30,
    cpc: 5.30,
    ctr: 2.89,
    clickCv: 5.38,
    epc: 14.60,
    roas: 2.76
  },
  {
    id: 'acc_003',
    name: 'Adapta Fashion - Outlet',
    status: 'paused',
    spend: 3240.10,
    revenue: 8975.20,
    sales: 34,
    profit: 5735.10,
    cpa: 95.30,
    clicks: 890,
    cpm: 11.20,
    cpc: 3.64,
    ctr: 3.07,
    clickCv: 3.82,
    epc: 26.40,
    roas: 2.77
  }
];

const AccountsTab = ({ onAccountSelect }: AccountsTabProps) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento dos dados
    const loadAccounts = async () => {
      setLoading(true);
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAccounts(mockAccounts);
      setLoading(false);
    };

    loadAccounts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600">Carregando contas...</span>
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
                    onClick={() => onAccountSelect(account.id)}
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
