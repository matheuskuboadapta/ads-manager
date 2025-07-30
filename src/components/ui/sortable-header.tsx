import { ChevronUp, ChevronDown } from 'lucide-react';
import { SortDirection } from '@/hooks/useTableSort';

interface SortableHeaderProps {
  children: React.ReactNode;
  column: string;
  sortDirection: SortDirection;
  onSort: (column: string) => void;
  className?: string;
  sortable?: boolean;
}

export const SortableHeader = ({ 
  children, 
  column, 
  sortDirection, 
  onSort, 
  className = '',
  sortable = true 
}: SortableHeaderProps) => {
  const handleClick = () => {
    if (sortable) {
      onSort(column);
    }
  };

  return (
    <div 
      className={`flex items-center space-x-1 cursor-pointer select-none hover:bg-slate-100 transition-colors ${className}`}
      onClick={handleClick}
    >
      <span className="flex-1">{children}</span>
      {sortable && (
        <div className="flex flex-col">
          <ChevronUp 
            className={`h-3 w-3 -mb-1 ${
              sortDirection === 'asc' ? 'text-blue-600' : 'text-slate-400'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 ${
              sortDirection === 'desc' ? 'text-blue-600' : 'text-slate-400'
            }`} 
          />
        </div>
      )}
    </div>
  );
}; 