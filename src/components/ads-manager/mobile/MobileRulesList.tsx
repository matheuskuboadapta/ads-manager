import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Rule {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string | null;
}

interface MobileRulesListProps {
  rules: Rule[];
  statusUpdateLoading?: boolean;
}

const MobileRulesList = ({ 
  rules,
  statusUpdateLoading = false
}: MobileRulesListProps) => {
  const [localStatusUpdates, setLocalStatusUpdates] = useState<{ [ruleId: number]: boolean }>({});
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [pendingRuleAction, setPendingRuleAction] = useState<{ rule: Rule; action: 'DISABLED' | 'DELETED' } | null>(null);
  const [loadingRuleId, setLoadingRuleId] = useState<number | null>(null);

  const handleRuleStatusChange = async (rule: Rule, newStatus: boolean) => {
    // Se está tentando desativar uma regra ativa, mostrar dialog de confirmação
    const localStatus = localStatusUpdates[rule.id];
    const currentStatus = localStatus !== undefined ? localStatus : rule.is_active;
    
    if (!newStatus && currentStatus) {
      // Mostrar dialog para escolher entre desativar ou excluir
      setPendingRuleAction({ rule, action: 'DISABLED' });
      setShowDeactivateDialog(true);
      return;
    }
    
    // Se está ativando, seguir fluxo normal
    await performRuleStatusChange(rule.id, newStatus ? 'ENABLED' : 'DISABLED');
  };

  const performRuleStatusChange = async (ruleId: number, status: 'ENABLED' | 'DISABLED' | 'DELETED') => {
    // Atualizar status local imediatamente para feedback visual
    setLoadingRuleId(ruleId);
    
    if (status === 'ENABLED') {
      setLocalStatusUpdates(prev => ({ ...prev, [ruleId]: true }));
    } else if (status === 'DISABLED') {
      setLocalStatusUpdates(prev => ({ ...prev, [ruleId]: false }));
    }
    
    try {
      const response = await fetch('https://mkthooks.adaptahub.org/webhook/23f2f647-7170-4618-bfaa-167dfef72dc1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: ruleId,
          status: status
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao alterar status da regra');
      }

      // Se foi DELETED, remover da lista local
      if (status === 'DELETED') {
        setLocalStatusUpdates(prev => {
          const newState = { ...prev };
          delete newState[ruleId];
          return newState;
        });
      }
    } catch (error) {
      console.error('Error updating rule status:', error);
      // Reverter status local em caso de erro
      setLocalStatusUpdates(prev => {
        const newState = { ...prev };
        delete newState[ruleId];
        return newState;
      });
    } finally {
      setLoadingRuleId(null);
    }
  };

  const handleDisableRule = async () => {
    if (pendingRuleAction) {
      await performRuleStatusChange(pendingRuleAction.rule.id, 'DISABLED');
      setShowDeactivateDialog(false);
      setPendingRuleAction(null);
    }
  };

  const handleDeleteRule = async () => {
    if (pendingRuleAction) {
      await performRuleStatusChange(pendingRuleAction.rule.id, 'DELETED');
      setShowDeactivateDialog(false);
      setPendingRuleAction(null);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="space-y-3 pb-20">
        {rules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma regra encontrada.
          </div>
        ) : (
          rules.map((rule) => {
          const localStatus = localStatusUpdates[rule.id];
          const currentStatus = localStatus !== undefined ? localStatus : rule.is_active;
          const isUpdating = loadingRuleId === rule.id;

          return (
            <Card 
              key={rule.id} 
              className="overflow-hidden"
            >
              <CardContent className="p-4 space-y-3">
                {/* Header com nome e status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 overflow-hidden max-w-[calc(100%-90px)]">
                    <h3 className="font-semibold text-base truncate break-all">
                      {rule.name.length > 40 ? `${rule.name.substring(0, 40)}...` : rule.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getStatusColor(currentStatus)}`}
                      >
                        {currentStatus ? 'ATIVA' : 'INATIVA'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0 w-[90px] justify-end" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={currentStatus}
                      onCheckedChange={(checked) => handleRuleStatusChange(rule, checked)}
                      disabled={loadingRuleId !== null}
                      className="data-[state=checked]:bg-green-600"
                    />
                    {isUpdating && <LoadingSpinner size="sm" />}
                  </div>
                </div>

                {/* Data de criação */}
                <div className="pt-2 border-t">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Data de Criação</p>
                    <p className="font-semibold text-sm">{formatDate(rule.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
        )}
      </div>

      {/* Deactivate/Delete Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O que você deseja fazer?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-4">
              <div className="text-sm text-muted-foreground mb-4">
                Você pode desativar temporariamente ou excluir permanentemente esta regra.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col gap-2">
            <AlertDialogAction 
              onClick={handleDisableRule}
              className="w-full"
            >
              Desativar Regra
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={handleDeleteRule}
              className="w-full bg-destructive hover:bg-destructive/90"
            >
              Excluir Regra
            </AlertDialogAction>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeactivateDialog(false);
                setPendingRuleAction(null);
              }}
              className="w-full mt-0"
            >
              Cancelar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MobileRulesList;

