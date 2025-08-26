
import { useMemo, useState, useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Megaphone, ExternalLink, Play, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Target, Plus, Trash2, Power, PowerOff } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { formatCurrency, formatPercentage, getCPAColorClass } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { updateAd, createCampaign, createAdset } from '@/utils/api';
import { useAdsListData } from '@/hooks/useAdsData';
import FilterBar from './FilterBar';
import ColumnOrderDialog from './ColumnOrderDialog';
import { useColumnOrder } from '@/hooks/useColumnOrder';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import DetailView from './DetailView';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/sortable-header';
import RuleCreationDialog from './RuleCreationDialog';
import { useAvailableAccounts } from '@/hooks/useHomeMetrics';

interface AdsTabProps {
  adsetId: string | null;
}

const AdsTab = ({ adsetId }: AdsTabProps) => {
  const [expandedAd, setExpandedAd] = useState<string | null>(null);
  const [detailMetrics, setDetailMetrics] = useState<{ [adId: string]: { threeDay: any; sevenDay: any } }>({});
  
  // Campaign creation states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
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
  
  // Rule creation states
  const [showRuleCreation, setShowRuleCreation] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<Array<{ id: string; name: string; type: 'campaign' | 'adset' | 'ad' }>>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  // Bulk actions states
  const [showBulkStatusDialog, setShowBulkStatusDialog] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState<'ATIVO' | 'DESATIVADO'>('ATIVO');
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

  const { data: ads, isLoading, error, updateOptimistic, clearOptimistic } = useAdsListData(adsetId, settings.dateFilter);
  const { data: availableAccounts, isLoading: accountsLoading } = useAvailableAccounts();

  // Sorting functionality with default sort by CPA descending
  const { sortedData: sortedAds, handleSort, getSortDirection } = useTableSort(ads || [], { column: 'cpa', direction: 'desc' });

  const filteredAds = useMemo(() => {
    if (!sortedAds) return [];

    return sortedAds.filter(ad => {
      const matchesName = ad.name.toLowerCase().includes(settings.nameFilter.toLowerCase());
      const matchesStatus = settings.statusFilter === 'all' || 
        (settings.statusFilter === 'ACTIVE' && ad.statusFinal === 'ATIVO') ||
        (settings.statusFilter === 'PAUSED' && ad.statusFinal === 'DESATIVADO');
      return matchesName && matchesStatus;
    });
  }, [sortedAds, settings.nameFilter, settings.statusFilter]);

  // Coletar todos os CPAs para o color scale (anúncios principais + 3 dias + 7 dias)
  const allCPAs = useMemo(() => {
    const cpas: number[] = [];
    
    // CPAs dos anúncios principais
    filteredAds.forEach(ad => {
      if (ad.cpa > 0) cpas.push(ad.cpa);
    });
    
    // CPAs das métricas de 3 e 7 dias
    Object.values(detailMetrics).forEach(metrics => {
      if (metrics.threeDay?.cpa > 0) cpas.push(metrics.threeDay.cpa);
      if (metrics.sevenDay?.cpa > 0) cpas.push(metrics.sevenDay.cpa);
    });
    
    return cpas;
  }, [filteredAds, detailMetrics]);

  // Cálculo das métricas de resumo
  const summaryMetrics = useMemo(() => {
    if (!filteredAds.length) {
      console.log('No ads data available for the selected period');
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

    const totalSpend = filteredAds.reduce((sum, ad) => sum + ad.spend, 0);
    const totalRevenue = filteredAds.reduce((sum, ad) => sum + ad.revenue, 0);
    const totalSales = filteredAds.reduce((sum, ad) => sum + ad.sales, 0);
    const totalProfit = filteredAds.reduce((sum, ad) => sum + ad.profit, 0);
    const totalClicks = filteredAds.reduce((sum, ad) => sum + ad.clicks, 0);
    const totalImpressions = filteredAds.reduce((sum, ad) => sum + ad.impressions, 0);

    console.log('Ads summary metrics calculated for period:', {
      adsCount: filteredAds.length,
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
  }, [filteredAds]);

  const handleStatusChange = async (ad: any, newStatus: boolean) => {
    // Atualização otimística - mostrar mudança imediatamente
    updateOptimistic(ad.id, { 
      status: newStatus ? 'ACTIVE' : 'PAUSED',
      statusFinal: newStatus ? 'ATIVO' : 'DESATIVADO'
    });
    
    try {
      await updateAd(ad.id, 'status', newStatus ? 'ATIVO' : 'DESATIVADO');
      
      toast({
        title: "Status atualizado",
        description: `Anúncio ${newStatus ? 'ativado' : 'pausado'} com sucesso.`,
      });
    } catch (error) {
      // Reverter a mudança otimística em caso de erro
      clearOptimistic(ad.id);
      
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do anúncio.",
        variant: "destructive",
      });
    }
  };

  // Bulk status change handler
  const handleBulkStatusChange = async () => {
    if (selectedTargets.length === 0) return;
    
    setIsBulkUpdating(true);
    
    try {
      // Get the actual ad objects from the selected targets
      const selectedAds = filteredAds.filter(ad => 
        selectedTargets.some(target => target.id === ad.id)
      );
      
      // Update all selected ads
      const updatePromises = selectedAds.map(ad => 
        updateAd(ad.id, 'status', bulkStatusValue)
      );
      
      await Promise.all(updatePromises);
      
      // Update optimistic for all ads
      selectedAds.forEach(ad => {
        updateOptimistic(ad.id, { 
          status: bulkStatusValue === 'ATIVO' ? 'ACTIVE' : 'PAUSED',
          statusFinal: bulkStatusValue 
        });
      });
      
      toast({
        title: "Status atualizado em massa",
        description: `${selectedAds.length} anúncio(s) ${bulkStatusValue === 'ATIVO' ? 'ativado(s)' : 'pausado(s)'} com sucesso.`,
      });
      
      // Close dialog and reset selection
      setShowBulkStatusDialog(false);
      setSelectedTargets([]);
      setIsSelectionMode(false);
      
    } catch (error) {
      console.error('Error updating bulk ad status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status dos anúncios selecionados.",
        variant: "destructive",
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Rule creation handlers
  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedTargets([]); // Clear selection when exiting selection mode
    }
  };

  const handleTargetToggle = (ad: any, checked: boolean) => {
    if (checked) {
      setSelectedTargets(prev => [...prev, {
        id: ad.id,
        name: ad.name,
        type: 'ad' as const
      }]);
    } else {
      setSelectedTargets(prev => prev.filter(t => t.id !== ad.id));
    }
  };

  const handleSelectAllTargets = (checked: boolean) => {
    if (checked) {
      setSelectedTargets(filteredAds.map(ad => ({
        id: ad.id,
        name: ad.name,
        type: 'ad' as const
      })));
    } else {
      setSelectedTargets([]);
    }
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
        ageMax: '65',
        platforms: [],
        placements: []
      });
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

  const handleRuleCreated = () => {
    setShowRuleCreation(false);
    setSelectedTargets([]);
    setIsSelectionMode(false);
    // Optionally refresh data or show success message
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

  const handleMetricsReady = (adId: string, metrics: { threeDay: any; sevenDay: any }) => {
    setDetailMetrics(prev => ({
      ...prev,
      [adId]: metrics
    }));
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
        <span className="ml-3 text-slate-600">Carregando anúncios...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 mb-2">Erro ao carregar dados dos anúncios</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Anúncios</h2>
          <p className="text-muted-foreground">Visualize o desempenho individual dos anúncios</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={handleToggleSelectionMode}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            {isSelectionMode ? "Sair da Seleção" : "Selecionar Anúncios"}
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
            {filteredAds.length} anúncios
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Campanha
          </Button>
          
          <ColumnOrderDialog
            tableType="ads"
            columnOrder={getVisibleColumns('ads')}
            onColumnOrderChange={(newOrder) => updateColumnOrder('ads', newOrder)}
            onReset={() => resetColumnOrder('ads')}
            getAllColumns={() => getAllColumns('ads')}
            isColumnVisible={(column) => isColumnVisible('ads', column)}
            toggleColumnVisibility={(column) => toggleColumnVisibility('ads', column)}
          />
        </div>

      </div>

      <FilterBar
        activeTab="ads"
        onNameFilter={updateNameFilter}
        onStatusFilter={updateStatusFilter}
        onDateFilter={updateDateFilter}
        nameFilter={settings.nameFilter}
        statusFilter={settings.statusFilter}
        dateFilter={settings.dateFilter}
      />

      {!ads || ads.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-slate-600 mb-2">Nenhum anúncio encontrado</p>
              <p className="text-slate-500 text-sm">Selecione um conjunto com anúncios ativos ou acesse todos os anúncios</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="overflow-x-auto chat-table-container">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b-slate-200">
                  {isSelectionMode && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTargets.length === filteredAds.length && filteredAds.length > 0}
                        onCheckedChange={handleSelectAllTargets}
                        disabled={filteredAds.length === 0}
                      />
                    </TableHead>
                  )}
                {getVisibleColumns('ads').map((column) => {
                  const isRightAligned = !['status', 'name', 'videoLink'].includes(column);
                  const isSortable = !['status', 'name', 'videoLink'].includes(column);
                  const sortDirection = getSortDirection(column);
                  
                  return (
                    <TableHead 
                      key={column}
                      className={`font-semibold min-w-[80px] ${isRightAligned ? 'text-right' : ''} ${column === 'name' ? 'min-w-[200px]' : ''} ${column === 'videoLink' ? 'text-center' : ''}`}
                    >
                      {isSortable ? (
                        <SortableHeader
                          column={column}
                          sortDirection={sortDirection}
                          onSort={handleSort}
                          className={`${isRightAligned ? 'justify-end' : ''} ${column === 'videoLink' ? 'justify-center' : ''}`}
                        >
                          {column === 'status' && 'Status'}
                          {column === 'name' && 'Nome do Anúncio'}
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
                          {column === 'videoLink' && 'Vídeo'}
                        </SortableHeader>
                      ) : (
                        <>
                          {column === 'status' && 'Status'}
                          {column === 'name' && 'Nome do Anúncio'}
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
                          {column === 'videoLink' && 'Vídeo'}
                        </>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAds.map((ad) => (
                <>
                  <TableRow key={ad.id} className="hover:bg-slate-50">
                    {isSelectionMode && (
                      <TableCell className="w-12">
                        <Checkbox
                          checked={selectedTargets.some(t => t.id === ad.id)}
                          onCheckedChange={(checked) => handleTargetToggle(ad, checked as boolean)}
                        />
                      </TableCell>
                    )}
                  {getVisibleColumns('ads').map((column) => {
                    const isRightAligned = !['status', 'name', 'videoLink'].includes(column);
                    
                    return (
                      <TableCell 
                        key={column}
                        className={`${isRightAligned ? 'text-right font-mono text-sm' : ''} ${column === 'name' ? 'font-medium' : ''} ${column === 'videoLink' ? 'text-center' : ''} ${column === 'cpa' ? getCPAColorClass(ad.cpa, allCPAs) : ''}`}
                      >
                        {column === 'status' && (
                          <Switch
                            checked={ad.statusFinal === 'ATIVO'}
                            onCheckedChange={(checked) => handleStatusChange(ad, checked)}
                          />
                        )}
                        {column === 'name' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setExpandedAd(expandedAd === ad.id ? null : ad.id)}
                              className="flex items-center justify-center w-6 h-6 hover:bg-gray-100 rounded transition-colors"
                            >
                              {expandedAd === ad.id ? (
                                <ChevronDown className="h-4 w-4 text-gray-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                              )}
                            </button>
                            <div className="flex items-center space-x-2 flex-1">
                              <Megaphone className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <span className="truncate">{ad.name}</span>
                            </div>
                            <CopyButton text={ad.name} />
                          </div>
                        )}
                        {column === 'spend' && formatCurrency(ad.spend)}
                        {column === 'revenue' && (
                          <span className="text-green-600">{formatCurrency(ad.revenue)}</span>
                        )}
                        {column === 'sales' && (
                          <span className="font-semibold">{ad.sales}</span>
                        )}
                        {column === 'profit' && (
                          <span className={ad.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(ad.profit)}
                          </span>
                        )}
                        {column === 'cpa' && formatCurrency(ad.cpa)}
                        {column === 'cpm' && formatCurrency(ad.cpm)}
                        {column === 'roas' && (
                          <span className="font-semibold">{ad.roas.toFixed(2)}x</span>
                        )}
                        {column === 'ctr' && formatPercentage(ad.ctr)}
                        {column === 'clickCv' && formatPercentage(ad.clickCv)}
                        {column === 'epc' && formatCurrency(ad.epc)}
                        {column === 'videoLink' && (
                          <div className="flex justify-center">
                            {ad.videoLink ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => window.open(ad.videoLink, '_blank')}
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                  </TableRow>
                  
                  {/* 3 Days Metrics Row */}
                  {expandedAd === ad.id && detailMetrics[ad.id]?.threeDay && (
                    <TableRow>
                      {isSelectionMode && <TableCell className="w-12"></TableCell>}
                      {getVisibleColumns('ads').map((column) => {
                        const isRightAligned = !['status', 'name', 'videoLink'].includes(column);
                        const metrics = detailMetrics[ad.id].threeDay;
                        
                        return (
                          <TableCell 
                            key={column}
                            className={`${isRightAligned ? 'text-right font-mono text-sm' : ''} ${column === 'cpa' ? getCPAColorClass(metrics.cpa, allCPAs) : ''}`}
                          >
                            {column === 'status' && ''}
                            {column === 'name' && (
                              <span className="font-semibold">3 Dias</span>
                            )}
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
                                  const delta = calculateCTRDelta(ad.ctr, metrics.ctr);
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
                            {column === 'videoLink' && ''}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  )}
                  
                  {/* 7 Days Metrics Row */}
                  {expandedAd === ad.id && detailMetrics[ad.id]?.sevenDay && (
                    <TableRow>
                      {isSelectionMode && <TableCell className="w-12"></TableCell>}
                      {getVisibleColumns('ads').map((column) => {
                        const isRightAligned = !['status', 'name', 'videoLink'].includes(column);
                        const metrics = detailMetrics[ad.id].sevenDay;
                        
                        return (
                          <TableCell 
                            key={column}
                            className={`${isRightAligned ? 'text-right font-mono text-sm' : ''} ${column === 'cpa' ? getCPAColorClass(metrics.cpa, allCPAs) : ''}`}
                          >
                            {column === 'status' && ''}
                            {column === 'name' && (
                              <span className="font-semibold">7 Dias</span>
                            )}
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
                                  const delta = calculateCTRDelta(ad.ctr, metrics.ctr);
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
                            {column === 'videoLink' && ''}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  )}
                  
                  {expandedAd === ad.id && (
                    <TableRow>
                      <TableCell colSpan={getVisibleColumns('ads').length + (isSelectionMode ? 1 : 0)} className="p-0">
                        <DetailView 
                          type="ad" 
                          name={ad.name} 
                          id={ad.id}
                          onMetricsReady={(metrics) => handleMetricsReady(ad.id, metrics)}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              {summaryMetrics && (
                <TableRow className="bg-blue-50 border-t-2 border-blue-200 font-semibold">
                  {getVisibleColumns('ads').map((column) => {
                    const isRightAligned = !['status', 'name', 'videoLink'].includes(column);
                    
                    return (
                      <TableCell 
                        key={column}
                        className={`${isRightAligned ? 'text-right font-mono text-sm text-blue-900' : ''} ${column === 'videoLink' ? 'text-center' : ''}`}
                      >
                        {column === 'status' && ''}
                        {column === 'name' && (
                          <span className="font-bold text-blue-900">
                            RESUMO ({filteredAds.length} anúncios)
                          </span>
                        )}
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
                        {column === 'videoLink' && ''}
                      </TableCell>
                    );
                  })}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      )}

      <div className="flex items-center justify-center pt-8">
        <div className="text-center text-slate-500">
          <ExternalLink className="h-8 w-8 mx-auto mb-2 text-slate-400" />
          <p className="text-sm">
            Para edições avançadas de anúncios, acesse o{' '}
            <a 
              href="https://business.facebook.com/adsmanager" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Meta Ads Manager
            </a>
          </p>
        </div>
      </div>



      {/* Campaign Creation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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
              {adsets.length > 0 && (
                <div className="space-y-2">
                  {adsets.map((adset) => (
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

              {adsets.length === 0 && (
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

      {/* Rule Creation Dialog */}
      <RuleCreationDialog
        isOpen={showRuleCreation}
        onOpenChange={setShowRuleCreation}
        selectedTargets={selectedTargets}
        level="ad"
        onRuleCreated={handleRuleCreated}
      />

             {/* Bulk Status Dialog */}
       <Dialog open={showBulkStatusDialog} onOpenChange={setShowBulkStatusDialog}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle>Mudar Status em Massa</DialogTitle>
             <DialogDescription>
               Selecione o status para todas as {selectedTargets.length} anúncio(s) selecionado(s).
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
                     {bulkStatusValue === 'ATIVO' ? 'Ativar Anúncios' : 'Desativar Anúncios'}
                   </div>
                   <div className="text-sm text-muted-foreground">
                     {bulkStatusValue === 'ATIVO' 
                       ? 'Os anúncios ficarão ativos e começarão a receber orçamento'
                       : 'Os anúncios serão pausados e não receberão mais orçamento'
                     }
                   </div>
                 </div>
               </div>
               <Switch
                 checked={bulkStatusValue === 'ATIVO'}
                 onCheckedChange={(checked) => setBulkStatusValue(checked ? 'ATIVO' : 'DESATIVADO')}
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
    </div>
  );
};

export default AdsTab;

