import { useState } from 'react';
import { useHourlyMetrics } from '@/hooks/useHomeMetrics';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatNumber } from '@/utils/formatters';

type MetricType = 'spend' | 'sales' | 'cpa';

export function HourlyHeatmap() {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('spend');
  const { data: hourlyData, isLoading } = useHourlyMetrics();

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!hourlyData || hourlyData.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Nenhum dado disponível para os últimos 7 dias
      </div>
    );
  }

  // Prepare data for heatmap
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Create a map for quick data lookup
  const dataMap = new Map();
  hourlyData.forEach(row => {
    const key = `${row.date_brt}-${row.hour_of_day}`;
    dataMap.set(key, row);
  });

  // Calculate metric values and find min/max for color scaling
  const values: number[] = [];
  const heatmapData = last7Days.map(date => {
    return hours.map(hour => {
      const key = `${date}-${hour}`;
      const row = dataMap.get(key);
      
      let value = 0;
      if (row) {
        switch (selectedMetric) {
          case 'spend':
            value = row.spend_hour || 0;
            break;
          case 'sales':
            value = row.real_sales_hour || 0;
            break;
          case 'cpa':
            value = (row.real_sales_hour && row.real_sales_hour > 0) 
              ? (row.spend_hour || 0) / row.real_sales_hour 
              : 0;
            break;
        }
      }
      
      values.push(value);
      return { date, hour, value, row };
    });
  });

  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  const getIntensity = (value: number): number => {
    if (maxValue === minValue) return 0;
    return (value - minValue) / (maxValue - minValue);
  };

  const getColorForIntensity = (intensity: number): string => {
    if (intensity === 0) return 'hsl(var(--muted))';
    
    // Create a colorful gradient from light blue to purple like the reference
    if (intensity < 0.2) return 'hsl(200, 100%, 85%)'; // Light blue
    if (intensity < 0.4) return 'hsl(200, 100%, 70%)'; // Blue
    if (intensity < 0.6) return 'hsl(240, 100%, 75%)'; // Light purple
    if (intensity < 0.8) return 'hsl(260, 100%, 65%)'; // Purple
    return 'hsl(280, 100%, 55%)'; // Dark purple
  };

  const formatValue = (value: number): string => {
    if (value === 0) return '0';
    
    switch (selectedMetric) {
      case 'spend':
      case 'cpa':
        return formatCurrency(value);
      case 'sales':
        return formatNumber(value);
      default:
        return value.toString();
    }
  };

  const getMetricLabel = (): string => {
    switch (selectedMetric) {
      case 'spend':
        return 'Investimento';
      case 'sales':
        return 'Vendas';
      case 'cpa':
        return 'CPA';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Metric Selection Buttons */}
      <div className="flex space-x-2">
        <Button
          variant={selectedMetric === 'spend' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedMetric('spend')}
        >
          Investimento
        </Button>
        <Button
          variant={selectedMetric === 'sales' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedMetric('sales')}
        >
          Vendas
        </Button>
        <Button
          variant={selectedMetric === 'cpa' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedMetric('cpa')}
        >
          CPA
        </Button>
      </div>

      {/* Heatmap */}
      <div className="bg-card rounded-lg p-4 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Hour labels */}
          <div className="flex mb-2">
            <div className="w-20"></div> {/* Space for day labels */}
            {hours.map(hour => (
              <div key={hour} className="w-8 text-xs text-center text-muted-foreground">
                {hour.toString().padStart(2, '0')}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          {heatmapData.map((dayData, dayIndex) => (
            <div key={last7Days[dayIndex]} className="flex items-center mb-1">
              {/* Day label */}
              <div className="w-20 text-xs text-muted-foreground pr-2">
                {new Date(last7Days[dayIndex]).toLocaleDateString('pt-BR', { 
                  weekday: 'short',
                  day: '2-digit'
                })}
              </div>
              
              {/* Hour cells */}
              {dayData.map(({ hour, value }) => (
                <div
                  key={hour}
                  className="w-8 h-6 mx-px rounded-sm border border-border relative group"
                  style={{
                    backgroundColor: getColorForIntensity(getIntensity(value))
                  }}
                  title={`${new Date(last7Days[dayIndex]).toLocaleDateString('pt-BR')} às ${hour}h: ${formatValue(value)}`}
                >
                  {/* Tooltip */}
                  <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg border z-10 whitespace-nowrap">
                    <div>{new Date(last7Days[dayIndex]).toLocaleDateString('pt-BR')}</div>
                    <div>{hour}h: {formatValue(value)}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <span>Menos</span>
          <div className="flex items-center space-x-1">
            <span>{getMetricLabel()}</span>
          </div>
          <span>Mais</span>
        </div>
      </div>
    </div>
  );
}