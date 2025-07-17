import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  
  console.log('DetailView chartData:', chartData);

  const chartConfig = {
    spend: {
      label: "Gasto",
      color: "hsl(var(--primary))",
    },
    cpa: {
      label: "CPA", 
      color: "hsl(var(--secondary))",
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

  // Calcular resumos
  const totalSpend = chartData.reduce((acc, item) => acc + item.spend, 0);
  const validCpaData = chartData.filter(item => item.cpa > 0);
  const avgCpa = validCpaData.length > 0 
    ? validCpaData.reduce((acc, item) => acc + item.cpa, 0) / validCpaData.length 
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

      <div className="space-y-8">
        {/* Seção de Gasto */}
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
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      name="Gasto"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Tabela de Gastos por Dia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4 text-blue-600" />
                Gastos por Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Gasto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.date}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.spend)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 font-semibold bg-muted/50">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalSpend)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Seção de CPA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      fill="hsl(var(--secondary))" 
                      radius={[4, 4, 0, 0]}
                      name="CPA"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Tabela de CPA por Dia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-green-600" />
                CPA por Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">CPA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.date}</TableCell>
                      <TableCell className="text-right">
                        {item.cpa > 0 ? formatCurrency(item.cpa) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2 font-semibold bg-muted/50">
                    <TableCell>Média</TableCell>
                    <TableCell className="text-right">
                      {avgCpa > 0 ? formatCurrency(avgCpa) : 'N/A'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DetailView;