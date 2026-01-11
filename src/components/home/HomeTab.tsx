import { useAuth } from '@/hooks/useAuth';
import { useHomeMetrics, useAvailableAccounts } from '@/hooks/useHomeMetrics';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricsScorecard } from './MetricsScorecard';
import { HourlyHeatmap } from './HourlyHeatmap';

export function HomeTab() {
  const { user } = useAuth();
  const { account: selectedAccount, setAccount } = useUrlFilters();
  const { data: metrics, isLoading: metricsLoading } = useHomeMetrics(selectedAccount);
  const { data: availableAccounts, isLoading: isLoadingAccounts } = useAvailableAccounts();

  const userName = user?.email?.split('@')[0] || 'Usuário';

  if (metricsLoading || isLoadingAccounts) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Selection Dropdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Boas vindas, {userName}!</CardTitle>
          <CardDescription>
            Aqui está um resumo das suas métricas de hoje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-foreground">Filtrar por conta:</label>
            <Select 
              value={selectedAccount || 'all'} 
              onValueChange={(value) => {
                console.log('=== ACCOUNT SELECTION DEBUG ===');
                console.log('Selected value:', value);
                console.log('Previous selectedAccount:', selectedAccount);
                console.log('Will update to:', value === 'all' ? null : value);
                console.log('==============================');
                setAccount(value === 'all' ? null : value);
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {availableAccounts?.map((account) => (
                  <SelectItem key={account} value={account}>
                    {account}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricsScorecard
          title="Investimento"
          currentValue={metrics?.todaySpend || 0}
          previousValue={metrics?.previousDaySpend || 0}
          format="currency"
          chartData={metrics?.last7DaysSpend}
        />
        <MetricsScorecard
          title="Retorno"
          currentValue={metrics?.todayRevenue || 0}
          previousValue={metrics?.previousDayRevenue || 0}
          format="currency"
          chartData={metrics?.last7DaysRevenue}
        />
        <MetricsScorecard
          title="Profit"
          currentValue={metrics?.todayProfit || 0}
          previousValue={metrics?.previousDayProfit || 0}
          format="currency"
          chartData={metrics?.last7DaysProfit}
        />
        <MetricsScorecard
          title="Vendas"
          currentValue={metrics?.todaySales || 0}
          previousValue={metrics?.previousDaySales || 0}
          format="number"
          chartData={metrics?.last7DaysSales}
        />
        <MetricsScorecard
          title="CPM"
          currentValue={metrics?.todayCPM || 0}
          previousValue={metrics?.previousDayCPM || 0}
          format="currency_no_decimals"
          chartData={metrics?.last7DaysCPM}
        />
        <MetricsScorecard
          title="CTR"
          currentValue={metrics?.todayCTR || 0}
          previousValue={metrics?.previousDayCTR || 0}
          format="percentage"
          chartData={metrics?.last7DaysCTR}
        />
        <MetricsScorecard
          title="CPA"
          currentValue={metrics?.todayCPA || 0}
          previousValue={metrics?.previousDayCPA || 0}
          format="currency"
          chartData={metrics?.last7DaysCPA}
        />
      </div>

      {/* Hourly Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Análise por Hora - Últimos 7 Dias</CardTitle>
          <CardDescription>
            Visualize o desempenho das suas métricas por hora do dia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HourlyHeatmap key={selectedAccount || 'all'} />
        </CardContent>
      </Card>
    </div>
  );
}