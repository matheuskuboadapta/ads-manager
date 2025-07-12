
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CalendarIcon, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfDay, subDays, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DateFilter {
  from: Date;
  to: Date;
  label: string;
}

interface FilterBarProps {
  activeTab: string;
  onNameFilter: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onDateFilter: (dateFilter: DateFilter | null) => void;
  nameFilter: string;
  statusFilter: string;
  dateFilter: DateFilter | null;
}

const FilterBar = ({
  activeTab,
  onNameFilter,
  onStatusFilter,
  onDateFilter,
  nameFilter,
  statusFilter,
  dateFilter
}: FilterBarProps) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  });

  const getNamePlaceholder = () => {
    switch (activeTab) {
      case 'accounts':
        return 'Filtrar por nome da conta';
      case 'campaigns':
        return 'Filtrar por nome da campanha';
      case 'adsets':
        return 'Filtrar por nome do conjunto';
      case 'ads':
        return 'Filtrar por nome do anúncio';
      default:
        return 'Filtrar por nome';
    }
  };

  const showStatusFilter = ['campaigns', 'adsets', 'ads'].includes(activeTab);

  const getPresetDateRanges = (): DateFilter[] => {
    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));
    
    return [
      {
        from: today,
        to: endOfDay(today),
        label: 'Hoje'
      },
      {
        from: yesterday,
        to: endOfDay(yesterday),
        label: 'Ontem'
      },
      {
        from: startOfDay(subDays(new Date(), 2)),
        to: endOfDay(new Date()),
        label: 'Últimos 3 dias'
      },
      {
        from: startOfDay(subDays(new Date(), 6)),
        to: endOfDay(new Date()),
        label: 'Últimos 7 dias'
      },
      {
        from: startOfDay(subDays(new Date(), 13)),
        to: endOfDay(new Date()),
        label: 'Últimos 14 dias'
      },
      {
        from: startOfDay(subDays(new Date(), 29)),
        to: endOfDay(new Date()),
        label: 'Últimos 30 dias'
      }
    ];
  };

  const handlePresetSelect = (preset: string) => {
    if (preset === 'custom') {
      return;
    }
    
    if (preset === 'all') {
      onDateFilter(null);
      return;
    }

    const presetRange = getPresetDateRanges().find(p => p.label === preset);
    if (presetRange) {
      onDateFilter(presetRange);
    }
  };

  const handleCustomDateSelect = (range: {from: Date | undefined, to: Date | undefined}) => {
    setCustomDateRange(range);
    if (range.from && range.to) {
      onDateFilter({
        from: startOfDay(range.from),
        to: endOfDay(range.to),
        label: 'Período personalizado'
      });
      setIsDatePickerOpen(false);
    }
  };

  const clearDateFilter = () => {
    onDateFilter(null);
    setCustomDateRange({ from: undefined, to: undefined });
  };

  // Set default date filter to "Today" if none is set
  useState(() => {
    if (!dateFilter) {
      const today = getPresetDateRanges()[0]; // "Hoje"
      onDateFilter(today);
    }
  });

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Name Filter */}
        <div className="space-y-2">
          <Label htmlFor="name-filter" className="text-sm font-medium text-slate-700">
            Nome
          </Label>
          <Input
            id="name-filter"
            placeholder={getNamePlaceholder()}
            value={nameFilter}
            onChange={(e) => onNameFilter(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Status Filter - Only for campaigns, adsets, and ads */}
        {showStatusFilter && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">
              Status
            </Label>
            <Select value={statusFilter} onValueChange={onStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ACTIVE">Ativo</SelectItem>
                <SelectItem value="PAUSED">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Período de Visualização
          </Label>
          <div className="flex items-center space-x-2">
            <Select 
              value={dateFilter?.label || 'Hoje'} 
              onValueChange={handlePresetSelect}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                {getPresetDateRanges().map((preset) => (
                  <SelectItem key={preset.label} value={preset.label}>
                    {preset.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Período personalizado</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Custom Date Picker */}
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={customDateRange.from}
                  selected={{from: customDateRange.from, to: customDateRange.to}}
                  onSelect={handleCustomDateSelect}
                  numberOfMonths={2}
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            {dateFilter && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearDateFilter}
                className="h-10 w-10"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {dateFilter && (
            <p className="text-xs text-slate-500">
              {format(dateFilter.from, "dd/MM/yyyy", { locale: ptBR })} - {format(dateFilter.to, "dd/MM/yyyy", { locale: ptBR })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
