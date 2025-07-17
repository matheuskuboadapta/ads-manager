import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { formatCurrency } from '@/utils/formatters';
import { TrendingUp, DollarSign, Loader2, Brain } from 'lucide-react';
import useDetailMetrics from '@/hooks/useDetailMetrics';
import { useState, useEffect } from 'react';

interface DetailViewProps {
  type: 'campaign' | 'adset' | 'ad';
  name: string;
  id: string;
}

const DetailView = ({ type, name, id }: DetailViewProps) => {
  const { data: chartData, isLoading, error } = useDetailMetrics(type, name);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [aiInsightsLoading, setAiInsightsLoading] = useState(true);
  const [aiInsightsError, setAiInsightsError] = useState<string>('');

  // Fetch AI insights independently
  useEffect(() => {
    const fetchAiInsights = async () => {
      try {
        // Reset states before each attempt
        setAiInsightsLoading(true);
        setAiInsightsError('');
        setAiInsights('');
        
        console.log('Fetching AI insights for ad_id:', id);
        
        const response = await fetch('https://mkthooks.adaptahub.org/webhook/6538c9ef-9473-49f1-8905-9e33a74beec2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ad_id: id
          })
        });
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const insights = await response.text();
        console.log('AI insights received:', insights);
        setAiInsights(insights);
      } catch (err) {
        console.error('Error fetching AI insights:', err);
        setAiInsightsError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setAiInsightsLoading(false);
      }
    };

    // Always fetch when component mounts or when props change
    if (id) {
      fetchAiInsights();
    }
  }, [type, name, id]); // Dependencies ensure refetch on any change

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
            {aiInsightsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-purple-600 mr-2" />
                <span className="text-slate-600">Carregando insights da IA...</span>
              </div>
            ) : aiInsightsError ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-2">Erro ao carregar insights</p>
                <p className="text-slate-500 text-sm">{aiInsightsError}</p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-sm text-slate-700 whitespace-pre-wrap">
                  {aiInsights}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DetailView;