import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { formatCurrency } from '@/utils/formatters';
import { TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import useDetailMetrics from '@/hooks/useDetailMetrics';

interface DetailViewProps {
  type: 'campaign' | 'adset' | 'ad';
  name: string;
  id: string;
}

const DetailView = ({ type, name, id }: DetailViewProps) => {
  const { data: chartData, isLoading, error } = useDetailMetrics(type, name);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Gasto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-blue-600" />
              Evolução do Gasto
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
                      fontSize={10} 
                      fill="#000000"
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
              Evolução do CPA
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
                      fontSize={10} 
                      fill="#000000"
                      formatter={(value: number) => value > 0 ? `R$${value}` : ''}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DetailView;