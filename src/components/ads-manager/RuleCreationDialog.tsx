import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Condition {
  id: string;
  metric: string;
  operator: string;
  value: string;
  timeInterval: string;
  logic: 'AND' | 'OR';
}

interface Action {
  id: string;
  action_type: string;
  params: { [key: string]: any };
  order: number;
}

interface Schedule {
  type: 'continuous' | 'daily' | 'custom';
  customSchedule: {
    [key: string]: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
  };
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
  accountName: string | null;
  onRuleCreated: () => void;
}

const RuleCreationDialog = ({ 
  isOpen, 
  onOpenChange, 
  selectedTargets, 
  level, 
  accountName,
  onRuleCreated 
}: RuleCreationDialogProps) => {
  const { user } = useAuth();

  // Form state
  const [ruleName, setRuleName] = useState('');
  const [conditions, setConditions] = useState<Condition[]>([
    { id: 'cond_' + Date.now(), metric: 'spend', operator: '', value: '', timeInterval: 'yesterday_spent', logic: 'AND' }
  ]);
  const [action, setAction] = useState<Action>({
    id: 'act_' + Date.now(),
    action_type: '',
    params: {},
    order: 1
  });
  const [schedule, setSchedule] = useState<Schedule>({
    type: 'continuous',
    customSchedule: {
      sunday: { enabled: true, startTime: '07:00', endTime: '07:00' },
      monday: { enabled: true, startTime: '07:00', endTime: '07:00' },
      tuesday: { enabled: true, startTime: '07:00', endTime: '07:00' },
      wednesday: { enabled: true, startTime: '07:00', endTime: '07:00' },
      thursday: { enabled: true, startTime: '07:00', endTime: '07:00' },
      friday: { enabled: true, startTime: '07:00', endTime: '07:00' },
      saturday: { enabled: true, startTime: '07:00', endTime: '07:00' }
    }
  });

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      { id: 'cond_' + Date.now(), metric: 'spend', operator: '', value: '', timeInterval: 'yesterday_spent', logic: 'AND' }
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

  const handleScheduleTypeChange = (type: 'continuous' | 'daily' | 'custom') => {
    setSchedule(prev => ({ ...prev, type }));
  };

  const handleCustomScheduleChange = (day: string, field: 'enabled' | 'startTime' | 'endTime', value: boolean | string) => {
    setSchedule(prev => ({
      ...prev,
      customSchedule: {
        ...prev.customSchedule,
        [day]: {
          ...prev.customSchedule[day as keyof typeof prev.customSchedule],
          [field]: value
        }
      }
    }));
  };

  const resetForm = () => {
    setRuleName('');
    setConditions([{ id: 'cond_' + Date.now(), metric: 'spend', operator: '', value: '', timeInterval: 'yesterday_spent', logic: 'AND' }]);
    setAction({ id: 'act_' + Date.now(), action_type: '', params: {}, order: 1 });
    setSchedule({
      type: 'continuous',
      customSchedule: {
        sunday: { enabled: true, startTime: '07:00', endTime: '07:00' },
        monday: { enabled: true, startTime: '07:00', endTime: '07:00' },
        tuesday: { enabled: true, startTime: '07:00', endTime: '07:00' },
        wednesday: { enabled: true, startTime: '07:00', endTime: '07:00' },
        thursday: { enabled: true, startTime: '07:00', endTime: '07:00' },
        friday: { enabled: true, startTime: '07:00', endTime: '07:00' },
        saturday: { enabled: true, startTime: '07:00', endTime: '07:00' }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!ruleName) {
      return;
    }

    if (selectedTargets.length === 0) {
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

    // Format schedule data
    let formattedSchedule;
    if (schedule.type === 'custom') {
      // Convert time to minutes and days to numbers (0-6)
      const scheduleArray = [];
      const dayMapping = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
      };

      Object.entries(schedule.customSchedule).forEach(([dayKey, daySchedule]) => {
        if (daySchedule.enabled) {
          // Convert time to minutes (e.g., "07:00" -> 420 minutes)
          const [startHour, startMinute] = daySchedule.startTime.split(':').map(Number);
          const [endHour, endMinute] = daySchedule.endTime.split(':').map(Number);
          const startMinutes = startHour * 60 + startMinute;
          const endMinutes = endHour * 60 + endMinute;

          scheduleArray.push({
            start_minute: startMinutes,
            end_minute: endMinutes,
            days: [dayMapping[dayKey as keyof typeof dayMapping]]
          });
        }
      });

      formattedSchedule = {
        schedule_type: "CUSTOM",
        schedule: scheduleArray
      };
    } else {
      formattedSchedule = {
        schedule_type: schedule.type.toUpperCase()
      };
    }

    // Convert target IDs array to object format
    const targetsObject: { [key: string]: string } = {};
    targetIds.forEach((id, index) => {
      targetsObject[index.toString()] = id;
    });

    const ruleData = {
      value: targetsObject, // Object com os IDs dos targets
      level: level, // campaign, adset, ou ad
      account_name: accountName || user?.email || 'unknown_account', // account_name do usuário
      name: ruleName, // nome da regra
      conditions: conditionsObject, // condições incluindo intervalo de tempo
      action: actionData, // ação
      schedule: formattedSchedule, // programação formatada
      target_ids: targetIds // array completo de IDs dos alvos (mantido para compatibilidade)
    };

    try {
      // Send data to webhook
      const response = await fetch('https://mkthooks.adaptahub.org/webhook/ads-manager/create-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ruleData)
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar regra para o webhook');
      }

      // Close dialog and reset form
      onOpenChange(false);
      resetForm();
      
      // Notify parent component
      onRuleCreated();
    } catch (error) {
      console.error('Error submitting rule:', error);
    }
  };

  const renderActionParams = () => {
    // Para as ações "Ativar" e "Pausar", não há parâmetros adicionais necessários
    return null;
  };

  const daysOfWeek = [
    { key: 'sunday', label: 'Domingo' },
    { key: 'monday', label: 'Segunda' },
    { key: 'tuesday', label: 'Terça' },
    { key: 'wednesday', label: 'Quarta' },
    { key: 'thursday', label: 'Quinta' },
    { key: 'friday', label: 'Sexta' },
    { key: 'saturday', label: 'Sábado' }
  ];

  // Gerar opções de horário de 30 em 30 minutos
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeString);
    }
  }

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
                placeholder="Ex: Pausar AdSet se Gastos Altos"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                required
              />
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
                      <p>Condições baseadas em gastos, combinadas com AND/OR. Ex: Gastos {'>'} 1000 E Gastos {'<'} 5000</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
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
                      <div>
                        <Label htmlFor={`time-interval-${condition.id}`}>
                          Intervalo de Tempo <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={condition.timeInterval}
                          onValueChange={(value) =>
                            handleConditionChange(condition.id, 'timeInterval', value)
                          }
                          required
                        >
                          <SelectTrigger id={`time-interval-${condition.id}`}>
                            <SelectValue placeholder="Selecionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="today_spent">Hoje</SelectItem>
                            <SelectItem value="yesterday_spent">Ontem</SelectItem>
                            <SelectItem value="LAST_3_DAYS">Últimos 3 dias</SelectItem>
                            <SelectItem value="LAST_7_DAYS">Últimos 7 dias</SelectItem>
                            <SelectItem value="lifetime_spent">Vitalício</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <SelectItem value="activate">Ativar</SelectItem>
                        <SelectItem value="pause">Pausar</SelectItem>
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-lg font-medium">
                  Programação
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>Configure quando a regra deve ser executada. Se a hora início e de término forem iguais, a regra será executada uma vez por dia entre 30 e 60 minutos após o horário definido. Todos os horários estão no fuso: <strong>Horário de São Paulo</strong></p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-4 border rounded-md p-4 bg-muted/30">
                <RadioGroup value={schedule.type} onValueChange={handleScheduleTypeChange}>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="continuous" id="continuous" />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="continuous" className="font-medium">Continuamente</Label>
                        <p className="text-sm text-muted-foreground">
                          A regra é executada com a maior frequência possível (normalmente a cada 30 a 60 minutos).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="daily" id="daily" />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="daily" className="font-medium">Diariamente</Label>
                        <p className="text-sm text-muted-foreground">
                          entre 0h00 e 1h00 Horário de São Paulo
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="custom" className="font-medium">Personalizado</Label>
                        <p className="text-sm text-muted-foreground">
                          Ajuste a programação da regra para ser executada em dias e horários do dia específicos. Se a hora início e de término forem iguais, a regra será executada uma vez por dia entre 30 e 60 minutos após o horário definido. Todos os horários estão neste fuso: <strong>Horário de São Paulo</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>

                {schedule.type === 'custom' && (
                  <div className="mt-4 space-y-3">
                    <div className="text-sm font-medium">Agendamento Personalizado</div>
                    <div className="space-y-2">
                      {daysOfWeek.map((day) => (
                        <div key={day.key} className="flex items-center space-x-3">
                          <Checkbox
                            id={`${day.key}-enabled`}
                            checked={schedule.customSchedule[day.key as keyof typeof schedule.customSchedule].enabled}
                            onCheckedChange={(checked) => 
                              handleCustomScheduleChange(day.key, 'enabled', checked as boolean)
                            }
                          />
                          <Label htmlFor={`${day.key}-enabled`} className="w-16 text-sm">
                            {day.label}
                          </Label>
                          <Select
                            value={schedule.customSchedule[day.key as keyof typeof schedule.customSchedule].startTime}
                            onValueChange={(value) => 
                              handleCustomScheduleChange(day.key, 'startTime', value)
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="HH:MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-muted-foreground">a</span>
                          <Select
                            value={schedule.customSchedule[day.key as keyof typeof schedule.customSchedule].endTime}
                            onValueChange={(value) => 
                              handleCustomScheduleChange(day.key, 'endTime', value)
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue placeholder="HH:MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map(time => (
                                <SelectItem key={time} value={time}>{time}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
