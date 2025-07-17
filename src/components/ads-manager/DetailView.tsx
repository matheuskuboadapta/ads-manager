import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { formatCurrency } from '@/utils/formatters';
import { TrendingUp, DollarSign, Loader2, Brain } from 'lucide-react';
import useDetailMetrics from '@/hooks/useDetailMetrics';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DetailViewProps {
  type: 'campaign' | 'adset' | 'ad';
  name: string;
  id: string;
}

const DetailView = ({ type, name, id }: DetailViewProps) => {
  const { data: chartData, isLoading, error } = useDetailMetrics(type, name);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<boolean>(false);

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
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="font-semibold text-gray-700">{`Data: ${label}`}</p>
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
      <div className="bg-slate-50 border-t border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-slate-600">Carregando métricas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-50 border-t border-slate-200 p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Erro ao carregar métricas</p>
          <p className="text-slate-500 text-sm">Tente novamente mais tarde</p>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-slate-50 border-t border-slate-200 p-6">
        <div className="text-center py-8">
          <p className="text-slate-600 mb-2">Nenhum dado encontrado</p>
          <p className="text-slate-500 text-sm">Não há métricas disponíveis para os últimos 7 dias</p>
        </div>
      </div>
    );
  }

  // Calcular totais para os títulos
  const totalSpend = chartData.reduce((sum, item) => sum + item.spend, 0);
  const validCpaValues = chartData.filter(item => item.cpa > 0);
  const averageCpa = validCpaValues.length > 0 
    ? validCpaValues.reduce((sum, item) => sum + item.cpa, 0) / validCpaValues.length 
    : 0;

  return (
    <div className="bg-slate-50 border-t border-slate-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Detalhes - {name}
        </h3>
        <p className="text-sm text-slate-600">
          Evolução das métricas nos últimos 7 dias
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Gasto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-blue-600" />
              Evolução do Gasto - {formatCurrency(totalSpend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="spend" 
                    fill="#000000" 
                    radius={[4, 4, 0, 0]}
                    name="Gasto"
                  >
                    <LabelList 
                      dataKey="spend" 
                      position="top" 
                      fontSize={12} 
                      fill="#000000"
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
              <TrendingUp className="h-4 w-4 text-green-600" />
              Evolução do CPA - {averageCpa > 0 ? formatCurrency(averageCpa) : 'N/A'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="cpa" 
                    fill="#000000" 
                    radius={[4, 4, 0, 0]}
                    name="CPA"
                  >
                    <LabelList 
                      dataKey="cpa" 
                      position="top" 
                      fontSize={12} 
                      fill="#000000"
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
              <Brain className="h-4 w-4 text-purple-600" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              {aiLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600 mr-2" />
                  <span className="text-slate-600">Gerando insights com IA...</span>
                </div>
              ) : aiError ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-900">Serviço temporariamente indisponível</span>
                  </div>
                  <p className="text-amber-800 text-xs">
                    Os insights da IA não puderam ser carregados. Isso pode acontecer quando o serviço está sendo atualizado ou temporariamente fora do ar.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-slate-700 font-mono text-xs leading-relaxed">
                    {aiInsights || 'Aguardando análise da IA...'}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DetailView;