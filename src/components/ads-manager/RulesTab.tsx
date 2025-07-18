import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, AlertCircle, Trash2, HelpCircle } from 'lucide-react';
import { useAdRules, type AdRule } from '@/hooks/useAdRules';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

type Condition = {
  id: string;
  metric: string;
  operator: string;
  value: string;
  logic: string;
};

type Action = {
  id: string;
  action_type: string;
  params: {
    target?: string;
    reason?: string;
    email?: string;
    message?: string;
    new_budget?: string;
    new_status?: string;
  };
  order: number;
};

const RulesTab = () => {
  const { data: rules, isLoading, error, refetch } = useAdRules();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleToggleRule = async (ruleId: number, isActive: boolean) => {
    try {
      const response = await fetch('https://mkthooks.adaptahub.org/webhook/adapta-ads-rules-toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rule_id: ruleId,
          is_active: isActive
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao alterar status da regra');
      }

      toast({
        title: isActive ? "Regra ativada" : "Regra desativada",
        description: `A regra foi ${isActive ? 'ativada' : 'desativada'} com sucesso.`
      });
      
      // Refetch rules to update the list
      refetch();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast({
        title: "Erro ao alterar regra",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao alterar o status da regra",
        variant: "destructive"
      });
    }
  };

  // Form state
  const [ruleName, setRuleName] = useState('');
  const [ruleLevel, setRuleLevel] = useState('');
  const [conditions, setConditions] = useState<Condition[]>([
    { id: 'cond_' + Date.now(), metric: '', operator: '', value: '', logic: 'AND' }
  ]);
  const [actions, setActions] = useState<Action[]>([
    { id: 'act_' + Date.now(), action_type: '', params: {}, order: 1 }
  ]);

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

  const handleAddAction = () => {
    setActions([
      ...actions,
      { id: 'act_' + Date.now(), action_type: '', params: {}, order: actions.length + 1 }
    ]);
  };

  const handleRemoveAction = (id: string) => {
    if (actions.length > 1) {
      setActions(actions.filter(action => action.id !== id));
    }
  };

  const handleActionChange = (id: string, field: keyof Action, value: string | number) => {
    setActions(
      actions.map(action =>
        action.id === id ? { ...action, [field]: value } : action
      )
    );
  };

  const handleActionParamChange = (id: string, paramKey: string, value: string) => {
    setActions(
      actions.map(action =>
        action.id === id
          ? { ...action, params: { ...action.params, [paramKey]: value } }
          : action
      )
    );
  };

  const resetForm = () => {
    setRuleName('');
    setRuleLevel('');
    setConditions([{ id: 'cond_' + Date.now(), metric: '', operator: '', value: '', logic: 'AND' }]);
    setActions([{ id: 'act_' + Date.now(), action_type: '', params: {}, order: 1 }]);
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

    // Prepare data for API
    const ruleData = {
      name: ruleName,
      is_active: true, // Sempre inicia como ativa
      level: ruleLevel,
      conditions: conditions.map(({ id, ...rest }) => rest),
      actions: actions.map(({ id, ...rest }) => rest),
      target_id: null
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
        description: "A regra foi salva e será processada em breve."
      });
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      resetForm();
      
      // Refetch rules to update the list
      refetch();
    } catch (error) {
      console.error('Error submitting rule:', error);
      toast({
        title: "Erro ao criar regra",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao enviar a regra",
        variant: "destructive"
      });
    }
  };

  const renderActionParams = (action: Action) => {
    switch (action.action_type) {
      case 'pause':
        return (
          <>
            <div>
              <Label htmlFor={`target-${action.id}`}>Alvo</Label>
              <Input
                id={`target-${action.id}`}
                placeholder="Ex: adset"
                value={action.params.target || ''}
                onChange={(e) => handleActionParamChange(action.id, 'target', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`reason-${action.id}`}>Motivo</Label>
              <Input
                id={`reason-${action.id}`}
                placeholder="Ex: CPC excedido"
                value={action.params.reason || ''}
                onChange={(e) => handleActionParamChange(action.id, 'reason', e.target.value)}
              />
            </div>
          </>
        );
      case 'notify':
        return (
          <>
            <div>
              <Label htmlFor={`email-${action.id}`}>Email</Label>
              <Input
                id={`email-${action.id}`}
                type="email"
                placeholder="Ex: usuario@exemplo.com"
                value={action.params.email || ''}
                onChange={(e) => handleActionParamChange(action.id, 'email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`message-${action.id}`}>Mensagem</Label>
              <Textarea
                id={`message-${action.id}`}
                placeholder="Ex: Alerta de alto CPC na campanha"
                value={action.params.message || ''}
                onChange={(e) => handleActionParamChange(action.id, 'message', e.target.value)}
              />
            </div>
          </>
        );
      case 'edit_budget':
        return (
          <div>
            <Label htmlFor={`budget-${action.id}`}>Novo Orçamento</Label>
            <Input
              id={`budget-${action.id}`}
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex: 100.00"
              value={action.params.new_budget || ''}
              onChange={(e) => handleActionParamChange(action.id, 'new_budget', e.target.value)}
            />
          </div>
        );
      case 'edit_status':
        return (
          <div>
            <Label htmlFor={`status-${action.id}`}>Novo Status</Label>
            <Select
              value={action.params.new_status || ''}
              onValueChange={(value) => handleActionParamChange(action.id, 'new_status', value)}
            >
              <SelectTrigger id={`status-${action.id}`}>
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Carregando regras...</div>;
  }

  if (error) {
    return (
      <div className="bg-destructive/20 p-4 rounded-lg flex items-center space-x-2">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <span>Erro ao carregar as regras: {(error as Error).message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Regras de Automação</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2" onClick={() => resetForm()}>
              <Plus className="h-4 w-4" />
              <span>Nova Regra</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Regra de Automação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
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
                    onValueChange={setRuleLevel}
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
                      Ações <span className="text-destructive">*</span>
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>Ações a serem executadas se as condições forem atendidas, em ordem. Params variam por tipo.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="space-y-4 border rounded-md p-4 bg-muted/30">
                    {actions.map((action, index) => (
                      <div key={action.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">Ação {index + 1}</div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveAction(action.id)}
                            disabled={actions.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`action-type-${action.id}`}>Tipo de Ação</Label>
                            <Select
                              value={action.action_type}
                              onValueChange={(value) =>
                                handleActionChange(action.id, 'action_type', value)
                              }
                              required
                            >
                              <SelectTrigger id={`action-type-${action.id}`}>
                                <SelectValue placeholder="Selecionar" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pause">Pausar</SelectItem>
                                <SelectItem value="notify">Notificar</SelectItem>
                                <SelectItem value="edit_budget">Editar Orçamento</SelectItem>
                                <SelectItem value="edit_status">Editar Status</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`order-${action.id}`}>Ordem de Execução</Label>
                            <Input
                              id={`order-${action.id}`}
                              type="number"
                              min="1"
                              placeholder="Ex: 1"
                              value={action.order}
                              onChange={(e) =>
                                handleActionChange(action.id, 'order', parseInt(e.target.value) || 1)
                              }
                              required
                            />
                          </div>
                        </div>
                        {action.action_type && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderActionParams(action)}
                          </div>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleAddAction}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Ação
                    </Button>
                  </div>
                </div>

              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Salvar Regra
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Condições</TableHead>
              <TableHead>Ações</TableHead>
              <TableHead className="w-[180px]">Data de Criação</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules && rules.length > 0 ? (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.id}</TableCell>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    {rule.level === 'campaign' ? 'Campanha' : 
                     rule.level === 'adset' ? 'Conjunto de Anúncios' : 
                     rule.level === 'ad' ? 'Anúncio' : rule.level}
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {Array.isArray(rule.conditions) && rule.conditions.length > 0 ? (
                        <div className="text-sm space-y-1">
                          {rule.conditions.map((condition: any, index: number) => (
                            <div key={index} className="bg-muted/50 p-2 rounded text-xs">
                              {condition.metric} {condition.operator} {condition.value}
                              {index < rule.conditions.length - 1 && (
                                <span className="text-muted-foreground ml-1">{condition.logic}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">0 condições</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {Array.isArray(rule.actions) && rule.actions.length > 0 ? (
                        <div className="text-sm space-y-1">
                          {rule.actions.map((action: any, index: number) => (
                            <div key={index} className="bg-muted/50 p-2 rounded text-xs">
                              {action.action_type} (#{action.order})
                              {action.params && Object.keys(action.params).length > 0 && (
                                <div className="text-muted-foreground mt-1">
                                  {Object.entries(action.params).map(([key, value]) => (
                                    <div key={key}>{key}: {value as string}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">0 ações</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {rule.created_at ? new Date(rule.created_at).toLocaleString('pt-BR') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                      disabled={false}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  Nenhuma regra encontrada. Crie uma nova regra para começar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RulesTab;