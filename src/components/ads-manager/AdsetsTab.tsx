import { useState, useMemo, useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, BarChart3, Edit2, Check, X, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Target, Trash2, Power, PowerOff } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { formatCurrency, formatPercentage, getCPAColorClass } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { updateAdset, createAdset, createCampaign } from '@/utils/api';
import { useAdsetsData } from '@/hooks/useAdsData';
import FilterBar from './FilterBar';
import ColumnOrderDialog from './ColumnOrderDialog';
import { useColumnOrder } from '@/hooks/useColumnOrder';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import DetailView from './DetailView';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/sortable-header';
import RuleCreationDialog from './RuleCreationDialog';
import { useAvailableAccounts } from '@/hooks/useHomeMetrics';

interface AdsetsTabProps {
  campaignId: string | null;
  onAdsetSelect: (adsetId: string) => void;
}

const AdsetsTab = ({ campaignId, onAdsetSelect }: AdsetsTabProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [tempBudget, setTempBudget] = useState<string>('');
  const [newCampaign, setNewCampaign] = useState({ 
    name: '', 
    account_name: '', 
    budgetEnabled: false, 
    budget: '' 
  });
  
  // Adset creation states
  const [campaignAdsets, setCampaignAdsets] = useState<Array<{
    id: string;
    name: string;
    dailyBudget: string;
    gender: string;
    ageMin: string;
    ageMax: string;
    platforms: string[];
    placements: string[];
  }>>([]);
  const [currentAdset, setCurrentAdset] = useState({
    name: '',
    dailyBudget: '',
    gender: 'all',
    ageMin: '18',
    ageMax: '65+',
    platforms: ['Facebook', 'Instagram', 'Messenger', 'Audience Network', 'Threads'],
    placements: [
      'Feed do Facebook',
      'Feed do perfil do Facebook', 
      'Feed do Instagram',
      'Feed do perfil do Instagram',
      'Facebook Marketplace',
      'Feeds de vídeo do Facebook',
      'Coluna da direita do Facebook',
      'Explorar do Instagram',
      'Página inicial do Explorar do Instagram',
      'Caixa de Entrada do Messenger',
      'Facebook Business Explore',
      'Feed do Threads',
      'Notificações do Facebook',
      'Stories do Facebook',
      'Stories do Instagram',
      'Reels do Instagram'
    ]
  });
  const [showAdsetForm, setShowAdsetForm] = useState(false);
  const [creationStep, setCreationStep] = useState<'campaign' | 'adsets'>('campaign');
  const [platformsOpen, setPlatformsOpen] = useState(false);
  const [placementsOpen, setPlacementsOpen] = useState(false);
  const platformsRef = useRef<HTMLDivElement>(null);
  const placementsRef = useRef<HTMLDivElement>(null);
  const [expandedAdset, setExpandedAdset] = useState<string | null>(null);
  const [detailMetrics, setDetailMetrics] = useState<{ [adsetId: string]: { threeDay: any; sevenDay: any } }>({});
  const [showBudgetConfirmation, setShowBudgetConfirmation] = useState(false);
  const [pendingBudgetChange, setPendingBudgetChange] = useState<{ adset: any; newBudget: number; currentBudget: number } | null>(null);
  
  // Rule creation states
  const [showRuleCreation, setShowRuleCreation] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<Array<{ id: string; name: string; type: 'campaign' | 'adset' | 'ad' }>>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Bulk actions states
  const [showBulkStatusDialog, setShowBulkStatusDialog] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState<'ATIVO' | 'DESATIVADA'>('ATIVO');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  
  const { toast } = useToast();
  const { columnOrders, updateColumnOrder, resetColumnOrder, getVisibleColumns, getAllColumns, isColumnVisible, toggleColumnVisibility } = useColumnOrder();
  const { settings, updateDateFilter, updateNameFilter, updateStatusFilter } = useGlobalSettings();

  // Fechar dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (platformsRef.current && !platformsRef.current.contains(event.target as Node)) {
        setPlatformsOpen(false);
      }
      if (placementsRef.current && !placementsRef.current.contains(event.target as Node)) {
        setPlacementsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const { data: adsetsData, isLoading, error, updateOptimistic, clearOptimistic } = useAdsetsData(campaignId, settings.dateFilter);
  const { data: availableAccounts, isLoading: accountsLoading } = useAvailableAccounts();

  // Sorting functionality with default sort by CPA descending
  const { sortedData: sortedAdsets, handleSort, getSortDirection } = useTableSort(adsetsData || [], { column: 'cpa', direction: 'desc' });

  const filteredAdsets = useMemo(() => {
    if (!sortedAdsets) return [];

    return sortedAdsets.filter(adset => {
      const matchesName = adset.name.toLowerCase().includes(settings.nameFilter.toLowerCase());
      const matchesStatus = settings.statusFilter === 'all' || 
        (settings.statusFilter === 'ACTIVE' && adset.statusFinal === 'ATIVO') ||
        (settings.statusFilter === 'PAUSED' && adset.statusFinal === 'DESATIVADA');
      return matchesName && matchesStatus;
    });
  }, [sortedAdsets, settings.nameFilter, settings.statusFilter]);

  // Coletar todos os CPAs para o color scale (conjuntos principais + 3 dias + 7 dias)
  const allCPAs = useMemo(() => {
    const cpas: number[] = [];
    
    // CPAs dos conjuntos principais
    filteredAdsets.forEach(adset => {
      if (adset.cpa > 0) cpas.push(adset.cpa);
    });
    
    // CPAs das métricas de 3 e 7 dias
    Object.values(detailMetrics).forEach(metrics => {
      if (metrics.threeDay?.cpa > 0) cpas.push(metrics.threeDay.cpa);
      if (metrics.sevenDay?.cpa > 0) cpas.push(metrics.sevenDay.cpa);
    });
    
    return cpas;
  }, [filteredAdsets, detailMetrics]);

  // Cálculo das métricas de resumo
  const summaryMetrics = useMemo(() => {
    if (!filteredAdsets.length) {
      console.log('No adsets data available for the selected period');
      return {
        dailyBudget: 0,
        spend: 0,
        revenue: 0,
        sales: 0,
        profit: 0,
        cpa: 0,
        cpm: 0,
        roas: 0,
        ctr: 0,
        clickCv: 0,
        epc: 0,
      };
    }

    const totalSpend = filteredAdsets.reduce((sum, adset) => sum + adset.spend, 0);
    const totalRevenue = filteredAdsets.reduce((sum, adset) => sum + adset.revenue, 0);
    const totalSales = filteredAdsets.reduce((sum, adset) => sum + adset.sales, 0);
    const totalProfit = filteredAdsets.reduce((sum, adset) => sum + adset.profit, 0);
    const totalClicks = filteredAdsets.reduce((sum, adset) => sum + adset.clicks, 0);
    const totalImpressions = filteredAdsets.reduce((sum, adset) => sum + adset.impressions, 0);
    const totalDailyBudget = filteredAdsets.reduce((sum, adset) => sum + adset.dailyBudget, 0);

    console.log('Adsets summary metrics calculated for period:', {
      adsetsCount: filteredAdsets.length,
      totalSpend,
      totalSales,
      totalRevenue,
      totalProfit,
      totalDailyBudget
    });

    return {
      dailyBudget: totalDailyBudget,
      spend: totalSpend,
      revenue: totalRevenue,
      sales: totalSales,
      profit: totalProfit,
      cpa: totalSales > 0 ? totalSpend / totalSales : 0,
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      clickCv: totalClicks > 0 ? (totalSales / totalClicks) * 100 : 0,
      epc: totalClicks > 0 ? totalRevenue / totalClicks : 0,
    };
  }, [filteredAdsets]);

  const handleStatusChange = async (adset: any, newStatus: boolean) => {
    // Atualização otimística - mostrar mudança imediatamente
    updateOptimistic(adset.firstAdId, { status: newStatus ? 'ACTIVE' : 'PAUSED' });
    
    try {
      // Use realId to send the correct adset_id
      await updateAdset(adset.realId, 'status', newStatus ? 'ACTIVE' : 'PAUSED');
      
      toast({
        title: "Status atualizado",
        description: `Conjunto ${newStatus ? 'ativado' : 'pausado'} com sucesso.`,
      });
    } catch (error) {
      // Reverter a mudança otimística em caso de erro
      clearOptimistic(adset.firstAdId);
      
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do conjunto.",
        variant: "destructive",
      });
    }
  };

  // Bulk status change handler
  const handleBulkStatusChange = async () => {
    if (selectedTargets.length === 0) return;
    
    setIsBulkUpdating(true);
    
    try {
      // Get the actual adset objects from the selected targets
      const selectedAdsets = filteredAdsets.filter(adset => 
        selectedTargets.some(target => target.id === (adset.realId || adset.id))
      );
      
      // Update all selected adsets
      const updatePromises = selectedAdsets.map(adset => 
        updateAdset(adset.realId, 'status', bulkStatusValue === 'ATIVO' ? 'ACTIVE' : 'PAUSED')
      );
      
      await Promise.all(updatePromises);
      
      // Update optimistic for all adsets
      selectedAdsets.forEach(adset => {
        updateOptimistic(adset.firstAdId, { statusFinal: bulkStatusValue });
      });
      
      toast({
        title: "Status atualizado em massa",
        description: `${selectedAdsets.length} conjunto(s) ${bulkStatusValue === 'ATIVO' ? 'ativado(s)' : 'pausado(s)'} com sucesso.`,
      });
      
      // Close dialog and reset selection
      setShowBulkStatusDialog(false);
      setSelectedTargets([]);
      setIsSelectionMode(false);
      
    } catch (error) {
      console.error('Error updating bulk adset status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status dos conjuntos selecionados.",
        variant: "destructive",
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBudgetEdit = (adsetId: string, currentBudget: number) => {
    setEditingBudget(adsetId);
    setTempBudget(currentBudget.toString());
  };

  const handleBudgetSave = async (adset: any) => {
    const newBudget = parseFloat(tempBudget);
    if (isNaN(newBudget) || newBudget <= 0) {
      toast({
        title: "Erro",
        description: "Valor de orçamento inválido.",
        variant: "destructive",
      });
      return;
    }

    // Check if the new budget is 4x bigger than the current budget
    const currentBudget = adset.dailyBudget;
    const budgetIncrease = newBudget / currentBudget;
    
    if (budgetIncrease >= 4) {
      // Show confirmation dialog
      setPendingBudgetChange({ adset, newBudget, currentBudget });
      setShowBudgetConfirmation(true);
      return;
    }

    // Proceed with the update if no confirmation needed
    await performBudgetUpdate(adset, newBudget);
  };

  const performBudgetUpdate = async (adset: any, newBudget: number) => {
    // Atualização otimística - mostrar mudança imediatamente
    updateOptimistic(adset.firstAdId, { dailyBudget: newBudget });

    try {
      // Use realId to send the correct adset_id
      await updateAdset(adset.realId, 'budget', newBudget);
      
      setEditingBudget(null);
      toast({
        title: "Orçamento atualizado",
        description: "Orçamento diário alterado com sucesso.",
      });
    } catch (error) {
      // Reverter a mudança otimística em caso de erro
      clearOptimistic(adset.firstAdId);
      setEditingBudget(null);
      
      toast({
        title: "Erro",
        description: "Falha ao atualizar orçamento.",
        variant: "destructive",
      });
    }
  };

  const handleBudgetConfirmation = async () => {
    if (pendingBudgetChange) {
      await performBudgetUpdate(pendingBudgetChange.adset, pendingBudgetChange.newBudget);
      setShowBudgetConfirmation(false);
      setPendingBudgetChange(null);
    }
  };

  const handleBudgetConfirmationCancel = () => {
    setShowBudgetConfirmation(false);
    setPendingBudgetChange(null);
  };

  const handleBudgetCancel = () => {
    setEditingBudget(null);
    setTempBudget('');
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para a campanha.",
        variant: "destructive",
      });
      return;
    }

    if (!newCampaign.account_name) {
      toast({
        title: "Conta obrigatória",
        description: "Por favor, selecione uma conta para criar a campanha.",
        variant: "destructive",
      });
      return;
    }

    if (newCampaign.budgetEnabled && (!newCampaign.budget || parseFloat(newCampaign.budget) <= 0)) {
      toast({
        title: "Orçamento obrigatório",
        description: "Por favor, insira um valor válido para o orçamento.",
        variant: "destructive",
      });
      return;
    }

    if (campaignAdsets.length === 0) {
      toast({
        title: "Conjuntos obrigatórios",
        description: "Por favor, adicione pelo menos um conjunto à campanha.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar a campanha primeiro
      await createCampaign({
        name: newCampaign.name,
        level: 'campaign',
        account_name: newCampaign.account_name,
        daily_budget: newCampaign.budgetEnabled ? parseFloat(newCampaign.budget) : undefined,
      });
      
      // Criar os conjuntos
      for (const adset of campaignAdsets) {
        await createAdset({
          name: adset.name,
          level: 'adset',
          daily_budget: parseFloat(adset.dailyBudget),
          // Aqui você pode adicionar os campos específicos do conjunto
          // como gender, age, platforms, placements, etc.
        });
      }
      
      // Resetar todos os estados
      setNewCampaign({ name: '', account_name: '', budgetEnabled: false, budget: '' });
      setCampaignAdsets([]);
      setCurrentAdset({
        name: '',
        dailyBudget: '',
        gender: 'all',
        ageMin: '18',
        ageMax: '65',
        platforms: [],
        placements: []
      });
      setShowCreateDialog(false);
      
      toast({
        title: "Campanha e Conjuntos criados",
        description: `Campanha "${newCampaign.name}" criada com ${campaignAdsets.length} conjunto(s) na conta ${newCampaign.account_name}.`,
      });
    } catch (error) {
      console.error('Error creating campaign and adsets:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a campanha e os conjuntos.",
        variant: "destructive",
      });
    }
  };

  const handleMetricsReady = (adsetId: string, metrics: { threeDay: any; sevenDay: any }) => {
    setDetailMetrics(prev => ({
      ...prev,
      [adsetId]: metrics
    }));
  };

  // Adset management functions
  const handleAddAdset = () => {
    if (!currentAdset.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o conjunto.",
        variant: "destructive",
      });
      return;
    }

    if (!currentAdset.dailyBudget || parseFloat(currentAdset.dailyBudget) <= 0) {
      toast({
        title: "Orçamento obrigatório",
        description: "Por favor, insira um orçamento válido para o conjunto.",
        variant: "destructive",
      });
      return;
    }

    const newAdset = {
      id: `adset_${Date.now()}`,
      ...currentAdset
    };

    setCampaignAdsets(prev => [...prev, newAdset]);
    setCurrentAdset({
      name: '',
      dailyBudget: '',
      gender: 'all',
      ageMin: '18',
      ageMax: '65+',
      platforms: ['Facebook', 'Instagram', 'Messenger', 'Audience Network', 'Threads'],
      placements: [
        'Feed do Facebook',
        'Feed do perfil do Facebook', 
        'Feed do Instagram',
        'Feed do perfil do Instagram',
        'Facebook Marketplace',
        'Feeds de vídeo do Facebook',
        'Coluna da direita do Facebook',
        'Explorar do Instagram',
        'Página inicial do Explorar do Instagram',
        'Caixa de Entrada do Messenger',
        'Facebook Business Explore',
        'Feed do Threads',
        'Notificações do Facebook',
        'Stories do Facebook',
        'Stories do Instagram',
        'Reels do Instagram'
      ]
    });
    setShowAdsetForm(false);

    toast({
      title: "Conjunto adicionado",
      description: `Conjunto "${currentAdset.name}" adicionado à campanha.`,
    });
  };

  const handleRemoveAdset = (adsetId: string) => {
    setCampaignAdsets(prev => prev.filter(adset => adset.id !== adsetId));
  };

  const handlePlatformToggle = (platform: string) => {
    setCurrentAdset(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  const handlePlacementToggle = (placement: string) => {
    setCurrentAdset(prev => ({
      ...prev,
      placements: prev.placements.includes(placement)
        ? prev.placements.filter(p => p !== placement)
        : [...prev.placements, placement]
    }));
  };

  // Rule creation handlers
  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedTargets([]); // Clear selection when exiting selection mode
    }
  };

  const handleTargetToggle = (adset: any, checked: boolean) => {
    if (checked) {
      setSelectedTargets(prev => [...prev, {
        id: adset.realId || adset.id,
        name: adset.name,
        type: 'adset' as const
      }]);
    } else {
      setSelectedTargets(prev => prev.filter(t => t.id !== (adset.realId || adset.id)));
    }
  };

  const handleSelectAllTargets = (checked: boolean) => {
    if (checked) {
      setSelectedTargets(filteredAdsets.map(adset => ({
        id: adset.realId || adset.id,
        name: adset.name,
        type: 'adset' as const
      })));
    } else {
      setSelectedTargets([]);
    }
  };

  const handleRuleCreated = () => {
    setShowRuleCreation(false);
    setSelectedTargets([]);
    setIsSelectionMode(false);
    // Optionally refresh data or show success message
  };

  // Helper function to calculate CTR delta
  const calculateCTRDelta = (currentCTR: number, periodCTR: number) => {
    if (periodCTR === 0) return currentCTR > 0 ? 100 : 0;
    return ((currentCTR - periodCTR) / periodCTR) * 100;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600">Carregando conjuntos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 mb-2">Erro ao carregar dados dos conjuntos</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!filteredAdsets || filteredAdsets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-slate-600 mb-2">Nenhum conjunto encontrado</p>
          <p className="text-slate-500 text-sm">Selecione uma campanha com conjuntos ativos ou acesse todos os conjuntos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Conjuntos de Anúncios</h2>
          <p className="text-slate-600">Configure orçamentos e públicos-alvo</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={handleToggleSelectionMode}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            {isSelectionMode ? "Sair da Seleção" : "Selecionar Conjuntos"}
          </Button>
          
          {isSelectionMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkStatusDialog(true)}
                className="flex items-center gap-2"
                disabled={selectedTargets.length === 0}
              >
                <Power className="h-4 w-4" />
                Mudar Status
                {selectedTargets.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedTargets.length}
                  </Badge>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRuleCreation(true)}
                className="flex items-center gap-2"
                disabled={selectedTargets.length === 0}
              >
                <Plus className="h-4 w-4" />
                Nova Regra
                {selectedTargets.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedTargets.length}
                  </Badge>
                )}
              </Button>
            </>
          )}
          
          <Badge variant="secondary" className="px-3 py-1">
            {filteredAdsets.length} conjuntos
          </Badge>
          <ColumnOrderDialog
            tableType="adsets"
            columnOrder={getVisibleColumns('adsets')}
            onColumnOrderChange={(newOrder) => updateColumnOrder('adsets', newOrder)}
            onReset={() => resetColumnOrder('adsets')}
            getAllColumns={() => getAllColumns('adsets')}
            isColumnVisible={(column) => isColumnVisible('adsets', column)}
            toggleColumnVisibility={(column) => toggleColumnVisibility('adsets', column)}
          />
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Nova Campanha</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Campanha</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Campaign Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações da Campanha</h3>
                  <div>
                    <Label htmlFor="campaign-name">Nome da Campanha</Label>
                    <Input
                      id="campaign-name"
                      placeholder="Digite o nome da campanha"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="campaign-account">Conta</Label>
                    <Select
                      value={newCampaign.account_name}
                      onValueChange={(value) => setNewCampaign(prev => ({ ...prev, account_name: value }))}
                      disabled={accountsLoading}
                    >
                      <SelectTrigger id="campaign-account">
                        <SelectValue placeholder={accountsLoading ? "Carregando contas..." : "Selecione uma conta"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAccounts?.map((account) => (
                          <SelectItem key={account} value={account}>
                            {account}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="campaign-budget-toggle">Orçamento a nível de campanha?</Label>
                      <p className="text-sm text-muted-foreground">
                        Ative para definir um orçamento específico para esta campanha
                      </p>
                    </div>
                    <Switch
                      id="campaign-budget-toggle"
                      checked={newCampaign.budgetEnabled}
                      onCheckedChange={(checked) => setNewCampaign(prev => ({ ...prev, budgetEnabled: checked }))}
                    />
                  </div>
                  
                  {newCampaign.budgetEnabled && (
                    <div>
                      <Label htmlFor="campaign-budget">Orçamento Diário (R$)</Label>
                      <Input
                        id="campaign-budget"
                        type="number"
                        placeholder="150.00"
                        value={newCampaign.budget}
                        onChange={(e) => setNewCampaign(prev => ({ ...prev, budget: e.target.value }))}
                        min="1"
                        step="0.01"
                      />
                    </div>
                  )}
                </div>

                {/* Adsets Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Conjuntos de Anúncios</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdsetForm(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Conjunto
                    </Button>
                  </div>

                  {/* Existing Adsets */}
                  {campaignAdsets.length > 0 && (
                    <div className="space-y-2">
                      {campaignAdsets.map((adset) => (
                        <div key={adset.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                          <div className="flex-1">
                            <div className="font-medium">{adset.name}</div>
                            <div className="text-sm text-slate-600">
                              Orçamento: R$ {adset.dailyBudget} | 
                              Gênero: {adset.gender === 'all' ? 'Todos' : adset.gender} | 
                              Idade: {adset.ageMin}-{adset.ageMax} anos
                            </div>
                            {adset.platforms.length > 0 && (
                              <div className="text-sm text-slate-600">
                                Plataformas: {adset.platforms.join(', ')}
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAdset(adset.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {campaignAdsets.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <p>Nenhum conjunto adicionado ainda</p>
                      <p className="text-sm">Clique em "Adicionar Conjunto" para começar</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateCampaign}>
                  Criar Conjuntos
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Adset Creation Dialog */}
          <Dialog open={showAdsetForm} onOpenChange={setShowAdsetForm}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Conjunto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="adset-name">Nome do Conjunto</Label>
                  <Input
                    id="adset-name"
                    placeholder="Ex: Lookalike 2% - Compradoras"
                    value={currentAdset.name}
                    onChange={(e) => setCurrentAdset(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="adset-budget">Orçamento Diário (R$)</Label>
                  <Input
                    id="adset-budget"
                    type="number"
                    placeholder="150.00"
                    value={currentAdset.dailyBudget}
                    onChange={(e) => setCurrentAdset(prev => ({ ...prev, dailyBudget: e.target.value }))}
                    min="1"
                    step="0.01"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adset-gender">Gênero</Label>
                    <Select
                      value={currentAdset.gender}
                      onValueChange={(value) => setCurrentAdset(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger id="adset-gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="men">Homens</SelectItem>
                        <SelectItem value="women">Mulheres</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="adset-age-min">Idade Mínima</Label>
                      <Select
                        value={currentAdset.ageMin}
                        onValueChange={(value) => setCurrentAdset(prev => ({ ...prev, ageMin: value }))}
                      >
                        <SelectTrigger id="adset-age-min">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 48 }, (_, i) => i + 13).map(age => (
                            <SelectItem key={age} value={age.toString()}>{age}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="adset-age-max">Idade Máxima</Label>
                      <Select
                        value={currentAdset.ageMax}
                        onValueChange={(value) => setCurrentAdset(prev => ({ ...prev, ageMax: value }))}
                      >
                        <SelectTrigger id="adset-age-max">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 48 }, (_, i) => i + 13).map(age => (
                            <SelectItem key={age} value={age.toString()}>{age}</SelectItem>
                          ))}
                          <SelectItem value="65+">65+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="relative" ref={platformsRef}>
                  <Label>Plataformas</Label>
                  <Button
                    variant="outline"
                    onClick={() => setPlatformsOpen(!platformsOpen)}
                    className="w-full justify-between"
                  >
                    {currentAdset.platforms.length === 0
                      ? "Selecione as plataformas"
                      : currentAdset.platforms.length === 5
                      ? "Todas as plataformas"
                      : `${currentAdset.platforms.length} plataforma${currentAdset.platforms.length > 1 ? 's' : ''} selecionada${currentAdset.platforms.length > 1 ? 's' : ''}`}
                    <ChevronDown className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${platformsOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  
                  {platformsOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <Input 
                          placeholder="Buscar plataforma..." 
                          className="mb-2"
                          onChange={(e) => {
                            // Implementar busca se necessário
                          }}
                        />
                        <div className="space-y-1">
                          {['Facebook', 'Instagram', 'Messenger', 'Audience Network', 'Threads'].map((platform) => (
                            <div
                              key={platform}
                              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                              onClick={() => handlePlatformToggle(platform)}
                            >
                              <Checkbox
                                checked={currentAdset.platforms.includes(platform)}
                                className="mr-2"
                              />
                              <span className="text-sm">{platform}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={placementsRef}>
                  <Label>Posicionamentos</Label>
                  <Button
                    variant="outline"
                    onClick={() => setPlacementsOpen(!placementsOpen)}
                    className="w-full justify-between"
                  >
                    {currentAdset.placements.length === 0
                      ? "Selecione os posicionamentos"
                      : currentAdset.placements.length === 16
                      ? "Todos os posicionamentos"
                      : `${currentAdset.placements.length} posicionamento${currentAdset.placements.length > 1 ? 's' : ''} selecionado${currentAdset.placements.length > 1 ? 's' : ''}`}
                    <ChevronDown className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${placementsOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  
                  {placementsOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <Input 
                          placeholder="Buscar posicionamento..." 
                          className="mb-2"
                          onChange={(e) => {
                            // Implementar busca se necessário
                          }}
                        />
                        <div className="space-y-1">
                          {[
                            'Feed do Facebook',
                            'Feed do perfil do Facebook', 
                            'Feed do Instagram',
                            'Feed do perfil do Instagram',
                            'Facebook Marketplace',
                            'Feeds de vídeo do Facebook',
                            'Coluna da direita do Facebook',
                            'Explorar do Instagram',
                            'Página inicial do Explorar do Instagram',
                            'Caixa de Entrada do Messenger',
                            'Facebook Business Explore',
                            'Feed do Threads',
                            'Notificações do Facebook',
                            'Stories do Facebook',
                            'Stories do Instagram',
                            'Reels do Instagram'
                          ].map((placement) => (
                            <div
                              key={placement}
                              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                              onClick={() => handlePlacementToggle(placement)}
                            >
                              <Checkbox
                                checked={currentAdset.placements.includes(placement)}
                                className="mr-2"
                              />
                              <span className="text-sm">{placement}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowAdsetForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddAdset}>
                  Adicionar Conjunto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <FilterBar
        activeTab="adsets"
        onNameFilter={updateNameFilter}
        onStatusFilter={updateStatusFilter}
        onDateFilter={updateDateFilter}
        nameFilter={settings.nameFilter}
        statusFilter={settings.statusFilter}
        dateFilter={settings.dateFilter}
      />

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto chat-table-container">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b-slate-200">
                {isSelectionMode && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTargets.length === filteredAdsets.length && filteredAdsets.length > 0}
                      onCheckedChange={handleSelectAllTargets}
                      disabled={filteredAdsets.length === 0}
                    />
                  </TableHead>
                )}
                {getVisibleColumns('adsets').map((column) => {
                  const isRightAligned = !['status', 'name'].includes(column);
                  const isSortable = !['status', 'name', 'dailyBudget'].includes(column);
                  const sortDirection = getSortDirection(column);
                  
                  return (
                    <TableHead 
                      key={column}
                      className={`font-semibold min-w-[80px] ${isRightAligned ? 'text-right' : ''} ${column === 'name' ? 'min-w-[200px]' : ''} ${column === 'dailyBudget' ? 'min-w-[130px]' : ''}`}
                    >
                      {isSortable ? (
                        <SortableHeader
                          column={column}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                          className={`${isRightAligned ? 'justify-end' : ''}`}
                        >
                          {column === 'status' && 'Status'}
                          {column === 'name' && 'Nome do Conjunto'}
                          {column === 'dailyBudget' && 'Orçamento Diário'}
                          {column === 'spend' && 'Valor Gasto'}
                          {column === 'revenue' && 'Faturamento'}
                          {column === 'sales' && 'Vendas'}
                          {column === 'profit' && 'Profit'}
                          {column === 'cpa' && 'CPA'}
                          {column === 'cpm' && 'CPM'}
                          {column === 'roas' && 'ROAS'}
                          {column === 'ctr' && 'CTR'}
                          {column === 'clickCv' && 'Click CV'}
                          {column === 'epc' && 'EPC'}
                        </SortableHeader>
                      ) : (
                        <>
                          {column === 'status' && 'Status'}
                          {column === 'name' && 'Nome do Conjunto'}
                          {column === 'dailyBudget' && 'Orçamento Diário'}
                          {column === 'spend' && 'Valor Gasto'}
                          {column === 'revenue' && 'Faturamento'}
                          {column === 'sales' && 'Vendas'}
                          {column === 'profit' && 'Profit'}
                          {column === 'cpa' && 'CPA'}
                          {column === 'cpm' && 'CPM'}
                          {column === 'roas' && 'ROAS'}
                          {column === 'ctr' && 'CTR'}
                          {column === 'clickCv' && 'Click CV'}
                          {column === 'epc' && 'EPC'}
                        </>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdsets.map((adset) => (
                <>
                  <TableRow key={adset.id} className="hover:bg-slate-50">
                    {isSelectionMode && (
                      <TableCell className="w-12">
                        <Checkbox
                          checked={selectedTargets.some(t => t.id === (adset.realId || adset.id))}
                          onCheckedChange={(checked) => handleTargetToggle(adset, checked as boolean)}
                        />
                      </TableCell>
                    )}
                  {getVisibleColumns('adsets').map((column) => {
                    const isRightAligned = !['status', 'name'].includes(column);
                    
                    return (
                      <TableCell 
                        key={column}
                        className={`${isRightAligned ? 'text-right font-mono text-sm' : ''} ${column === 'name' ? 'font-medium' : ''} ${column === 'cpa' ? getCPAColorClass(adset.cpa, allCPAs) : ''}`}
                      >
                        {column === 'status' && (
                          <Switch
                            checked={adset.statusFinal === 'ATIVO'}
                            onCheckedChange={(checked) => handleStatusChange(adset, checked)}
                          />
                        )}
                        {column === 'name' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setExpandedAdset(expandedAdset === adset.id ? null : adset.id)}
                              className="flex items-center justify-center w-6 h-6 hover:bg-gray-100 rounded transition-colors"
                            >
                              {expandedAdset === adset.id ? (
                                <ChevronDown className="h-4 w-4 text-gray-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                              )}
                            </button>
                            <div 
                              className="flex items-center space-x-2 cursor-pointer hover:text-blue-600 transition-colors flex-1"
                              onClick={() => onAdsetSelect(adset.name)}
                            >
                              <BarChart3 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <span className="underline-offset-4 hover:underline truncate">{adset.name}</span>
                            </div>
                            <CopyButton text={adset.name} />
                          </div>
                        )}
                        {column === 'dailyBudget' && (
                          <div>
                            {adset.isAdsetLevelBudget ? (
                              editingBudget === adset.id ? (
                                <div className="flex items-center justify-start space-x-1">
                                  <Input
                                    type="number"
                                    value={tempBudget}
                                    onChange={(e) => setTempBudget(e.target.value)}
                                    className="w-20 h-7 text-xs"
                                    min="1"
                                    step="0.01"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleBudgetSave(adset)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleBudgetCancel}
                                    className="h-7 w-7 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-start space-x-1">
                                  <span className="font-mono text-sm">{formatCurrency(adset.dailyBudget)}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleBudgetEdit(adset.id, adset.dailyBudget)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )
                            ) : (
                              <div className="text-xs text-yellow-600">
                                Orçamento a nível de campanha
                              </div>
                            )}
                          </div>
                        )}
                        {column === 'spend' && formatCurrency(adset.spend)}
                        {column === 'revenue' && (
                          <span className="text-green-600">{formatCurrency(adset.revenue)}</span>
                        )}
                        {column === 'sales' && (
                          <span className="font-semibold">{adset.sales}</span>
                        )}
                        {column === 'profit' && (
                          <span className={adset.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(adset.profit)}
                          </span>
                        )}
                        {column === 'cpa' && formatCurrency(adset.cpa)}
                        {column === 'cpm' && formatCurrency(adset.cpm)}
                        {column === 'roas' && (
                          <span className="font-semibold">{adset.roas.toFixed(2)}x</span>
                        )}
                        {column === 'ctr' && formatPercentage(adset.ctr)}
                        {column === 'clickCv' && formatPercentage(adset.clickCv)}
                        {column === 'epc' && formatCurrency(adset.epc)}
                      </TableCell>
                    );
                  })}
                  </TableRow>
                  
                  {/* 3 Days Metrics Row */}
                  {expandedAdset === adset.id && detailMetrics[adset.id]?.threeDay && (
                    <TableRow>
                      {isSelectionMode && <TableCell className="w-12"></TableCell>}
                      {getVisibleColumns('adsets').map((column) => {
                        const isRightAligned = !['status', 'name'].includes(column);
                        const metrics = detailMetrics[adset.id].threeDay;
                        
                        return (
                          <TableCell 
                            key={column}
                            className={`${isRightAligned ? 'text-right font-mono text-sm' : ''} ${column === 'cpa' ? getCPAColorClass(metrics.cpa, allCPAs) : ''}`}
                          >
                            {column === 'status' && ''}
                            {column === 'name' && (
                              <span className="font-semibold">3 Dias</span>
                            )}
                            {column === 'dailyBudget' && ''}
                            {column === 'spend' && formatCurrency(metrics.spend)}
                            {column === 'revenue' && (
                              <span className="text-green-600">{formatCurrency(metrics.revenue)}</span>
                            )}
                            {column === 'sales' && (
                              <span className="font-semibold">{metrics.sales}</span>
                            )}
                            {column === 'profit' && (
                              <span className={metrics.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(metrics.profit)}
                              </span>
                            )}
                            {column === 'cpa' && formatCurrency(metrics.cpa)}
                            {column === 'cpm' && formatCurrency(metrics.cpm)}
                            {column === 'roas' && (
                              <span className="font-semibold">{metrics.roas.toFixed(2)}x</span>
                            )}
                            {column === 'ctr' && (
                              <div className="relative flex items-center justify-end">
                                <span>{formatPercentage(metrics.ctr)}</span>
                                {(() => {
                                  const delta = calculateCTRDelta(adset.ctr, metrics.ctr);
                                  const isPositive = delta > 0;
                                  return (
                                    <div className="absolute -top-3 -right-9 flex items-center gap-0.5">
                                      <span className="text-xs font-medium">
                                        {isPositive ? '+' : ''}{delta.toFixed(1)}%
                                      </span>
                                      {isPositive ? (
                                        <TrendingUp className="h-2.5 w-2.5 text-green-600" />
                                      ) : (
                                        <TrendingDown className="h-2.5 w-2.5 text-red-600" />
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                            {column === 'clickCv' && formatPercentage(metrics.clickCv)}
                            {column === 'epc' && formatCurrency(metrics.epc)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  )}
                  
                  {/* 7 Days Metrics Row */}
                  {expandedAdset === adset.id && detailMetrics[adset.id]?.sevenDay && (
                    <TableRow>
                      {isSelectionMode && <TableCell className="w-12"></TableCell>}
                      {getVisibleColumns('adsets').map((column) => {
                        const isRightAligned = !['status', 'name'].includes(column);
                        const metrics = detailMetrics[adset.id].sevenDay;
                        
                        return (
                          <TableCell 
                            key={column}
                            className={`${isRightAligned ? 'text-right font-mono text-sm' : ''} ${column === 'cpa' ? getCPAColorClass(metrics.cpa, allCPAs) : ''}`}
                          >
                            {column === 'status' && ''}
                            {column === 'name' && (
                              <span className="font-semibold">7 Dias</span>
                            )}
                            {column === 'dailyBudget' && ''}
                            {column === 'spend' && formatCurrency(metrics.spend)}
                            {column === 'revenue' && (
                              <span className="text-green-600">{formatCurrency(metrics.revenue)}</span>
                            )}
                            {column === 'sales' && (
                              <span className="font-semibold">{metrics.sales}</span>
                            )}
                            {column === 'profit' && (
                              <span className={metrics.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(metrics.profit)}
                              </span>
                            )}
                            {column === 'cpa' && formatCurrency(metrics.cpa)}
                            {column === 'cpm' && formatCurrency(metrics.cpm)}
                            {column === 'roas' && (
                              <span className="font-semibold">{metrics.roas.toFixed(2)}x</span>
                            )}
                            {column === 'ctr' && (
                              <div className="relative flex items-center justify-end">
                                <span>{formatPercentage(metrics.ctr)}</span>
                                {(() => {
                                  const delta = calculateCTRDelta(adset.ctr, metrics.ctr);
                                  const isPositive = delta > 0;
                                  return (
                                    <div className="absolute -top-3 -right-9 flex items-center gap-0.5">
                                      <span className="text-xs font-medium">
                                        {isPositive ? '+' : ''}{delta.toFixed(1)}%
                                      </span>
                                      {isPositive ? (
                                        <TrendingUp className="h-2.5 w-2.5 text-green-600" />
                                      ) : (
                                        <TrendingDown className="h-2.5 w-2.5 text-red-600" />
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                            {column === 'clickCv' && formatPercentage(metrics.clickCv)}
                            {column === 'epc' && formatCurrency(metrics.epc)}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  )}
                  
                  {expandedAdset === adset.id && (
                    <TableRow>
                      <TableCell colSpan={getVisibleColumns('adsets').length + (isSelectionMode ? 1 : 0)} className="p-0">
                        <DetailView 
                          type="adset" 
                          name={adset.name} 
                          id={adset.realId}
                          onMetricsReady={(metrics) => handleMetricsReady(adset.id, metrics)}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              {summaryMetrics && (
                <TableRow className="bg-blue-50 border-t-2 border-blue-200 font-semibold">
                  {getVisibleColumns('adsets').map((column) => {
                    const isRightAligned = !['status', 'name'].includes(column);
                    
                    return (
                      <TableCell 
                        key={column}
                        className={`${isRightAligned ? 'text-right font-mono text-sm text-blue-900' : ''}`}
                      >
                        {column === 'status' && ''}
                        {column === 'name' && (
                          <span className="font-bold text-blue-900">
                            RESUMO ({filteredAdsets.length} conjuntos)
                          </span>
                        )}
                        {column === 'dailyBudget' && formatCurrency(summaryMetrics.dailyBudget)}
                        {column === 'spend' && formatCurrency(summaryMetrics.spend)}
                        {column === 'revenue' && (
                          <span className="text-green-700">{formatCurrency(summaryMetrics.revenue)}</span>
                        )}
                        {column === 'sales' && (
                          <span className="font-semibold">{summaryMetrics.sales}</span>
                        )}
                        {column === 'profit' && (
                          <span className={summaryMetrics.profit > 0 ? 'text-green-700' : 'text-red-700'}>
                            {formatCurrency(summaryMetrics.profit)}
                          </span>
                        )}
                        {column === 'cpa' && (
                          <span className={getCPAColorClass(summaryMetrics.cpa, allCPAs)}>
                            {formatCurrency(summaryMetrics.cpa)}
                          </span>
                        )}
                        {column === 'cpm' && formatCurrency(summaryMetrics.cpm)}
                        {column === 'roas' && (
                          <span className="font-semibold">{summaryMetrics.roas.toFixed(2)}x</span>
                        )}
                        {column === 'ctr' && formatPercentage(summaryMetrics.ctr)}
                        {column === 'clickCv' && formatPercentage(summaryMetrics.clickCv)}
                        {column === 'epc' && formatCurrency(summaryMetrics.epc)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

             {/* Bulk Status Dialog */}
       <Dialog open={showBulkStatusDialog} onOpenChange={setShowBulkStatusDialog}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>Mudar Status em Massa</DialogTitle>
             <DialogDescription>
               Selecione o status para todas as {selectedTargets.length} conjunto(s) selecionado(s).
             </DialogDescription>
           </DialogHeader>
           <div className="grid gap-4 py-4">
             <div className="flex items-center justify-between p-4 border rounded-lg">
               <div className="flex items-center space-x-3">
                 {bulkStatusValue === 'ATIVO' ? (
                   <Power className="h-5 w-5 text-green-600" />
                 ) : (
                   <PowerOff className="h-5 w-5 text-red-600" />
                 )}
                 <div>
                   <div className="font-medium">
                     {bulkStatusValue === 'ATIVO' ? 'Ativar Conjuntos' : 'Desativar Conjuntos'}
                   </div>
                   <div className="text-sm text-muted-foreground">
                     {bulkStatusValue === 'ATIVO' 
                       ? 'Os conjuntos ficarão ativos e começarão a receber orçamento'
                       : 'Os conjuntos serão pausados e não receberão mais orçamento'
                     }
                   </div>
                 </div>
               </div>
               <Switch
                 checked={bulkStatusValue === 'ATIVO'}
                 onCheckedChange={(checked) => setBulkStatusValue(checked ? 'ATIVO' : 'DESATIVADA')}
                 className="data-[state=checked]:bg-green-600"
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowBulkStatusDialog(false)}>
               Cancelar
             </Button>
             <Button onClick={handleBulkStatusChange} disabled={isBulkUpdating}>
               {isBulkUpdating ? 'Atualizando...' : 'Atualizar Status'}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

      {/* Budget Confirmation Dialog */}
      <AlertDialog open={showBudgetConfirmation} onOpenChange={setShowBudgetConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingBudgetChange && (
                <>
                  Você está definindo um valor {(pendingBudgetChange.newBudget / pendingBudgetChange.currentBudget).toFixed(1)}x maior, tem certeza?
                  <br /><br />
                  A mudança vai saltar o orçamento de {formatCurrency(pendingBudgetChange.currentBudget)} para {formatCurrency(pendingBudgetChange.newBudget)}.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleBudgetConfirmationCancel}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBudgetConfirmation}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



      {/* Rule Creation Dialog */}
      <RuleCreationDialog
        isOpen={showRuleCreation}
        onOpenChange={setShowRuleCreation}
        selectedTargets={selectedTargets}
        level="adset"
        onRuleCreated={handleRuleCreated}
      />
    </div>
  );
};

export default AdsetsTab;
