import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Trash2, Search, X } from 'lucide-react';
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


interface RulesTabProps {
  accountName: string | null;
}

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



const RulesTab = ({ accountName }: RulesTabProps) => {
  const { data: rules, isLoading, error, refetch } = useAdRules();

  const [isExcludeDialogOpen, setIsExcludeDialogOpen] = useState(false);
  

  
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




    </div>
  );
};

export default RulesTab;