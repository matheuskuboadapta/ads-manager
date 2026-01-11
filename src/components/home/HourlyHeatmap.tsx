import { useState } from 'react';
import { useHourlyMetrics } from '@/hooks/useHomeMetrics';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatNumber } from '@/utils/formatters';

type MetricType = 'spend' | 'sales' | 'cpa';

export function HourlyHeatmap() {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('spend');
  const { account: selectedAccount } = useUrlFilters();
  const { data: hourlyData, isLoading } = useHourlyMetrics(selectedAccount);

  // Debug: Log when component re-renders
  console.log('=== HOURLY HEATMAP RENDER ===');
  console.log('Component re-rendering with account:', selectedAccount);
  console.log('====================================');

  // Debug logs
  console.log('=== HOURLY HEATMAP DEBUG ===');
  console.log('selectedAccount:', selectedAccount);
  console.log('selectedAccount type:', typeof selectedAccount);
  console.log('selectedAccount value:', JSON.stringify(selectedAccount));
  console.log('hourlyData length:', hourlyData?.length || 0);
  console.log('isLoading:', isLoading);
  console.log('Sample hourlyData:', hourlyData?.slice(0, 3));
  
  // Debug: Check the date range of the data
  if (hourlyData && hourlyData.length > 0) {
    const dates = [...new Set(hourlyData.map(row => row.date_brt))].sort();
    console.log('Date range in hourlyData:', {
      earliest: dates[0],
      latest: dates[dates.length - 1],
      allDates: dates,
      totalRecords: hourlyData.length
    });
    
    // Check if today's date is in the data
    const now = new Date();
    const todayStr = now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0');
    console.log('Today should be:', todayStr);
    console.log('Today found in data:', dates.includes(todayStr));
  }
  
  console.log('===========================');

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

  // Get the actual dates from the data instead of calculating them
  const datesFromData = [...new Set(hourlyData.map(row => row.date_brt))].sort();
  
  // Debug: Show the dates from the data
  console.log('=== HEATMAP DATE RANGE DEBUG ===');
  console.log('Dates from hourlyData:', datesFromData);
  console.log('Number of unique dates:', datesFromData.length);
  console.log('================================');
  
  // Use the dates from the data for the heatmap
  const last7Days = datesFromData;

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Create a map for quick data lookup using processed data
  const dataMap = new Map();
  hourlyData.forEach(row => {
    const key = `${row.date_brt}-${row.hour_of_day}`;
    dataMap.set(key, row);
  });

  // Calculate metric values and find min/max for color scaling
  const values: number[] = [];
  const heatmapData = last7Days.map((date, dateIndex) => {
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

  // Calculate daily totals
  const dailyTotals = heatmapData.map((dayData, index) => {
    if (selectedMetric === 'cpa') {
      // For CPA, calculate the average instead of sum
      const nonZeroValues = dayData.filter(({ value }) => value > 0);
      if (nonZeroValues.length === 0) return 0;
      return nonZeroValues.reduce((sum, { value }) => sum + value, 0) / nonZeroValues.length;
    } else {
      // For spend and sales, sum all values
      return dayData.reduce((sum, { value }) => sum + value, 0);
    }
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
        <div className="min-w-[1400px] flex flex-col">
          {/* Hour labels */}
          <div className="flex mb-2">
            <div className="w-32"></div> {/* Space for day labels */}
            {hours.map(hour => (
              <div key={hour} className="w-14 text-xs text-center text-muted-foreground flex justify-center items-center px-0 mx-0">
                {hour.toString().padStart(2, '0')}
              </div>
            ))}
            <div className="w-36 text-xs text-center text-muted-foreground font-medium flex justify-center items-center px-0 mx-0">
              Total
            </div>
          </div>
          
          {/* Heatmap grid */}
          {heatmapData.map((dayData, dayIndex) => (
            <div key={last7Days[dayIndex]} className="flex items-center mb-1 justify-start">
              {/* Day label */}
              <div className="w-32 text-xs text-muted-foreground pr-2">
                {(() => {
                  // Parse the date string properly to avoid timezone issues
                  const [year, month, day] = last7Days[dayIndex].split('-').map(Number);
                  const date = new Date(year, month - 1, day); // month is 0-indexed
                  
                  const weekday = date.toLocaleDateString('pt-BR', { 
                    weekday: 'long'
                  }).split(',')[0].substring(0, 3).charAt(0).toUpperCase() + 
                  date.toLocaleDateString('pt-BR', { 
                    weekday: 'long'
                  }).split(',')[0].substring(1, 3);
                  
                  const dateStr = date.toLocaleDateString('pt-BR', { 
                    day: '2-digit',
                    month: '2-digit'
                  });
                  
                  return `${weekday} - ${dateStr}`;
                })()}
              </div>
              
              {/* Hour cells */}
              {dayData.map(({ hour, value }) => (
                <div
                  key={hour}
                  className="w-14 h-10 mx-0 rounded-sm border border-border relative group flex-shrink-0"
                  style={{
                    backgroundColor: getColorForIntensity(getIntensity(value))
                  }}
                  title={`${(() => {
                    const [year, month, day] = last7Days[dayIndex].split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    return date.toLocaleDateString('pt-BR');
                  })()} às ${hour}h: ${formatValue(value)}`}
                >
                  {/* Tooltip */}
                  <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg border z-10 whitespace-nowrap">
                    <div>{(() => {
                      const [year, month, day] = last7Days[dayIndex].split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      return date.toLocaleDateString('pt-BR');
                    })()}</div>
                    <div>{hour}h: {formatValue(value)}</div>
                  </div>
                </div>
              ))}
              
              {/* Daily total */}
              <div className="w-36 text-xs text-center font-medium text-foreground bg-muted/50 rounded px-2 py-1 ml-0 flex-shrink-0">
                {formatValue(dailyTotals[dayIndex])}
              </div>
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