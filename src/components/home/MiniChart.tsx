import { formatCurrency, formatNumber } from '@/utils/formatters';
import { subDays, format as formatDate } from 'date-fns';

interface MiniChartProps {
  data: number[];
  format: 'currency' | 'number' | 'percentage';
  className?: string;
}

export function MiniChart({ data, format, className = "" }: MiniChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue;

  const getHeight = (value: number): number => {
    if (range === 0) return 50;
    return ((value - minValue) / range) * 40 + 10;
  };

  const getColor = (index: number): string => {
    const isLast = index === data.length - 1;
    const prevValue = index > 0 ? data[index - 1] : data[index];
    const currentValue = data[index];
    
    if (isLast) {
      return currentValue >= prevValue ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)';
    }
    return 'hsl(var(--muted-foreground) / 0.3)';
  };

  const getDayLabel = (index: number): string => {
    const today = new Date();
    const dayDate = subDays(today, 6 - index);
    return formatDate(dayDate, 'dd/MM');
  };

  return (
    <div className={`flex items-end space-x-1 h-12 ${className}`}>
      {data.map((value, index) => (
        <div
          key={index}
          className="flex-1 rounded-sm transition-all duration-200 hover:opacity-80"
          style={{
            height: `${getHeight(value)}%`,
            backgroundColor: getColor(index),
            minWidth: '3px'
          }}
          title={`${getDayLabel(index)}: ${
            format === 'currency' ? formatCurrency(value) :
            format === 'percentage' ? `${value.toFixed(2)}%` :
            formatNumber(value)
          }`}
        />
      ))}
    </div>
  );
}