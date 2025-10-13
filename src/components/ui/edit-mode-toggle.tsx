import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, Eye } from 'lucide-react';
import { useEditMode } from '@/contexts/EditModeContext';

interface EditModeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function EditModeToggle({ className = "", showLabel = true }: EditModeToggleProps) {
  const { isEditMode, toggleEditMode } = useEditMode();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isEditMode && (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Modo Edição
        </Badge>
      )}
      
      <Button
        variant={isEditMode ? "default" : "outline"}
        size="sm"
        onClick={toggleEditMode}
        className={`flex items-center gap-2 transition-all duration-200 ${
          isEditMode 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'hover:bg-blue-50 hover:border-blue-200'
        }`}
      >
        {isEditMode ? (
          <>
            <Eye className="h-4 w-4" />
            {showLabel && <span>Visualizar</span>}
          </>
        ) : (
          <>
            <Edit3 className="h-4 w-4" />
            {showLabel && <span>Editar</span>}
          </>
        )}
      </Button>
    </div>
  );
}
