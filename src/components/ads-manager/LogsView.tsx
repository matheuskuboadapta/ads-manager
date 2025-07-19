
import { Clock, User, Activity, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAdLogs } from '@/hooks/useAdLogs';
import { formatCurrency } from '@/utils/formatters';
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

    const relevantMetrics = ['spend', 'impressions', 'clicks', 'cpm', 'ctr'];
    const availableMetrics = relevantMetrics.filter(key => metrics[key] !== undefined && metrics[key] !== null);

    if (availableMetrics.length === 0) {
      return <p className="text-muted-foreground text-xs">Nenhuma métrica disponível</p>;
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
        {availableMetrics.map(key => {
          let value = metrics[key];
          let label = key.toUpperCase();
          
          if (key === 'spend') {
            value = formatCurrency(value);
            label = 'Gasto';
          } else if (key === 'impressions') {
            value = Number(value).toLocaleString('pt-BR');
            label = 'Impressões';
          } else if (key === 'clicks') {
            value = Number(value).toLocaleString('pt-BR');
            label = 'Cliques';
          } else if (key === 'cpm') {
            value = formatCurrency(value);
          } else if (key === 'ctr') {
            value = `${(Number(value) * 100).toFixed(2)}%`;
          }

          return (
            <div key={key} className="text-center">
              <p className="font-medium text-foreground">{value}</p>
              <p className="text-muted-foreground">{label}</p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-muted border-t border-border p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Histórico de Edições - {objectName}
        </h3>
        <p className="text-sm text-muted-foreground">
          Registro de todas as modificações realizadas
        </p>
      </div>

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
