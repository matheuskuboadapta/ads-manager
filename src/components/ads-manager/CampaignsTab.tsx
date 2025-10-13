import { useState, useMemo, useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Target, Edit2, Check, X, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Power, PowerOff, Trash2 } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { formatCurrency, formatPercentage, getCPAColorClass } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { updateCampaign, createCampaign, createAdset } from '@/utils/api';
import { useCampaignsData } from '@/hooks/useAdsData';
import FilterBar from './FilterBar';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ColumnOrderDialog from './ColumnOrderDialog';
import { useColumnOrder } from '@/hooks/useColumnOrder';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { useLoading } from '@/hooks/useLoading';
import DetailView from './DetailView';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/sortable-header';
import RuleCreationDialog from './RuleCreationDialog';
import { useAvailableAccounts } from '@/hooks/useHomeMetrics';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQueryClient } from '@tanstack/react-query';
import { useEditMode } from '@/contexts/EditModeContext';
import { EditModeToggle } from '@/components/ui/edit-mode-toggle';

interface CampaignsTabProps {
  accountId: string | null;
  accountName: string | null;
  onCampaignSelect: (campaignName: string) => void;
}

const CampaignsTab = ({ accountId, accountName, onCampaignSelect }: CampaignsTabProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
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
  const [adsets, setAdsets] = useState<Array<{
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
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [detailMetrics, setDetailMetrics] = useState<{ [campaignId: string]: { threeDay: any; sevenDay: any } }>({});
  const [showBudgetConfirmation, setShowBudgetConfirmation] = useState(false);
  const [pendingBudgetChange, setPendingBudgetChange] = useState<{ campaign: any; newBudget: number; currentBudget: number } | null>(null);
  
  // Rule creation states
  const [showRuleCreation, setShowRuleCreation] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<Array<{ id: string; name: string; type: 'campaign' | 'adset' | 'ad' }>>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Bulk actions states
  const [showBulkStatusDialog, setShowBulkStatusDialog] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState<'ATIVO' | 'DESATIVADA'>('ATIVO');
  const [localStatusUpdates, setLocalStatusUpdates] = useState<{ [campaignId: string]: string }>({});
  
  // Loading states
  const { loading: statusUpdateLoading, withLoading: withStatusUpdateLoading } = useLoading();
  const { loading: bulkUpdateLoading, withLoading: withBulkUpdateLoading } = useLoading();
  
  const { toast } = useToast();
  const { columnOrders, updateColumnOrder, resetColumnOrder, getVisibleColumns, getAllColumns, isColumnVisible, toggleColumnVisibility } = useColumnOrder();
  const { settings, updateDateFilter, updateNameFilter, updateStatusFilter } = useGlobalSettings();
  const { isEditMode } = useEditMode();

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

  const { data: campaigns, isLoading, error, updateOptimistic, clearOptimistic } = useCampaignsData(accountId, settings.dateFilter);
  const { data: availableAccounts, isLoading: accountsLoading } = useAvailableAccounts();

  // Clear local status updates when campaigns data is refreshed
  useEffect(() => {
    if (campaigns && campaigns.length > 0) {
      setLocalStatusUpdates({});
    }
  }, [campaigns]);



  // Sorting functionality with default sort by CPA descending
  const { sortedData: sortedCampaigns, handleSort, getSortDirection } = useTableSort(campaigns || [], { column: 'cpa', direction: 'desc' });

  const filteredCampaigns = useMemo(() => {
    if (!sortedCampaigns) return [];

    return sortedCampaigns.filter(campaign => {
      const matchesName = campaign.name.toLowerCase().includes(settings.nameFilter.toLowerCase());
      const matchesStatus = settings.statusFilter === 'all' || 
        (settings.statusFilter === 'ACTIVE' && campaign.statusFinal === 'ATIVO') ||
        (settings.statusFilter === 'PAUSED' && campaign.statusFinal === 'DESATIVADA');
      return matchesName && matchesStatus;
    });
  }, [sortedCampaigns, settings.nameFilter, settings.statusFilter]);

  // Coletar todos os CPAs para o color scale (campanhas principais + 3 dias + 7 dias)
  const allCPAs = useMemo(() => {
    const cpas: number[] = [];
    
    // CPAs das campanhas principais
    filteredCampaigns.forEach(campaign => {
      if (campaign.cpa > 0) cpas.push(campaign.cpa);
    });
    
    // CPAs das métricas de 3 e 7 dias
    Object.values(detailMetrics).forEach(metrics => {
      if (metrics.threeDay?.cpa > 0) cpas.push(metrics.threeDay.cpa);
      if (metrics.sevenDay?.cpa > 0) cpas.push(metrics.sevenDay.cpa);
    });
    
    return cpas;
  }, [filteredCampaigns, detailMetrics]);

  // Cálculo das métricas de resumo
  const summaryMetrics = useMemo(() => {
    if (!filteredCampaigns.length) {
      console.log('No campaigns data available for the selected period');
      return {
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

    const totalSpend = filteredCampaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
    const totalRevenue = filteredCampaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
    const totalSales = filteredCampaigns.reduce((sum, campaign) => sum + campaign.sales, 0);
    const totalProfit = filteredCampaigns.reduce((sum, campaign) => sum + campaign.profit, 0);
    const totalClicks = filteredCampaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);
    const totalImpressions = filteredCampaigns.reduce((sum, campaign) => sum + campaign.impressions, 0);

    console.log('Campaigns summary metrics calculated for period:', {
      campaignsCount: filteredCampaigns.length,
      totalSpend,
      totalSales,
      totalRevenue,
      totalProfit
    });

    return {
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
  }, [filteredCampaigns]);

  const handleMetricsReady = (campaignId: string, metrics: { threeDay: any; sevenDay: any }) => {
    setDetailMetrics(prev => ({
      ...prev,
      [campaignId]: metrics
    }));
  };

  const handleStatusChange = withStatusUpdateLoading(async (campaign: any, newStatus: boolean) => {
    const status = newStatus ? 'ATIVO' : 'DESATIVADA';
    
    console.log('handleStatusChange called:', { campaignId: campaign.id, newStatus, status });
    
    // Immediately update local state for instant UI feedback
    setLocalStatusUpdates(prev => {
      const newState = { ...prev, [campaign.id]: status };
      console.log('Updated local status updates:', newState);
      return newState;
    });
    
    console.log('Calling updateCampaign with:', { campaignId: campaign.realId, status, userEmail: user?.email });
    await updateCampaign(campaign.realId, 'status', status, user?.email || '');
    console.log('updateCampaign completed successfully');
    
    // Invalidate the specific query to force a refresh from the server
    console.log('Invalidating query with key:', ['ads-data', settings.dateFilter]);
    queryClient.invalidateQueries({
      queryKey: ['ads-data', settings.dateFilter]
    });
    
    toast({
      title: "Status atualizado",
      description: `Campanha "${campaign.name}" ${newStatus ? 'ativada' : 'pausada'} com sucesso.`,
    });
  });

  // Bulk status change handler
  const handleBulkStatusChange = withBulkUpdateLoading(async () => {
    if (selectedTargets.length === 0) return;
    
    // Get the actual campaign objects from the selected targets
    const selectedCampaigns = filteredCampaigns.filter(campaign => 
      selectedTargets.some(target => target.id === (campaign.realId || campaign.id))
    );
    
    // Update all selected campaigns
    const updatePromises = selectedCampaigns.map(campaign => 
      updateCampaign(campaign.realId, 'status', bulkStatusValue, user?.email || '')
    );
    
    await Promise.all(updatePromises);
    
    // Invalidate the specific query to force a refresh from the server
    queryClient.invalidateQueries({
      queryKey: ['ads-data', settings.dateFilter]
    });
    
    toast({
      title: "Status atualizado em massa",
      description: `${selectedCampaigns.length} campanha(s) ${bulkStatusValue === 'ATIVO' ? 'ativada(s)' : 'pausada(s)'} com sucesso.`,
    });
    
    // Close dialog and reset selection
    setShowBulkStatusDialog(false);
    setSelectedTargets([]);
    setIsSelectionMode(false);
  });

  const handleObjectiveChange = async (campaign: any, newObjective: string) => {
    try {
      await updateCampaign(campaign.realId, 'objective', newObjective, user?.email || '');
      
      // Invalidate the specific query to force a refresh from the server
      queryClient.invalidateQueries({
        queryKey: ['ads-data', settings.dateFilter]
      });
      
      toast({
        title: "Objetivo atualizado",
        description: `Objetivo da campanha "${campaign.name}" alterado para ${newObjective}.`,
      });
    } catch (error) {
      console.error('Error updating campaign objective:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o objetivo da campanha.",
        variant: "destructive",
      });
    }
  };

  const handleBudgetEdit = (campaignId: string, currentBudget: number) => {
    setEditingBudget(campaignId);
    setTempBudget(currentBudget.toString());
  };

  const handleBudgetSave = async (campaign: any) => {
    const budget = parseFloat(tempBudget);
    
    if (isNaN(budget) || budget < 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para o orçamento.",
        variant: "destructive",
      });
      return;
    }

    // Check if the new budget is 4x bigger than the current budget
    const currentBudget = campaign.dailyBudget;
    const budgetIncrease = budget / currentBudget;
    
    if (budgetIncrease >= 4) {
      // Show confirmation dialog
      setPendingBudgetChange({ campaign, newBudget: budget, currentBudget });
      setShowBudgetConfirmation(true);
      return;
    }

    // Proceed with the update if no confirmation needed
    await performBudgetUpdate(campaign, budget);
  };

  const performBudgetUpdate = async (campaign: any, budget: number) => {
    try {
      await updateCampaign(campaign.realId, 'budget', budget, user?.email || '');
      
      // Update optimistic
      updateOptimistic(campaign.firstAdId, { dailyBudget: budget });
      
      setEditingBudget(null);
      setTempBudget('');
      
      toast({
        title: "Orçamento atualizado",
        description: `Orçamento da campanha "${campaign.name}" alterado para ${formatCurrency(budget)}.`,
      });
    } catch (error) {
      console.error('Error updating campaign budget:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o orçamento da campanha.",
        variant: "destructive",
      });
      // Revert optimistic update
      clearOptimistic(campaign.firstAdId);
    }
  };

  const handleBudgetConfirmation = async () => {
    if (pendingBudgetChange) {
      await performBudgetUpdate(pendingBudgetChange.campaign, pendingBudgetChange.newBudget);
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

    // Se estamos no primeiro step, ir para o próximo
    if (creationStep === 'campaign') {
      setCreationStep('adsets');
      return;
    }

    // Se estamos no segundo step, criar tudo
    if (adsets.length === 0) {
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
      for (const adset of adsets) {
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
      setAdsets([]);
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
      setCreationStep('campaign');
      setShowCreateDialog(false);
      
      toast({
        title: "Campanha e Conjuntos criados",
        description: `Campanha "${newCampaign.name}" criada com ${adsets.length} conjunto(s) na conta ${newCampaign.account_name}.`,
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

  const handleExpandCampaign = (campaignId: string) => {
    setExpandedCampaign(expandedCampaign === campaignId ? null : campaignId);
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

    if (!newCampaign.budgetEnabled && (!currentAdset.dailyBudget || parseFloat(currentAdset.dailyBudget) <= 0)) {
      toast({
        title: "Orçamento obrigatório",
        description: "Por favor, insira um orçamento válido para o conjunto.",
        variant: "destructive",
      });
      return;
    }

    const newAdset = {
      id: `adset_${Date.now()}`,
      ...currentAdset,
      dailyBudget: newCampaign.budgetEnabled ? '0' : currentAdset.dailyBudget
    };

    setAdsets(prev => [...prev, newAdset]);
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
    setAdsets(prev => prev.filter(adset => adset.id !== adsetId));
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

  const handleBackToCampaign = () => {
    setCreationStep('campaign');
  };

  // Rule creation handlers
  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedTargets([]); // Clear selection when exiting selection mode
    }
  };

  const handleTargetToggle = (campaign: any, checked: boolean) => {
    if (checked) {
      setSelectedTargets(prev => [...prev, {
        id: campaign.realId || campaign.id,
        name: campaign.name,
        type: 'campaign' as const
      }]);
    } else {
      setSelectedTargets(prev => prev.filter(t => t.id !== (campaign.realId || campaign.id)));
    }
  };

  const handleSelectAllTargets = (checked: boolean) => {
    if (checked) {
      setSelectedTargets(filteredCampaigns.map(campaign => ({
        id: campaign.realId || campaign.id,
        name: campaign.name,
        type: 'campaign' as const
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-2">Erro ao carregar campanhas</p>
        <p className="text-muted-foreground text-sm">Tente novamente mais tarde</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Campanhas</h2>
          <p className="text-slate-600">Gerencie suas campanhas de anúncios</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="px-3 py-1">
            {filteredCampaigns.length} campanhas
          </Badge>
          
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={handleToggleSelectionMode}
            disabled={!isEditMode}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            {isSelectionMode ? "Sair da Seleção" : "Selecionar Campanhas"}
          </Button>
          
          {isSelectionMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkStatusDialog(true)}
                className="flex items-center gap-2"
                disabled={selectedTargets.length === 0 || !isEditMode}
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
                disabled={selectedTargets.length === 0 || !isEditMode}
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
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            disabled={!isEditMode}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Campanha
          </Button>
          
          <ColumnOrderDialog
            tableType="campaigns"
            columnOrder={getVisibleColumns('campaigns')}
            onColumnOrderChange={(newOrder) => updateColumnOrder('campaigns', newOrder)}
            onReset={() => resetColumnOrder('campaigns')}
            getAllColumns={() => getAllColumns('campaigns')}
            isColumnVisible={(column) => isColumnVisible('campaigns', column)}
            toggleColumnVisibility={(column) => toggleColumnVisibility('campaigns', column)}
          />
          
          <EditModeToggle />
        </div>

      </div>

      <FilterBar
        activeTab="campaigns"
        dateFilter={settings.dateFilter}
        nameFilter={settings.nameFilter}
        statusFilter={settings.statusFilter}
        onDateFilter={updateDateFilter}
        onNameFilter={updateNameFilter}
        onStatusFilter={updateStatusFilter}
      />

      <div className="border rounded-lg">
        <div className="overflow-x-auto chat-table-container">
          <Table>
            <TableHeader>
              <TableRow>
                {isSelectionMode && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTargets.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                      onCheckedChange={handleSelectAllTargets}
                      disabled={filteredCampaigns.length === 0}
                    />
                  </TableHead>
                )}
                <TableHead className="w-12"></TableHead>
                {getVisibleColumns('campaigns').map((column) => (
                  <TableHead 
                    key={column}
                    className={!['status', 'name', 'dailyBudget'].includes(column) ? 'text-right' : ''}
                  >
                    <SortableHeader
                      column={column}
                      onSort={handleSort}
                      sortDirection={getSortDirection(column)}
                      sortable={!['status', 'name', 'dailyBudget'].includes(column)}
                    >
                      {column === 'status' && 'Status'}
                      {column === 'name' && 'Nome da Campanha'}
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
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <>
                  <TableRow key={campaign.id} className="hover:bg-muted/50">
                    {isSelectionMode && (
                      <TableCell className="w-12">
                        <Checkbox
                          checked={selectedTargets.some(t => t.id === (campaign.realId || campaign.id))}
                          onCheckedChange={(checked) => handleTargetToggle(campaign, checked as boolean)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="w-12">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExpandCampaign(campaign.id)}
                        className="h-6 w-6 p-0"
                      >
                        {expandedCampaign === campaign.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    {getVisibleColumns('campaigns').map((column) => {
                      const isRightAligned = !['status', 'name', 'dailyBudget'].includes(column);
                      
                      return (
                        <TableCell 
                          key={column}
                          className={`${isRightAligned ? 'text-right font-mono text-sm' : ''} ${column === 'cpa' ? getCPAColorClass(campaign.cpa, allCPAs) : ''}`}
                        >
                          {column === 'status' && (() => {
                            const localStatus = localStatusUpdates[campaign.id];
                            const serverStatus = campaign.statusFinal;
                            const isChecked = localStatus ? localStatus === 'ATIVO' : serverStatus === 'ATIVO';
                            const isUpdating = statusUpdateLoading && localStatus !== undefined;
                            return (
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={isChecked}
                                  onCheckedChange={(checked) => handleStatusChange(campaign, checked)}
                                  disabled={statusUpdateLoading || !isEditMode}
                                  className="data-[state=checked]:bg-green-600"
                                />
                                {isUpdating && (
                                  <LoadingSpinner size="sm" />
                                )}
                              </div>
                            );
                          })()}
                          {column === 'name' && (
                            <div className="flex items-center gap-2">
                              <div 
                                className="flex items-center space-x-2 cursor-pointer hover:text-blue-600 transition-colors flex-1"
                                onClick={() => onCampaignSelect(campaign.name)}
                              >
                                <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <span className="underline-offset-4 hover:underline truncate font-medium">{campaign.name}</span>
                              </div>
                              <CopyButton text={campaign.name} />
                            </div>
                          )}
                          {column === 'dailyBudget' && (
                            campaign.isAdsetLevelBudget ? (
                              <div className="text-xs text-yellow-600">
                                Orçamento a nível de conjunto
                              </div>
                            ) : editingBudget === campaign.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={tempBudget}
                                  onChange={(e) => setTempBudget(e.target.value)}
                                  className="w-20 h-8 text-xs"
                                  step="0.01"
                                  min="0"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleBudgetSave(campaign)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleBudgetCancel}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{formatCurrency(campaign.dailyBudget)}</span>
                                {isEditMode && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleBudgetEdit(campaign.id, campaign.dailyBudget)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )
                          )}
                          {column === 'spend' && formatCurrency(campaign.spend)}
                          {column === 'revenue' && (
                            <span className="text-green-600">{formatCurrency(campaign.revenue)}</span>
                          )}
                          {column === 'sales' && (
                            <span className="font-semibold">{campaign.sales}</span>
                          )}
                          {column === 'profit' && (
                            <span className={campaign.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(campaign.profit)}
                            </span>
                          )}
                          {column === 'cpa' && formatCurrency(campaign.cpa)}
                          {column === 'cpm' && formatCurrency(campaign.cpm)}
                          {column === 'roas' && (
                            <span className="font-semibold">{campaign.roas.toFixed(2)}x</span>
                          )}
                          {column === 'ctr' && formatPercentage(campaign.ctr)}
                          {column === 'clickCv' && formatPercentage(campaign.clickCv)}
                          {column === 'epc' && formatCurrency(campaign.epc)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                  
                  {/* 3 Days Metrics Row */}
                  {expandedCampaign === campaign.id && detailMetrics[campaign.id]?.threeDay && (
                    <TableRow>
                      {isSelectionMode && <TableCell className="w-12"></TableCell>}
                      <TableCell className="w-12"></TableCell>
                      {getVisibleColumns('campaigns').map((column) => {
                        const isRightAligned = !['status', 'name', 'dailyBudget'].includes(column);
                        const metrics = detailMetrics[campaign.id].threeDay;
                        
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
                                  const delta = calculateCTRDelta(campaign.ctr, metrics.ctr);
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
                  {expandedCampaign === campaign.id && detailMetrics[campaign.id]?.sevenDay && (
                    <TableRow>
                      {isSelectionMode && <TableCell className="w-12"></TableCell>}
                      <TableCell className="w-12"></TableCell>
                      {getVisibleColumns('campaigns').map((column) => {
                        const isRightAligned = !['status', 'name', 'dailyBudget'].includes(column);
                        const metrics = detailMetrics[campaign.id].sevenDay;
                        
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
                                  const delta = calculateCTRDelta(campaign.ctr, metrics.ctr);
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
                  
                  {expandedCampaign === campaign.id && (
                    <TableRow>
                      <TableCell colSpan={getVisibleColumns('campaigns').length + (isSelectionMode ? 2 : 1)} className="p-0">
                        <DetailView 
                          type="campaign" 
                          name={campaign.name} 
                          id={campaign.realId}
                          onMetricsReady={(metrics) => handleMetricsReady(campaign.id, metrics)}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              {summaryMetrics && (
                <TableRow className="bg-blue-50 border-t-2 border-blue-200 font-semibold">
                  {isSelectionMode && <TableCell className="w-12"></TableCell>}
                  <TableCell className="w-12"></TableCell>
                  {getVisibleColumns('campaigns').map((column) => {
                    const isRightAligned = !['status', 'name', 'dailyBudget'].includes(column);
                    
                    return (
                      <TableCell 
                        key={column}
                        className={`${isRightAligned ? 'text-right font-mono text-sm text-blue-900' : ''}`}
                      >
                        {column === 'status' && ''}
                        {column === 'name' && (
                          <span className="font-bold text-blue-900">
                            RESUMO ({filteredCampaigns.length} campanhas)
                          </span>
                        )}
                        {column === 'dailyBudget' && ''}
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

             {/* Bulk Status Dialog */}
       <Dialog open={showBulkStatusDialog} onOpenChange={setShowBulkStatusDialog}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>Mudar Status em Massa</DialogTitle>
             <DialogDescription>
               Selecione o status para todas as {selectedTargets.length} campanha(s) selecionada(s).
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
                     {bulkStatusValue === 'ATIVO' ? 'Ativar Campanhas' : 'Desativar Campanhas'}
                   </div>
                   <div className="text-sm text-muted-foreground">
                     {bulkStatusValue === 'ATIVO' 
                       ? 'As campanhas ficarão ativas e começarão a receber orçamento'
                       : 'As campanhas serão pausadas e não receberão mais orçamento'
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
                             <LoadingButton 
                  onClick={handleBulkStatusChange} 
                  loading={bulkUpdateLoading}
                  loadingText="Atualizando..."
                >
                  Atualizar Status
                </LoadingButton>
           </DialogFooter>
         </DialogContent>
       </Dialog>


      {/* Campaign Creation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {creationStep === 'campaign' ? 'Criar Nova Campanha' : 'Adicionar Conjuntos'}
            </DialogTitle>
          </DialogHeader>
          
          {creationStep === 'campaign' ? (
            // Step 1: Campaign Information
            <div className="space-y-6">
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
            </div>
          ) : (
            // Step 2: Adsets Section
            <div className="space-y-6">
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
                {adsets.length > 0 && (
                  <div className="space-y-2">
                    {adsets.map((adset) => (
                      <div key={adset.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                        <div className="flex-1">
                          <div className="font-medium">{adset.name}</div>
                          <div className="text-sm text-slate-600">
                            {!newCampaign.budgetEnabled && `Orçamento: R$ ${adset.dailyBudget} | `}
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

                {adsets.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <p>Nenhum conjunto adicionado ainda</p>
                    <p className="text-sm">Clique em "Adicionar Conjunto" para começar</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-between space-x-2 pt-4">
            <div className="flex space-x-2">
              {creationStep === 'adsets' && (
                <Button variant="outline" onClick={handleBackToCampaign}>
                  Voltar
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCampaign}>
                {creationStep === 'campaign' ? 'Próximo' : 'Criar Conjuntos'}
              </Button>
            </div>
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

            {!newCampaign.budgetEnabled && (
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
            )}

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

      {/* Rule Creation Dialog */}
      <RuleCreationDialog
        isOpen={showRuleCreation}
        onOpenChange={setShowRuleCreation}
        selectedTargets={selectedTargets}
        level="campaign"
        accountName={accountName}
        onRuleCreated={handleRuleCreated}
      />
    </div>
  );
};

export default CampaignsTab;

