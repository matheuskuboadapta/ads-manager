
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CalendarIcon, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEditMode } from '@/contexts/EditModeContext';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const { isEditMode } = useEditMode();
  const isMobile = useIsMobile();
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
    // Use current local time directly since we're already in GMT-3
    const now = new Date();
    
    console.log('=== FILTERBAR DATE RANGES DEBUG ===');
    console.log('Current time (local):', now.toISOString());
    console.log('Current time (local):', now.toString());
    console.log('Current date (YYYY-MM-DD):', now.toISOString().split('T')[0]);
    
    // Helper function to get local date string without timezone conversion
    const getLocalDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Create dates using local date methods to avoid timezone conversion issues
    const todayStr = getLocalDateString(now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    
    const today = new Date(todayStr + 'T00:00:00');
    const yesterdayDate = new Date(yesterdayStr + 'T00:00:00');
    
    console.log('Today (start):', today.toISOString());
    console.log('Today (start):', today.toString());
    console.log('Today date (YYYY-MM-DD):', today.toISOString().split('T')[0]);
    console.log('Yesterday (start):', yesterdayDate.toISOString());
    console.log('Yesterday (start):', yesterdayDate.toString());
    console.log('Yesterday date (YYYY-MM-DD):', yesterdayDate.toISOString().split('T')[0]);
    
    // Create end dates using the same day to avoid timezone issues
    const todayEnd = new Date(todayStr + 'T00:00:00');
    const yesterdayEnd = new Date(yesterdayStr + 'T00:00:00');
    
    console.log('Today (end):', todayEnd.toISOString());
    console.log('Today (end):', todayEnd.toString());
    console.log('Today end date (YYYY-MM-DD):', todayEnd.toISOString().split('T')[0]);
    console.log('Yesterday (end):', yesterdayEnd.toISOString());
    console.log('Yesterday (end):', yesterdayEnd.toString());
    console.log('Yesterday end date (YYYY-MM-DD):', yesterdayEnd.toISOString().split('T')[0]);
    
    console.log('=== END FILTERBAR DATE RANGES DEBUG ===');
    
    // Create dates for other ranges using local date methods
    const last3Days = new Date(now);
    last3Days.setDate(now.getDate() - 2);
    const last3DaysStartStr = getLocalDateString(last3Days);
    
    const last7Days = new Date(now);
    last7Days.setDate(now.getDate() - 6);
    const last7DaysStartStr = getLocalDateString(last7Days);
    
    const last14Days = new Date(now);
    last14Days.setDate(now.getDate() - 13);
    const last14DaysStartStr = getLocalDateString(last14Days);
    
    const last30Days = new Date(now);
    last30Days.setDate(now.getDate() - 29);
    const last30DaysStartStr = getLocalDateString(last30Days);
    
    const last3DaysStart = new Date(last3DaysStartStr + 'T00:00:00');
    const last7DaysStart = new Date(last7DaysStartStr + 'T00:00:00');
    const last14DaysStart = new Date(last14DaysStartStr + 'T00:00:00');
    const last30DaysStart = new Date(last30DaysStartStr + 'T00:00:00');
    
    return [
      {
        from: today,
        to: todayEnd,
        label: 'Hoje'
      },
      {
        from: yesterdayDate,
        to: yesterdayEnd,
        label: 'Ontem'
      },
      {
        from: last3DaysStart,
        to: todayEnd,
        label: 'Últimos 3 dias'
      },
      {
        from: last7DaysStart,
        to: todayEnd,
        label: 'Últimos 7 dias'
      },
      {
        from: last14DaysStart,
        to: todayEnd,
        label: 'Últimos 14 dias'
      },
      {
        from: last30DaysStart,
        to: todayEnd,
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
      // Use the same approach as preset filters to avoid timezone issues
      const fromStr = range.from.toISOString().split('T')[0];
      const toStr = range.to.toISOString().split('T')[0];
      
      // Create dates in local timezone to avoid conversion issues
      const fromDate = new Date(fromStr + 'T00:00:00');
      const toDate = new Date(toStr + 'T00:00:00');
      
      console.log('Custom date filter:', { fromStr, toStr, fromDate: fromDate.toISOString(), toDate: toDate.toISOString() });
      
      onDateFilter({
        from: fromDate,
        to: toDate,
        label: 'Período personalizado'
      });
      setIsDatePickerOpen(false);
    }
  };

  const clearAllFilters = () => {
    // Limpar filtro de nome primeiro
    onNameFilter('');
    
    // Limpar filtro de status
    onStatusFilter('all');
    
    // Limpar range personalizado
    setCustomDateRange({ from: undefined, to: undefined });
    
    // Definir filtro de data para o período padrão (Hoje)
    const today = getPresetDateRanges()[0]; // "Hoje"
    onDateFilter(today);
  };

  // Set default date filter to "Today" if none is set
  React.useEffect(() => {
    if (!dateFilter) {
      const today = getPresetDateRanges()[0]; // "Hoje"
      onDateFilter(today);
    }
  }, [dateFilter, onDateFilter]);



  return (
    <>
      {!isEditMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-yellow-800 text-sm font-medium">
                Você está visualizando uma versão publicada
              </span>
            </div>
            <span className="text-yellow-700 text-xs">
              Modo Visualização
            </span>
          </div>
        </div>
      )}
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

          {/* Date Filter - Hidden on mobile */}
          {!isMobile && (
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
                    {dateFilter?.label === 'Período personalizado' && (
                      <SelectItem value="Período personalizado">
                        Período personalizado
                      </SelectItem>
                    )}
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
                
                {(dateFilter || nameFilter || statusFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearAllFilters}
                    className="h-10 w-10"
                    title="Limpar todos os filtros"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {dateFilter && (
                <p className="text-xs text-slate-500">
                  {(() => {
                    // Helper function to get local date string without timezone conversion
                    const getLocalDateString = (date: Date): string => {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    };
                    
                    const fromDate = getLocalDateString(dateFilter.from);
                    const toDate = getLocalDateString(dateFilter.to);
                    
                    if (fromDate === toDate) {
                      // Same day - show only one date
                      return format(dateFilter.from, "dd/MM/yyyy", { locale: ptBR });
                    } else {
                      // Different days - show range
                      return `${format(dateFilter.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateFilter.to, "dd/MM/yyyy", { locale: ptBR })}`;
                    }
                  })()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FilterBar;
