import { formatCurrency, formatCurrencyNoDecimals, formatNumber } from '@/utils/formatters';
import { format as formatDate } from 'date-fns';
import { useState } from 'react';

interface MiniChartProps {
  data: number[];
  format: 'currency' | 'currency_no_decimals' | 'number' | 'percentage' | 'multiplier';
  className?: string;
}

export function MiniChart({ data, format, className = "" }: MiniChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  if (data.length === 0) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  
  // Use zero as the baseline for positive values to improve visual proportion
  // Only use the actual min value if there are negative values or if all values are very close to each other
  const effectiveMinValue = minValue < 0 ? minValue : 0;
  let range = maxValue - effectiveMinValue;
  
  // If all values are very close to each other (less than 5% difference), 
  // add some padding to make the chart more visible
  if (range > 0 && range < maxValue * 0.05) {
    const padding = maxValue * 0.1; // Add 10% padding
    range = maxValue + padding - effectiveMinValue;
  }

  const width = 64;
  const height = 48;
  const padding = 4;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  const getX = (index: number): number => {
    return padding + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (value: number): number => {
    if (range === 0) return padding + chartHeight / 2;
    const normalizedValue = (value - effectiveMinValue) / range;
    return padding + chartHeight - (normalizedValue * chartHeight);
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
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() - (6 - index));
    return formatDate(dayDate, 'dd/MM');
  };

  const formatValue = (value: number): string => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'currency_no_decimals':
        return formatCurrencyNoDecimals(value);
      case 'percentage':
        return `${value.toFixed(2)}%`;
      case 'multiplier':
        return `${value.toFixed(2)}x`;
      default:
        return formatNumber(value);
    }
  };

  // Create path for the line
  const createLinePath = (): string => {
    if (data.length === 0) return '';
    
    const points = data.map((value, index) => {
      const x = getX(index);
      const y = getY(value);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  // Create path for the area fill
  const createAreaPath = (): string => {
    if (data.length === 0) return '';
    
    const linePoints = data.map((value, index) => {
      const x = getX(index);
      const y = getY(value);
      return `${x},${y}`;
    });
    
    const bottomRight = `${getX(data.length - 1)},${padding + chartHeight}`;
    const bottomLeft = `${getX(0)},${padding + chartHeight}`;
    
    return `M ${linePoints.join(' L ')} L ${bottomRight} L ${bottomLeft} Z`;
  };

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <svg
        width={width}
        height={height}
        className="absolute inset-0"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Area fill */}
        <path
          d={createAreaPath()}
          fill="currentColor"
          className="opacity-10"
        />
        
        {/* Line */}
        <path
          d={createLinePath()}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-foreground transition-all duration-300"
        />
        
        {/* Data points */}
        {data.map((value, index) => {
          const x = getX(index);
          const y = getY(value);
          const isHovered = hoveredIndex === index;
          const isLast = index === data.length - 1;
          
          return (
            <g key={index}>
              {/* Hover area */}
              <rect
                x={x - 4}
                y={padding}
                width={8}
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(index)}
                className="cursor-pointer"
              />
              
              {/* Data point */}
              <circle
                cx={x}
                cy={y}
                r={isHovered || isLast ? 3 : 0}
                fill={getColor(index)}
                stroke="white"
                strokeWidth="1"
                className="transition-all duration-200"
              />
              
              {/* Vertical line for hover */}
              {isHovered && (
                <line
                  x1={x}
                  y1={padding}
                  x2={x}
                  y2={padding + chartHeight}
                  stroke="hsl(var(--muted-foreground) / 0.3)"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              )}
            </g>
          );
        })}
      </svg>
      
      {/* Tooltip */}
      {hoveredIndex !== null && (
        <div
          className="absolute z-10 bg-white border border-border rounded-lg shadow-lg p-2 text-xs whitespace-nowrap pointer-events-none"
          style={{
            left: `${getX(hoveredIndex)}px`,
            top: `${Math.max(0, getY(data[hoveredIndex]) - 40)}px`,
            transform: 'translateX(-50%)',
            maxWidth: '120px',
          }}
        >
          <div className="font-medium text-muted-foreground">
            {getDayLabel(hoveredIndex)}
          </div>
          <div className="font-semibold text-foreground">
            {formatValue(data[hoveredIndex])}
          </div>
        </div>
      )}
    </div>
  );
}