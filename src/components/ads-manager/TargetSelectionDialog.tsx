import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TargetItem {
  id: string;
  name: string;
  type: 'campaign' | 'adset' | 'ad';
  status?: string;
}

interface TargetSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  targets: TargetItem[];
  selectedTargets: TargetItem[];
  onTargetsSelected: (targets: TargetItem[]) => void;
  level: 'campaign' | 'adset' | 'ad';
  title: string;
}

const TargetSelectionDialog = ({
  isOpen,
  onOpenChange,
  targets,
  selectedTargets,
  onTargetsSelected,
  level,
  title
}: TargetSelectionDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelectedTargets, setLocalSelectedTargets] = useState<TargetItem[]>(selectedTargets);
  const { toast } = useToast();

  // Filter targets based on search term
  const filteredTargets = targets.filter(target =>
    target.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle individual target selection
  const handleTargetToggle = (target: TargetItem, checked: boolean) => {
    if (checked) {
      setLocalSelectedTargets(prev => [...prev, target]);
    } else {
      setLocalSelectedTargets(prev => prev.filter(t => t.id !== target.id));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setLocalSelectedTargets(filteredTargets);
    } else {
      setLocalSelectedTargets([]);
    }
  };

  // Handle select all visible
  const handleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      const newSelected = [...localSelectedTargets];
      filteredTargets.forEach(target => {
        if (!newSelected.find(t => t.id === target.id)) {
          newSelected.push(target);
        }
      });
      setLocalSelectedTargets(newSelected);
    } else {
      setLocalSelectedTargets(prev => 
        prev.filter(target => !filteredTargets.find(t => t.id === target.id))
      );
    }
  };

  // Handle confirm selection
  const handleConfirm = () => {
    onTargetsSelected(localSelectedTargets);
    onOpenChange(false);
    setSearchTerm('');
    
    toast({
      title: "Alvos selecionados",
      description: `${localSelectedTargets.length} alvo(s) selecionado(s) para aplicar regras.`
    });
  };

  // Handle cancel
  const handleCancel = () => {
    setLocalSelectedTargets(selectedTargets);
    setSearchTerm('');
    onOpenChange(false);
  };

  // Reset local state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedTargets(selectedTargets);
    }
  }, [isOpen, selectedTargets]);

  const isAllSelected = filteredTargets.length > 0 && 
    filteredTargets.every(target => localSelectedTargets.find(t => t.id === target.id));

  const isSomeSelected = filteredTargets.some(target => 
    localSelectedTargets.find(t => t.id === target.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Buscar ${level === 'campaign' ? 'campanhas' : level === 'adset' ? 'conjuntos' : 'anúncios'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Selection controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAllVisible}
                ref={(el) => {
                  if (el) {
                    el.indeterminate = isSomeSelected && !isAllSelected;
                  }
                }}
              />
              <Label className="text-sm">
                {isAllSelected ? 'Desmarcar todos' : 'Marcar todos visíveis'}
              </Label>
            </div>
            <div className="text-sm text-muted-foreground">
              {localSelectedTargets.length} selecionado(s)
            </div>
          </div>

          {/* Targets list */}
          <div className="flex-1 overflow-y-auto border rounded-md">
            <div className="divide-y">
              {filteredTargets.length > 0 ? (
                filteredTargets.map((target) => {
                  const isSelected = localSelectedTargets.find(t => t.id === target.id);
                  return (
                    <div
                      key={target.id}
                      className="flex items-center space-x-3 p-3 hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={!!isSelected}
                        onCheckedChange={(checked) => handleTargetToggle(target, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{target.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {target.id}
                            </p>
                          </div>
                          {target.status && (
                            <div className="ml-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                target.status === 'ATIVO' || target.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {target.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum alvo disponível'}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Confirmar Seleção ({localSelectedTargets.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TargetSelectionDialog;
