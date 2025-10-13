import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { MiniChart } from './MiniChart';

interface MetricsScoreCardProps {
  title: string;
  currentValue: number;
  previousValue: number;
  format: 'currency' | 'number' | 'percentage';
  chartData?: number[];
}

export function MetricsScorecard({ title, currentValue, previousValue, format, chartData }: MetricsScoreCardProps) {
  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      default:
        return formatNumber(value);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold">{formatValue(currentValue)}</div>
            <CardDescription className="text-xs">
              Ontem: {formatValue(previousValue)}
            </CardDescription>
          </div>
          {chartData && chartData.length > 0 && (
            <div className="w-20">
              <MiniChart data={chartData} format={format} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}