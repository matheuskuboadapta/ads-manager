import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Condition {
  id: string;
  metric: string;
  operator: string;
  value: string;
  logic: 'AND' | 'OR';
}

interface Action {
  id: string;
  action_type: string;
  params: { [key: string]: any };
  order: number;
}

interface TargetItem {
  id: string;
  name: string;
  type: 'campaign' | 'adset' | 'ad';
}

interface RuleCreationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTargets: TargetItem[];
  level: 'campaign' | 'adset' | 'ad';
  onRuleCreated: () => void;
}

const RuleCreationDialog = ({ 
  isOpen, 
  onOpenChange, 
  selectedTargets, 
  level, 
  onRuleCreated 
}: RuleCreationDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();

  // Form state
  const [ruleName, setRuleName] = useState('');
  const [ruleLevel, setRuleLevel] = useState(level);
  const [conditions, setConditions] = useState<Condition[]>([
    { id: 'cond_' + Date.now(), metric: '', operator: '', value: '', logic: 'AND' }
  ]);
  const [action, setAction] = useState<Action>({
    id: 'act_' + Date.now(),
    action_type: '',
    params: {},
    order: 1
  });

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      { id: 'cond_' + Date.now(), metric: '', operator: '', value: '', logic: 'AND' }
    ]);
  };

  const handleRemoveCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter(condition => condition.id !== id));
    }
  };

  const handleConditionChange = (id: string, field: keyof Condition, value: string) => {
    // Se for o campo value, aplica formatação para números e vírgulas
    if (field === 'value') {
      value = value.replace(/[^0-9,]/g, '');
    }
    
    setConditions(
      conditions.map(condition =>
        condition.id === id ? { ...condition, [field]: value } : condition
      )
    );
  };

  const handleActionChange = (field: keyof Action, value: string | number) => {
    setAction(prevAction => ({ ...prevAction, [field]: value }));
  };

  const handleActionParamChange = (paramKey: string, value: string) => {
    setAction(prevAction => ({
      ...prevAction,
      params: { ...prevAction.params, [paramKey]: value }
    }));
  };

  const resetForm = () => {
    setRuleName('');
    setRuleLevel(level);
    setConditions([{ id: 'cond_' + Date.now(), metric: '', operator: '', value: '', logic: 'AND' }]);
    setAction({ id: 'act_' + Date.now(), action_type: '', params: {}, order: 1 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!ruleName || !ruleLevel) {
      toast({
        title: "Formulário incompleto",
        description: "Por favor, preencha os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (selectedTargets.length === 0) {
      toast({
        title: "Nenhum alvo selecionado",
        description: "Por favor, selecione pelo menos um alvo para aplicar a regra.",
        variant: "destructive"
      });
      return;
    }

    // Prepare data for API - Convert arrays to object format
    const conditionsObject: { [key: string]: any } = {};
    conditions.forEach((condition, index) => {
      const { id, ...conditionData } = condition;
      conditionsObject[index.toString()] = conditionData;
    });

    const actionsObject: { [key: string]: any } = {};
    const { id, ...actionData } = action;
    actionsObject["0"] = actionData;

    // Prepare target IDs based on level
    const targetIds = selectedTargets.map(target => target.id);

    const ruleData = {
      name: ruleName,
      is_active: true, // Sempre inicia como ativa
      level: ruleLevel,
      conditions: conditionsObject,
      actions: actionsObject,
      target_ids: targetIds // Send array of target IDs
    };

    try {
      // Send data to webhook
      const response = await fetch('https://mkthooks.adaptahub.org/webhook/adapta-ads-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ruleData)
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar regra para o webhook');
      }

      toast({
        title: "Regra criada com sucesso",
        description: `A regra foi salva e será aplicada a ${selectedTargets.length} alvo(s) selecionado(s).`
      });
      
      // Close dialog and reset form
      onOpenChange(false);
      resetForm();
      
      // Notify parent component
      onRuleCreated();
    } catch (error) {
      console.error('Error submitting rule:', error);
      toast({
        title: "Erro ao criar regra",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao enviar a regra",
        variant: "destructive"
      });
    }
  };

  const renderActionParams = () => {
    switch (action.action_type) {
      case 'pause':
        return (
          <>
            <div>
              <Label htmlFor="target">Alvo</Label>
              <Input
                id="target"
                placeholder="Ex: adset"
                value={action.params.target || ''}
                onChange={(e) => handleActionParamChange('target', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="reason">Motivo</Label>
              <Input
                id="reason"
                placeholder="Ex: CPC excedido"
                value={action.params.reason || ''}
                onChange={(e) => handleActionParamChange('reason', e.target.value)}
              />
            </div>
          </>
        );
      case 'notify':
        return (
          <>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Ex: usuario@exemplo.com"
                value={action.params.email || ''}
                onChange={(e) => handleActionParamChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Ex: Alerta de alto CPC na campanha"
                value={action.params.message || ''}
                onChange={(e) => handleActionParamChange('message', e.target.value)}
              />
            </div>
          </>
        );
      case 'edit_budget':
        return (
          <div>
            <Label htmlFor="budget">Novo Orçamento</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex: 100.00"
              value={action.params.new_budget || ''}
              onChange={(e) => handleActionParamChange('new_budget', e.target.value)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Regra de Automação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Selected Targets Info */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <Label className="text-sm font-medium mb-2 block">
                Alvos Selecionados ({selectedTargets.length})
              </Label>
              <div className="text-sm text-muted-foreground">
                {selectedTargets.length > 0 ? (
                  <div className="space-y-1">
                    {selectedTargets.slice(0, 3).map((target, index) => (
                      <div key={target.id} className="flex items-center space-x-2">
                        <span>• {target.name}</span>
                      </div>
                    ))}
                    {selectedTargets.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        ... e mais {selectedTargets.length - 3} alvo(s)
                      </div>
                    )}
                  </div>
                ) : (
                  <span>Nenhum alvo selecionado</span>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="rule-name">
                Nome da Regra <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rule-name"
                placeholder="Ex: Pausar AdSet se CPC Alto"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="rule-level">
                Nível da Regra <span className="text-destructive">*</span>
              </Label>
              <Select
                value={ruleLevel}
                onValueChange={(value: 'campaign' | 'adset' | 'ad') => setRuleLevel(value)}
                required
              >
                <SelectTrigger id="rule-level">
                  <SelectValue placeholder="Selecione o nível de aplicação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="campaign">Campanha</SelectItem>
                  <SelectItem value="adset">Conjunto de Anúncios</SelectItem>
                  <SelectItem value="ad">Anúncio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-lg font-medium">
                  Condições <span className="text-destructive">*</span>
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Condições baseadas em métricas, combinadas com AND/OR. Ex: CPC {'>'} 4.5 AND Impressões {'>'} 1000</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-4 border rounded-md p-4 bg-muted/30">
                {conditions.map((condition, index) => (
                  <div key={condition.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Condição {index + 1}</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCondition(condition.id)}
                        disabled={conditions.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor={`metric-${condition.id}`}>Métrica</Label>
                        <Select
                          value={condition.metric}
                          onValueChange={(value) =>
                            handleConditionChange(condition.id, 'metric', value)
                          }
                          required
                        >
                          <SelectTrigger id={`metric-${condition.id}`}>
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="clicks">Cliques</SelectItem>
                            <SelectItem value="conversions">Vendas</SelectItem>
                            <SelectItem value="roas">ROAS</SelectItem>
                            <SelectItem value="cpa">CPA</SelectItem>
                            <SelectItem value="spend">Gastos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`operator-${condition.id}`}>Operador</Label>
                        <Select
                          value={condition.operator}
                          onValueChange={(value) =>
                            handleConditionChange(condition.id, 'operator', value)
                          }
                          required
                        >
                          <SelectTrigger id={`operator-${condition.id}`}>
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=">">Maior que {'>'}</SelectItem>
                            <SelectItem value="<">Menor que {'<'}</SelectItem>
                            <SelectItem value="=">Igual a (=)</SelectItem>
                            <SelectItem value=">=">Maior ou igual a {'>='}</SelectItem>
                            <SelectItem value="<=">Menor ou igual a {'<='}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`value-${condition.id}`}>Valor</Label>
                        <Input
                          id={`value-${condition.id}`}
                          placeholder="Ex: 2,4"
                          value={condition.value}
                          onChange={(e) =>
                            handleConditionChange(condition.id, 'value', e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>
                    {index < conditions.length - 1 && (
                      <div>
                        <Label htmlFor={`logic-${condition.id}`}>Lógica</Label>
                        <Select
                          value={condition.logic}
                          onValueChange={(value) =>
                            handleConditionChange(condition.id, 'logic', value)
                          }
                          required
                        >
                          <SelectTrigger id={`logic-${condition.id}`}>
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AND">E (AND)</SelectItem>
                            <SelectItem value="OR">OU (OR)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleAddCondition}
                >
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Condição
                </Button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-lg font-medium">
                  Ação <span className="text-destructive">*</span>
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Ação a ser executada se as condições forem atendidas. Parâmetros variam por tipo.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-4 border rounded-md p-4 bg-muted/30">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Configuração da Ação</div>
                  <div>
                    <Label htmlFor="action-type">Tipo de Ação</Label>
                    <Select
                      value={action.action_type}
                      onValueChange={(value) => handleActionChange('action_type', value)}
                      required
                    >
                      <SelectTrigger id="action-type">
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pause">Pausar</SelectItem>
                        <SelectItem value="notify">Notificar</SelectItem>
                        <SelectItem value="edit_budget">Editar Orçamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {action.action_type && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderActionParams()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Regra
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RuleCreationDialog;
