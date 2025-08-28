import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, Eye, EyeOff, GripVertical, RotateCcw } from 'lucide-react';
import { COLUMN_LABELS } from '@/hooks/useColumnOrder';

interface ColumnOrderDialogProps {
  tableType: 'campaigns' | 'adsets' | 'ads' | 'accounts';
  columnOrder: string[];
  onColumnOrderChange: (newOrder: string[]) => void;
  onReset: () => void;
  getAllColumns: () => string[];
  isColumnVisible: (column: string) => boolean;
  toggleColumnVisibility: (column: string) => void;
}

const ColumnOrderDialog = ({ tableType, columnOrder, onColumnOrderChange, onReset, getAllColumns, isColumnVisible, toggleColumnVisibility }: ColumnOrderDialogProps) => {
  const [localOrder, setLocalOrder] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newOrder = [...localOrder];
    const [draggedColumn] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedColumn);
    
    setLocalOrder(newOrder);
  };

  const handleSave = () => {
    onColumnOrderChange(localOrder);
    setOpen(false);
  };

  const handleReset = () => {
    onReset();
    setLocalOrder(columnOrder);
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setLocalOrder(getAllColumns());
    }
    setOpen(isOpen);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Dialog open={open} onOpenChange={handleOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configurar Colunas</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reordenar Colunas</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Arraste as colunas para reordená-las. Use o ícone do olho para mostrar/ocultar colunas.
              </p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {localOrder.map((column, index) => {
                  const isVisible = isColumnVisible(column);
                  return (
                    <div
                      key={column}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`flex items-center space-x-2 p-2 border rounded transition-colors ${
                        draggedIndex === index 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted/50'
                      } ${!isVisible ? 'opacity-60' : ''}`}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <span className="flex-1 text-sm">{COLUMN_LABELS[column] || column}</span>
                      <button
                        onClick={() => toggleColumnVisibility(column)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title={isVisible ? 'Ocultar coluna' : 'Mostrar coluna'}
                      >
                        {isVisible ? (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <span className="text-xs text-muted-foreground w-8 text-center">#{index + 1}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar
                </Button>
                
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default ColumnOrderDialog;