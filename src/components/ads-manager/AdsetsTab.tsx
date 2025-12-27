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
import { formatCurrency, formatCurrencyNoDecimals, formatPercentage, getCPAColorClass } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';
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
import { useEditMode } from '@/contexts/EditModeContext';
import { EditModeToggle } from '@/components/ui/edit-mode-toggle';

interface AdsetsTabProps {
  campaignId: string | null;
  accountName: string | null;
  onAdsetSelect: (adsetName: string) => void;
}

const AdsetsTab = ({ campaignId, accountName, onAdsetSelect }: AdsetsTabProps) => {
  const { user } = useAuth();
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [tempBudget, setTempBudget] = useState<string>('');
  
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
    const status = newStatus ? 'ATIVO' : 'DESATIVADA';
    
    try {
      // Use realId to send the correct adset_id
      await updateAdset(adset.realId, 'status', newStatus ? 'ACTIVE' : 'PAUSED', user?.email || '');
      
      // Update optimistic only after successful response
      updateOptimistic(adset.firstAdId, { statusFinal: status });
    } catch (error) {
      console.error('Error updating adset status:', error);
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
        updateAdset(adset.realId, 'status', bulkStatusValue === 'ATIVO' ? 'ACTIVE' : 'PAUSED', user?.email || '')
      );
      
      await Promise.all(updatePromises);
      
      // Update optimistic for all adsets only after successful response
      selectedAdsets.forEach(adset => {
        updateOptimistic(adset.firstAdId, { statusFinal: bulkStatusValue });
      });
      
      // Close dialog and reset selection
      setShowBulkStatusDialog(false);
      setSelectedTargets([]);
      setIsSelectionMode(false);
      
    } catch (error) {
      console.error('Error updating bulk adset status:', error);
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
    try {
      // Use realId to send the correct adset_id
      await updateAdset(adset.realId, 'budget', newBudget, user?.email || '');
      
      // Update optimistic only after successful response
      updateOptimistic(adset.firstAdId, { dailyBudget: newBudget });
      
      setEditingBudget(null);
    } catch (error) {
      console.error('Error updating adset budget:', error);
      setEditingBudget(null);
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



  const handleMetricsReady = (adsetId: string, metrics: { threeDay: any; sevenDay: any }) => {
    setDetailMetrics(prev => ({
      ...prev,
      [adsetId]: metrics
    }));
  };

  // Adset management functions
  const handleAddAdset = () => {
    if (!currentAdset.name.trim()) {
      return;
    }

    if (!currentAdset.dailyBudget || parseFloat(currentAdset.dailyBudget) <= 0) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Conjuntos de Anúncios</h2>
          <p className="text-slate-600">Configure orçamentos e públicos-alvo</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="px-3 py-1">
            {filteredAdsets.length} conjuntos
          </Badge>
          
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={handleToggleSelectionMode}
            disabled={!isEditMode}
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
            tableType="adsets"
            columnOrder={getVisibleColumns('adsets')}
            onColumnOrderChange={(newOrder) => updateColumnOrder('adsets', newOrder)}
            onReset={() => resetColumnOrder('adsets')}
            getAllColumns={() => getAllColumns('adsets')}
            isColumnVisible={(column) => isColumnVisible('adsets', column)}
            toggleColumnVisibility={(column) => toggleColumnVisibility('adsets', column)}
          />
          
          <EditModeToggle />
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

      {!filteredAdsets || filteredAdsets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-slate-600 mb-2">Nenhum conjunto encontrado</p>
              <p className="text-slate-500 text-sm">Selecione uma campanha com conjuntos ativos ou acesse todos os conjuntos</p>
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
                            disabled={!isEditMode}
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
                                  {isEditMode && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleBudgetEdit(adset.id, adset.dailyBudget)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                  )}
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
                        {column === 'cpm' && formatCurrencyNoDecimals(adset.cpm)}
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
                            {column === 'cpm' && formatCurrencyNoDecimals(metrics.cpm)}
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
                            {column === 'cpm' && formatCurrencyNoDecimals(metrics.cpm)}
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
                          campaignName={campaignId}
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
                        {column === 'cpm' && formatCurrencyNoDecimals(summaryMetrics.cpm)}
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
      )}

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
               Atualizar Status
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
        accountName={accountName}
      />
    </div>
  );
};

export default AdsetsTab;
