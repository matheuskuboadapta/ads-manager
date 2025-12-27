
import { Clock, User, Activity, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAdLogs } from '@/hooks/useAdLogs';
import { formatCurrency, formatCurrencyNoDecimals } from '@/utils/formatters';
import { Loader2 } from 'lucide-react';

interface LogsViewProps {
  objectId: string;
  objectName: string;
}

const LogsView = ({ objectId, objectName }: LogsViewProps) => {
  const { data: logs, isLoading, error } = useAdLogs(objectId);

  if (isLoading) {
    return (
      <div className="bg-muted border-t border-border p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Carregando histórico...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-muted border-t border-border p-6">
        <div className="text-center py-8">
          <p className="text-destructive mb-2">Erro ao carregar histórico</p>
          <p className="text-muted-foreground text-sm">Tente novamente mais tarde</p>
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-muted border-t border-border p-6">
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">Nenhum histórico encontrado</p>
          <p className="text-muted-foreground text-sm">
            Não há registros de edições para este item
          </p>
        </div>
      </div>
    );
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const day = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return { time, day };
  };

  const getActivityIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'campaign':
        return <BarChart3 className="h-5 w-5" />;
      case 'adset':
        return <Activity className="h-5 w-5" />;
      case 'ad':
        return <Clock className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getIconColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'campaign':
        return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'adset':
        return 'text-orange-500 bg-orange-50 border-orange-200';
      case 'ad':
        return 'text-green-500 bg-green-50 border-green-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const renderMetricsDetails = (metrics: any) => {
    if (!metrics || typeof metrics !== 'object') {
      return <p className="text-muted-foreground text-xs">Nenhuma métrica disponível</p>;
    }

    // Calcular métricas derivadas baseadas nos dados básicos
    const spend = Number(metrics.spend) || 0;
    const impressions = Number(metrics.impressions) || 0;
    const clicks = Number(metrics.clicks) || 0;
    const realSales = Number(metrics.real_sales) || 0;
    const realRevenue = Number(metrics.real_revenue) || 0;
    const dailyBudget = Number(metrics.daily_budget_per_row) || 0;

    // Calcular métricas derivadas
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const ctr = impressions > 0 ? (clicks / impressions) : 0;
    const clickCV = clicks > 0 ? (realSales / clicks) : 0;
    const epc = clicks > 0 ? (realRevenue / clicks) : 0;
    const roas = spend > 0 ? (realRevenue / spend) : 0;

    // Definir todas as métricas na ordem das colunas da tabela principal
    const calculatedMetrics = {
      spend,
      daily_budget_per_row: dailyBudget,
      impressions,
      clicks,
      cpm,
      ctr,
      click_cv: clickCV,
      epc,
      roas,
      real_sales: realSales,
      real_revenue: realRevenue
    };

    const metricsMap = [
      { key: 'spend', label: 'Valor Gasto', format: 'currency' },
      { key: 'daily_budget_per_row', label: 'Orçamento Diário', format: 'currency' },
      { key: 'impressions', label: 'Impressões', format: 'number' },
      { key: 'clicks', label: 'Cliques', format: 'number' },
      { key: 'cpm', label: 'CPM', format: 'currency_no_decimals' },
      { key: 'ctr', label: 'CTR', format: 'percentage' },
      { key: 'click_cv', label: 'CLICK CV', format: 'percentage' },
      { key: 'epc', label: 'EPC', format: 'currency' },
      { key: 'roas', label: 'ROAS', format: 'multiplier' },
      { key: 'real_sales', label: 'Vendas', format: 'number' },
      { key: 'real_revenue', label: 'Receita', format: 'currency' },
    ];

    // Filtrar apenas as métricas que têm valores válidos
    const availableMetrics = metricsMap.filter(metric => {
      const value = calculatedMetrics[metric.key];
      return value !== undefined && value !== null && !isNaN(value);
    });

    if (availableMetrics.length === 0) {
      return <p className="text-muted-foreground text-xs">Nenhuma métrica disponível</p>;
    }

    const formatValue = (value: any, format: string) => {
      const numValue = Number(value);
      
      switch (format) {
        case 'currency':
          return formatCurrency(numValue);
        case 'currency_no_decimals':
          return formatCurrencyNoDecimals(numValue);
        case 'number':
          return numValue.toLocaleString('pt-BR');
        case 'percentage':
          return `${(numValue * 100).toFixed(2)}%`;
        case 'multiplier':
          return `${numValue.toFixed(2)}x`;
        default:
          return value;
      }
    };

    return (
      <div className="overflow-x-auto chat-table-container">
        {/* Layout para alinhar com as colunas da tabela principal */}
        <div className="min-w-full">
          <div className="flex border-b pb-2 mb-2 text-xs font-medium text-muted-foreground">
            {/* Espaço exato para Status (80px) + Nome (200px) = 280px total */}
            <div className="w-[280px]"></div>
            
            {/* Métricas alinhadas começando na posição do "Valor Gasto" */}
            {availableMetrics.map(metric => (
              <div key={metric.key} className="min-w-[120px] text-right px-3">
                {metric.label}
              </div>
            ))}
          </div>
          
          <div className="flex text-xs">
            {/* Espaço exato para Status (80px) + Nome (200px) = 280px total */}
            <div className="w-[280px]"></div>
            
            {/* Valores das métricas alinhados */}
            {availableMetrics.map(metric => (
              <div key={metric.key} className="min-w-[120px] text-right px-3">
                <span className="font-medium text-foreground">
                  {formatValue(calculatedMetrics[metric.key], metric.format)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-muted border-t border-border p-6">{/* Removido o título */}

      <div className="space-y-4">
        {logs.map((log, index) => {
          const { time, day } = formatDateTime(log.log_created_at);
          const isLastItem = index === logs.length - 1;

          return (
            <div key={log.log_id} className="relative">
              <div className="flex gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2
                    ${getIconColor(log.level)}
                  `}>
                    {getActivityIcon(log.level)}
                  </div>
                  {!isLastItem && (
                    <div className="w-px h-6 bg-border mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground text-sm">
                      {time}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {day}
                    </span>
                  </div>

                  <Card className="mb-2">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {log.user}
                        </span>
                      </div>
                      
                      <h4 className="font-medium text-foreground mb-3">
                        {log.edit_details}
                      </h4>
                      
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Métricas no momento da edição:
                        </p>
                        {renderMetricsDetails(log.metrics_details)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LogsView;
