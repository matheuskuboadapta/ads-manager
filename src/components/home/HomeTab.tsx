import { useAuth } from '@/hooks/useAuth';
import { useHomeMetrics } from '@/hooks/useHomeMetrics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricsScorecard } from './MetricsScorecard';
import { HourlyHeatmap } from './HourlyHeatmap';

export function HomeTab() {
  const { user } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useHomeMetrics();

  const userName = user?.email?.split('@')[0] || 'Usuário';

  if (metricsLoading) {
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
      {/* Welcome Message */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Boas vindas, {userName}!</CardTitle>
          <CardDescription>
            Aqui está um resumo das suas métricas de hoje
          </CardDescription>
        </CardHeader>
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
          title="Vendas"
          currentValue={metrics?.todaySales || 0}
          previousValue={metrics?.previousDaySales || 0}
          format="number"
          chartData={metrics?.last7DaysSales}
        />
        <MetricsScorecard
          title="Receita"
          currentValue={metrics?.todayRevenue || 0}
          previousValue={metrics?.previousDayRevenue || 0}
          format="currency"
          chartData={metrics?.last7DaysRevenue}
        />
        <MetricsScorecard
          title="Impressões"
          currentValue={metrics?.todayImpressions || 0}
          previousValue={metrics?.previousDayImpressions || 0}
          format="number"
          chartData={metrics?.last7DaysImpressions}
        />
        <MetricsScorecard
          title="Cliques"
          currentValue={metrics?.todayClicks || 0}
          previousValue={metrics?.previousDayClicks || 0}
          format="number"
          chartData={metrics?.last7DaysClicks}
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
          <HourlyHeatmap />
        </CardContent>
      </Card>
    </div>
  );
}