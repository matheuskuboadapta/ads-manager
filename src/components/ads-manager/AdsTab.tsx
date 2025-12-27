
import { useMemo, useState, useEffect, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Megaphone, ExternalLink, Play, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Target, Plus, Trash2, Power, PowerOff } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { formatCurrency, formatPercentage, getCPAColorClass } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { updateAd, createCampaign, createAdset } from '@/utils/api';
import { useAdsListData } from '@/hooks/useAdsData';
import FilterBar from './FilterBar';
import ColumnOrderDialog from './ColumnOrderDialog';
import { useColumnOrder } from '@/hooks/useColumnOrder';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { useLoading } from '@/hooks/useLoading';
import DetailView from './DetailView';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/sortable-header';
import RuleCreationDialog from './RuleCreationDialog';
import { useAvailableAccounts } from '@/hooks/useHomeMetrics';
import { useQueryClient } from '@tanstack/react-query';
import { useEditMode } from '@/contexts/EditModeContext';
import { EditModeToggle } from '@/components/ui/edit-mode-toggle';

interface AdsTabProps {
  adsetId: string | null;
  campaignId: string | null;
  accountName: string | null;
}

const AdsTab = ({ adsetId, campaignId, accountName }: AdsTabProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedAd, setExpandedAd] = useState<string | null>(null);
  const [detailMetrics, setDetailMetrics] = useState<{ [adId: string]: { threeDay: any; sevenDay: any } }>({});
  
  // Local state for immediate toggle updates
  const [localStatusUpdates, setLocalStatusUpdates] = useState<Record<string, string>>({});
  
  // Loading states
  const { loading: statusUpdateLoading, withLoading: withStatusUpdateLoading } = useLoading();
  const { loading: bulkUpdateLoading, withLoading: withBulkUpdateLoading } = useLoading();
  

  
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

  const { data: ads, isLoading, error } = useAdsListData(adsetId, campaignId, settings.dateFilter);
  
  // Clear local status updates only when the server data matches the local updates
  useEffect(() => {
    if (ads && ads.length > 0 && Object.keys(localStatusUpdates).length > 0) {
      // Check if any local status updates have been reflected in the server data
      const updatesToKeep: { [adId: string]: string } = {};
      
      Object.entries(localStatusUpdates).forEach(([adId, localStatus]) => {
        const ad = ads.find(a => a.id === adId);
        
        // Only keep the local update if the server hasn't updated yet
        if (ad && ad.statusFinal !== localStatus) {
          updatesToKeep[adId] = localStatus;
        }
      });
      
      // Only update if there are changes
      if (Object.keys(updatesToKeep).length !== Object.keys(localStatusUpdates).length) {
        setLocalStatusUpdates(updatesToKeep);
      }
    }
  }, [ads, localStatusUpdates]);
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

  const handleStatusChange = withStatusUpdateLoading(async (ad: any, newStatus: boolean) => {
    const status = newStatus ? 'ATIVO' : 'DESATIVADO';
    
    console.log('handleStatusChange called:', { adId: ad.id, newStatus, status });
    
    // Immediately update local state for instant UI feedback
    setLocalStatusUpdates(prev => {
      const newState = { ...prev, [ad.id]: status };
      console.log('Updated local status updates:', newState);
      return newState;
    });
    
    console.log('Calling updateAd with:', { adId: ad.id, status, userEmail: user?.email });
    await updateAd(ad.id, 'status', status, user?.email || '');
    console.log('updateAd completed successfully');
    
    // Wait a bit before invalidating to give the database time to update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Invalidate the specific query to force a refresh from the server
    console.log('Invalidating query with key:', ['ads-list-data', adsetId, campaignId, settings.dateFilter]);
    queryClient.invalidateQueries({
      queryKey: ['ads-list-data', adsetId, campaignId, settings.dateFilter]
    });
    
    toast({
      title: "Status atualizado",
      description: `Anúncio ${newStatus ? 'ativado' : 'pausado'} com sucesso.`,
    });
  });

  // Bulk status change handler
  const handleBulkStatusChange = withBulkUpdateLoading(async () => {
    if (selectedTargets.length === 0) return;
    
    // Get the actual ad objects from the selected targets
    const selectedAds = filteredAds.filter(ad => 
      selectedTargets.some(target => target.id === ad.id)
    );
    
    // Immediately update local state for instant UI feedback
    const newLocalUpdates: Record<string, string> = {};
    selectedAds.forEach(ad => {
      newLocalUpdates[ad.id] = bulkStatusValue;
    });
    setLocalStatusUpdates(prev => ({
      ...prev,
      ...newLocalUpdates
    }));
    
    // Update all selected ads
    const updatePromises = selectedAds.map(ad => 
      updateAd(ad.id, 'status', bulkStatusValue, user?.email || '')
    );
    
    await Promise.all(updatePromises);
    
    // Invalidate the specific query to force a refresh from the server
    console.log('Invalidating bulk query with key:', ['ads-list-data', adsetId, campaignId, settings.dateFilter]);
    queryClient.invalidateQueries({
      queryKey: ['ads-list-data', adsetId, campaignId, settings.dateFilter]
    });
    
    toast({
      title: "Status atualizado em massa",
      description: `${selectedAds.length} anúncio(s) ${bulkStatusValue === 'ATIVO' ? 'ativado(s)' : 'pausado(s)'} com sucesso.`,
    });
    
    // Close dialog and reset selection
    setShowBulkStatusDialog(false);
    setSelectedTargets([]);
    setIsSelectionMode(false);
  });

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
          <Badge variant="secondary" className="px-3 py-1">
            {filteredAds.length} anúncios
          </Badge>
          
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={handleToggleSelectionMode}
            disabled={!isEditMode}
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
          
          <ColumnOrderDialog
            tableType="ads"
            columnOrder={getVisibleColumns('ads')}
            onColumnOrderChange={(newOrder) => updateColumnOrder('ads', newOrder)}
            onReset={() => resetColumnOrder('ads')}
            getAllColumns={() => getAllColumns('ads')}
            isColumnVisible={(column) => isColumnVisible('ads', column)}
            toggleColumnVisibility={(column) => toggleColumnVisibility('ads', column)}
          />
          
          <EditModeToggle />
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
                        {column === 'status' && (() => {
                          const localStatus = localStatusUpdates[ad.id];
                          const serverStatus = ad.statusFinal;
                          const isChecked = localStatus ? localStatus === 'ATIVO' : serverStatus === 'ATIVO';
                          const isUpdating = statusUpdateLoading && localStatus !== undefined;
                          console.log('Switch render for ad:', ad.id, { localStatus, serverStatus, isChecked, isUpdating });
                          return (
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={isChecked}
                                onCheckedChange={(checked) => handleStatusChange(ad, checked)}
                                disabled={statusUpdateLoading || !isEditMode}
                              />
                              {isUpdating && (
                                <LoadingSpinner size="sm" />
                              )}
                            </div>
                          );
                        })()}
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
                          campaignName={campaignId}
                          adsetName={adsetId}
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
        accountName={accountName}
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
    </div>
  );
};

export default AdsTab;

