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
import { Plus, AlertCircle, Trash2, HelpCircle, Search, X, Target } from 'lucide-react';
import { useAdRules, type AdRule } from '@/hooks/useAdRules';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import RuleCreationDialog from './RuleCreationDialog';

// Utility functions to parse conditions and actions
const parseConditions = (conditions: any): string => {
  if (!conditions || typeof conditions !== 'object') {
    return 'Nenhuma condição definida';
  }

  try {
    // Handle the new JSONB format
    if (conditions.filters && Array.isArray(conditions.filters)) {
      const filterDescriptions = conditions.filters.map((filter: any) => {
        const field = filter.field || '';
        const operator = filter.operator || '';
        const value = filter.value;
        
        // Map field names to readable Portuguese
        const fieldMap: { [key: string]: string } = {
          'adset.id': 'ID do Conjunto de Anúncios',
          'entity_type': 'Tipo de Entidade',
          'time_preset': 'Período de Tempo',
          'campaign.id': 'ID da Campanha',
          'ad.id': 'ID do Anúncio'
        };

        // Map operators to readable Portuguese
        const operatorMap: { [key: string]: string } = {
          'IN': 'contém',
          'EQUAL': 'igual a',
          'GREATER_THAN': 'maior que',
          'LESS_THAN': 'menor que',
          'GREATER_THAN_OR_EQUAL': 'maior ou igual a',
          'LESS_THAN_OR_EQUAL': 'menor ou igual a'
        };

        const readableField = fieldMap[field] || field;
        const readableOperator = operatorMap[operator] || operator;
        
        let readableValue = value;
        if (Array.isArray(value)) {
          readableValue = value.join(', ');
        } else if (typeof value === 'object') {
          readableValue = JSON.stringify(value);
        }

        return `${readableField} ${readableOperator} ${readableValue}`;
      });

      const evaluationType = conditions.evaluation_type ? ` (${conditions.evaluation_type})` : '';
      return filterDescriptions.join(' E ') + evaluationType;
    }

    // Handle legacy format
    if (Array.isArray(conditions)) {
      return conditions.map((condition: any) => {
        const metric = condition.metric || '';
        const operator = condition.operator || '';
        const value = condition.value || '';
        return `${metric} ${operator} ${value}`;
      }).join(' E ');
    }

    // Handle object format
    if (typeof conditions === 'object') {
      return Object.entries(conditions).map(([key, condition]: [string, any]) => {
        const metric = condition.metric || '';
        const operator = condition.operator || '';
        const value = condition.value || '';
        return `${metric} ${operator} ${value}`;
      }).join(' E ');
    }

    return 'Formato de condição não reconhecido';
  } catch (error) {
    console.error('Error parsing conditions:', error);
    return 'Erro ao processar condições';
  }
};

const parseActions = (actions: any): string => {
  if (!actions || typeof actions !== 'object') {
    return 'Nenhuma ação definida';
  }

  try {
    // Handle the new JSONB format
    if (actions.execution_type) {
      const executionType = actions.execution_type;
      
      // Map execution types to readable Portuguese
      const executionTypeMap: { [key: string]: string } = {
        'UNPAUSE': 'Despausar',
        'PAUSE': 'Pausar',
        'NOTIFY': 'Notificar',
        'EDIT_BUDGET': 'Editar Orçamento',
        'CHANGE_STATUS': 'Alterar Status'
      };

      const readableExecutionType = executionTypeMap[executionType] || executionType;
      
      let details = '';
      if (actions.execution_options && Array.isArray(actions.execution_options)) {
        const optionDescriptions = actions.execution_options.map((option: any) => {
          const field = option.field || '';
          const value = option.value;
          
          // Map field names to readable Portuguese
          const fieldMap: { [key: string]: string } = {
            'user_ids': 'Usuários',
            'alert_preferences': 'Preferências de Alerta'
          };

          const readableField = fieldMap[field] || field;
          
          let readableValue = value;
          if (Array.isArray(value)) {
            readableValue = value.join(', ');
          } else if (typeof value === 'object') {
            readableValue = JSON.stringify(value);
          }

          return `${readableField}: ${readableValue}`;
        });
        
        details = ` (${optionDescriptions.join(', ')})`;
      }

      return readableExecutionType + details;
    }

    // Handle legacy format
    if (Array.isArray(actions)) {
      return actions.map((action: any) => {
        const actionType = action.action_type || '';
        const order = action.order || '';
        return `${actionType} (#${order})`;
      }).join(', ');
    }

    // Handle object format
    if (typeof actions === 'object') {
      return Object.entries(actions).map(([key, action]: [string, any]) => {
        const actionType = action.action_type || '';
        const order = action.order || '';
        return `${actionType} (#${order})`;
      }).join(', ');
    }

    return 'Formato de ação não reconhecido';
  } catch (error) {
    console.error('Error parsing actions:', error);
    return 'Erro ao processar ações';
  }
};

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
  const [isExcludeDialogOpen, setIsExcludeDialogOpen] = useState(false);
  
  // Rule creation states
  const [showRuleCreation, setShowRuleCreation] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<Array<{ id: string; name: string; type: 'campaign' | 'adset' | 'ad' }>>([]);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Filter states
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  // Sort states
  const [sortField, setSortField] = useState<'created_at' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Selection states
  const [selectedRules, setSelectedRules] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Filter and sort the rules
  const filteredAndSortedRules = rules?.filter((rule) => {
    // Name search filter
    if (searchName && !rule.name.toLowerCase().includes(searchName.toLowerCase())) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      if (rule.is_active !== isActive) {
        return false;
      }
    }

    // Date filter
    if (dateFilter !== 'all' && rule.created_at) {
      const ruleDate = new Date(rule.created_at);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      switch (dateFilter) {
        case 'today':
          if (ruleDate < today) return false;
          break;
        case 'week':
          if (ruleDate < weekAgo) return false;
          break;
        case 'month':
          if (ruleDate < monthAgo) return false;
          break;
      }
    }

    return true;
  }).sort((a, b) => {
    // Sort by creation date if sort field is set
    if (sortField === 'created_at') {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      
      if (sortDirection === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    }
    
    return 0;
  }) || [];

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRules(new Set(filteredAndSortedRules.map(rule => rule.id)));
      setSelectAll(true);
    } else {
      setSelectedRules(new Set());
      setSelectAll(false);
    }
  };

  // Handle individual rule selection
  const handleRuleSelection = (ruleId: number, checked: boolean) => {
    const newSelected = new Set(selectedRules);
    if (checked) {
      newSelected.add(ruleId);
    } else {
      newSelected.delete(ruleId);
    }
    setSelectedRules(newSelected);
    setSelectAll(newSelected.size === filteredAndSortedRules.length);
  };

  // Handle exclude selected rules
  const handleExcludeRules = async () => {
    if (selectedRules.size === 0) {
      toast({
        title: "Nenhuma regra selecionada",
        description: "Selecione pelo menos uma regra para excluir.",
        variant: "destructive"
      });
      return;
    }

    setIsExcludeDialogOpen(true);
  };

  // Confirm and execute exclude
  const confirmExcludeRules = async () => {
    try {
      const response = await fetch('https://mkthooks.adaptahub.org/webhook/ads-manager/exclude-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user?.id,
          rule_ids: Array.from(selectedRules)
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir regras');
      }

      toast({
        title: "Regras excluídas",
        description: `${selectedRules.size} regra(s) foram excluída(s) com sucesso.`
      });

      // Clear selection and refetch rules
      setSelectedRules(new Set());
      setSelectAll(false);
      setIsExcludeDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Error excluding rules:', error);
      toast({
        title: "Erro ao excluir regras",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir as regras",
        variant: "destructive"
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchName('');
    setStatusFilter('all');
    setDateFilter('all');
  };

  // Handle column sorting
  // Rule creation handlers
  const handleRuleCreated = () => {
    setShowRuleCreation(false);
    setSelectedTargets([]);
    refetch(); // Refresh rules list
  };

  const handleSort = (field: 'created_at') => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default direction
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleToggleRule = async (ruleId: number, isActive: boolean) => {
    try {
      const response = await fetch('https://mkthooks.adaptahub.org/webhook/adapta-ads-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: ruleId,
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
    setRuleLevel('');
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

    // Prepare data for API - Convert arrays to object format
    const conditionsObject: { [key: string]: any } = {};
    conditions.forEach((condition, index) => {
      const { id, ...conditionData } = condition;
      conditionsObject[index.toString()] = conditionData;
    });

    const actionsObject: { [key: string]: any } = {};
    const { id, ...actionData } = action;
    actionsObject["0"] = actionData;

    const ruleData = {
      name: ruleName,
      is_active: true, // Sempre inicia como ativa
      level: ruleLevel,
      conditions: conditionsObject,
      actions: actionsObject,
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRuleCreation(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Regra
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2" onClick={() => resetForm()}>
                <Plus className="h-4 w-4" />
                <span>Nova Regra Geral</span>
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
      </div>

      {/* Filters Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {(searchName || statusFilter !== 'all' || dateFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center space-x-2 text-muted-foreground"
              >
                <X className="h-4 w-4" />
                <span>Limpar Filtros</span>
              </Button>
            )}
          </div>
          
          {selectedRules.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {selectedRules.size} regra(s) selecionada(s)
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleExcludeRules}
                className="flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir Selecionadas</span>
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30">
          <div>
            <Label htmlFor="search-name">Buscar por nome</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-name"
                placeholder="Digite o nome da regra..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
              <SelectTrigger id="status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="inactive">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date-filter">Data de Criação</Label>
            <Select value={dateFilter} onValueChange={(value: 'all' | 'today' | 'week' | 'month') => setDateFilter(value)}>
              <SelectTrigger id="date-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as datas</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-muted-foreground">
              {filteredAndSortedRules.length} de {rules?.length || 0} regras
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                  disabled={filteredAndSortedRules.length === 0}
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Condições</TableHead>
              <TableHead>Ações</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Data de Criação</span>
                  {sortField === 'created_at' && (
                    <span className="text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedRules.length > 0 ? (
              filteredAndSortedRules.map((rule) => (
                <TableRow 
                  key={rule.id}
                  className={selectedRules.has(rule.id) ? 'bg-muted/50' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedRules.has(rule.id)}
                      onCheckedChange={(checked) => handleRuleSelection(rule.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="text-sm bg-muted/50 p-2 rounded">
                        {parseConditions(rule.conditions)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="text-sm bg-muted/50 p-2 rounded">
                        {parseActions(rule.actions)}
                      </div>
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
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  {rules && rules.length > 0 
                    ? 'Nenhuma regra encontrada com os filtros aplicados.'
                    : 'Nenhuma regra encontrada. Crie uma nova regra para começar.'
                  }
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Exclude Confirmation Dialog */}
      <Dialog open={isExcludeDialogOpen} onOpenChange={setIsExcludeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir {selectedRules.size} regra(s) selecionada(s)? 
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsExcludeDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmExcludeRules}
            >
              Excluir Regras
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Rule Creation Dialog */}
      <RuleCreationDialog
        isOpen={showRuleCreation}
        onOpenChange={setShowRuleCreation}
        selectedTargets={[]}
        level="campaign"
        onRuleCreated={handleRuleCreated}
      />
    </div>
  );
};

export default RulesTab;