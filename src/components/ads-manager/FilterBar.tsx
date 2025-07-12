
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CalendarIcon, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';

interface FilterBarProps {
  activeTab: string;
  onNameFilter: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onDateRangeFilter: (dateRange: DateRange | undefined) => void;
  nameFilter: string;
  statusFilter: string;
  dateRange: DateRange | undefined;
}

const FilterBar = ({
  activeTab,
  onNameFilter,
  onStatusFilter,
  onDateRangeFilter,
  nameFilter,
  statusFilter,
  dateRange
}: FilterBarProps) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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

  const clearDateRange = () => {
    onDateRangeFilter(undefined);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Período de Visualização
          </Label>
          <div className="flex items-center space-x-2">
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    <span>Selecionar período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={onDateRangeFilter}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
            {dateRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearDateRange}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
