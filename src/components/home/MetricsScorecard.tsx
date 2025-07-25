import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricsScoreCardProps {
  title: string;
  currentValue: number;
  previousValue: number;
  format: 'currency' | 'number' | 'percentage';
}

export function MetricsScorecard({ title, currentValue, previousValue, format }: MetricsScoreCardProps) {
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

  const calculateVariation = () => {
    if (previousValue === 0) {
      return currentValue > 0 ? 100 : 0;
    }
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  const variation = calculateVariation();
  const isPositive = variation > 0;
  const isNeutral = variation === 0;

  const getVariationIcon = () => {
    if (isNeutral) return <Minus className="h-3 w-3" />;
    return isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  const getVariationColor = () => {
    if (isNeutral) return 'secondary';
    return isPositive ? 'default' : 'destructive';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Badge variant={getVariationColor()} className="flex items-center space-x-1">
          {getVariationIcon()}
          <span>{Math.abs(variation).toFixed(1)}%</span>
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(currentValue)}</div>
        <CardDescription className="text-xs">
          Ontem: {formatValue(previousValue)}
        </CardDescription>
      </CardContent>
    </Card>
  );
}