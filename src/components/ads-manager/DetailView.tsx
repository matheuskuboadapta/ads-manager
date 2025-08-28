import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency, formatPercentage, wrapText } from '@/utils/formatters';
import { TrendingUp, DollarSign, Brain, BarChart3, FileText } from 'lucide-react';
import useDetailMetrics from '@/hooks/useDetailMetrics';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LogsView from './LogsView';

interface DetailViewProps {
  type: 'campaign' | 'adset' | 'ad';
  name: string;
  id: string;
  campaignName?: string | null;
  adsetName?: string | null;
  onMetricsReady?: (metrics: { threeDay: any; sevenDay: any }) => void;
}

const DetailView = ({ type, name, id, campaignName, adsetName, onMetricsReady }: DetailViewProps) => {
  const { data: metricsData, isLoading, error } = useDetailMetrics(type, name, campaignName, adsetName);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('metrics');

  // Notify parent component when metrics are ready
  useEffect(() => {
    if (metricsData && onMetricsReady) {
      onMetricsReady({
        threeDay: metricsData.threeDayMetrics,
        sevenDay: metricsData.sevenDayMetrics
      });
    }
  }, [metricsData, onMetricsReady]);

  // Auto-scroll para mostrar o DetailView completamente
  useEffect(() => {
    console.log('DetailView mounted, attempting scroll for:', type, name);
    
    // Aguardar o DOM estar pronto e então fazer scroll
    const attemptScroll = () => {
      const element = document.querySelector('[data-detail-view]');
      if (element) {
        console.log('Found DetailView element, scrolling...');
        // Scroll para mostrar o elemento com um pouco de espaço acima
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        return true;
      } else {
        console.log('DetailView element not found for scroll');
        return false;
      }
    };

    // Tentativa imediata
    if (!attemptScroll()) {
      // Se não funcionou, tentar novamente após 300ms
      const timer = setTimeout(() => {
        if (!attemptScroll()) {
          // Última tentativa após 600ms
          setTimeout(attemptScroll, 300);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [type, name, id]); // Reagir quando mudar o item selecionado

  useEffect(() => {
    // Reset states quando mudar id/type
    setAiInsights('');
    setAiError(false);
    
    const fetchAiInsights = async () => {
      setAiLoading(true);
      
      try {
        console.log('Enviando requisição AI Insights:', { level: type, id, name });

        const { data, error } = await supabase.functions.invoke('ai-insights', {
          body: { level: type, id, name }
        });

        if (error) {
          throw new Error(error.message);
        }

        console.log('Resposta AI Insights:', data);
        setAiInsights(data.insights || 'Nenhum insight disponível');
        setAiError(false);
      } catch (error) {
        console.error('Erro ao buscar AI insights:', error);
        setAiError(true);
        setAiInsights('Não foi possível carregar os insights da IA no momento. O serviço pode estar temporariamente indisponível.');
      } finally {
        setAiLoading(false);
      }
    };

    // Delay de 500ms para evitar múltiplas requisições rapidamente
    const timeoutId = setTimeout(() => {
      fetchAiInsights();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [type, id]);

  const chartConfig = {
    spend: {
      label: "Gasto",
      color: "#000000",
    },
    cpa: {
      label: "CPA", 
      color: "#000000",
    },
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-md">
          <p className="font-semibold text-foreground">{`Data: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey === 'spend' 
                ? `Gasto: ${formatCurrency(entry.value)}`
                : `CPA: ${formatCurrency(entry.value)}`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-muted border-t border-border p-6">
        <div className="flex items-center justify-center py-8">
                          <LoadingSpinner size="md" className="mr-2" />
          <span className="text-muted-foreground">Carregando métricas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-muted border-t border-border p-6">
        <div className="text-center py-8">
          <p className="text-destructive mb-2">Erro ao carregar métricas</p>
          <p className="text-muted-foreground text-sm">Tente novamente mais tarde</p>
        </div>
      </div>
    );
  }

  if (!metricsData || !metricsData.dailyData || metricsData.dailyData.length === 0) {
    return (
      <div className="bg-muted border-t border-border p-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-2">Nenhum dado encontrado</p>
          <p className="text-muted-foreground text-sm">Não há métricas disponíveis para os últimos 7 dias</p>
        </div>
      </div>
    );
  }

  // Calcular totais para os títulos
  const totalSpend = metricsData.dailyData.reduce((sum, item) => sum + item.spend, 0);
  const validCpaValues = metricsData.dailyData.filter(item => item.cpa > 0);
  const averageCpa = validCpaValues.length > 0 
    ? validCpaValues.reduce((sum, item) => sum + item.cpa, 0) / validCpaValues.length 
    : 0;

  return (
    <div className="bg-muted border-t border-border" data-detail-view>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Detalhes - {name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'metrics' 
                  ? 'Evolução das métricas nos últimos 7 dias'
                  : 'Histórico de modificações realizadas'
                }
              </p>
            </div>
            
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="metrics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Métricas
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Logs
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="metrics" className="mt-0">
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico de Gasto */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Evolução do Gasto - {formatCurrency(totalSpend)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metricsData.dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `R$${value}`}
                          domain={[0, 'dataMax']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="spend" 
                          fill="hsl(var(--primary))" 
                          radius={[4, 4, 0, 0]}
                          name="Gasto"
                        >
                          <LabelList 
                            dataKey="spend" 
                            position="top" 
                            fontSize={12} 
                            fill="hsl(var(--primary))"
                            fontWeight="600"
                            formatter={(value: number) => value > 0 ? `R$${value}` : ''}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Gráfico de CPA */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-success" />
                    Evolução do CPA - {averageCpa > 0 ? formatCurrency(averageCpa) : 'N/A'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metricsData.dailyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `R$${value}`}
                          domain={[0, 'dataMax']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="cpa" 
                          fill="hsl(var(--success))" 
                          radius={[4, 4, 0, 0]}
                          name="CPA"
                        >
                          <LabelList 
                            dataKey="cpa" 
                            position="top" 
                            fontSize={12} 
                            fill="hsl(var(--success))"
                            fontWeight="600"
                            formatter={(value: number) => value > 0 ? `R$${value}` : ''}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* AI Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Brain className="h-4 w-4 text-primary" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    {aiLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <LoadingSpinner size="md" className="mr-2" />
                        <span className="text-muted-foreground">Gerando insights com IA...</span>
                      </div>
                    ) : aiError ? (
                      <div className="bg-muted border border-border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-muted-foreground">Serviço temporariamente indisponível</span>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          Os insights da IA não puderam ser carregados. Isso pode acontecer quando o serviço está sendo atualizado ou temporariamente fora do ar.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-muted border border-border rounded-lg p-4">
                        <div className="text-muted-foreground text-sm leading-relaxed space-y-3">
                          {aiInsights ? 
                            wrapText(aiInsights, 70).split('\n').map((line, index) => (
                              <p key={index} className={line.trim() ? '' : 'h-2'}>
                                {line.trim() || '\u00A0'}
                              </p>
                            )) 
                            : 'Aguardando análise da IA...'
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-0">
          <LogsView objectId={id} objectName={name} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DetailView;
