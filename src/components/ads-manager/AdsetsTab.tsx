import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Plus, BarChart3, Edit2, Check, X, ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { formatCurrency, formatPercentage, getCPAColorClass } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { updateAdset, createAdset } from '@/utils/api';
import { useAdsetsData } from '@/hooks/useAdsData';
import FilterBar from './FilterBar';
import ColumnOrderDialog from './ColumnOrderDialog';
import { useColumnOrder } from '@/hooks/useColumnOrder';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import DetailView from './DetailView';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/sortable-header';

interface AdsetsTabProps {
  campaignId: string | null;
  onAdsetSelect: (adsetId: string) => void;
}

const AdsetsTab = ({ campaignId, onAdsetSelect }: AdsetsTabProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [tempBudget, setTempBudget] = useState<string>('');
  const [newAdset, setNewAdset] = useState({ name: '', dailyBudget: '' });
  const [expandedAdset, setExpandedAdset] = useState<string | null>(null);
  const [detailMetrics, setDetailMetrics] = useState<{ [adsetId: string]: { threeDay: any; sevenDay: any } }>({});
  const [showBudgetConfirmation, setShowBudgetConfirmation] = useState(false);
  const [pendingBudgetChange, setPendingBudgetChange] = useState<{ adset: any; newBudget: number; currentBudget: number } | null>(null);
  const { toast } = useToast();
  const { columnOrders, updateColumnOrder, resetColumnOrder, getVisibleColumns, getAllColumns, isColumnVisible, toggleColumnVisibility } = useColumnOrder();
  const { settings, updateDateFilter, updateNameFilter, updateStatusFilter } = useGlobalSettings();

  const { data: adsets, isLoading, error, updateOptimistic, clearOptimistic } = useAdsetsData(campaignId, settings.dateFilter);

  // Sorting functionality with default sort by CPA descending
  const { sortedData: sortedAdsets, handleSort, getSortDirection } = useTableSort(adsets || [], { column: 'cpa', direction: 'desc' });

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

  const handleCreateAdset = async () => {
    if (!newAdset.name.trim() || !newAdset.dailyBudget) {
      toast({
        title: "Erro",
        description: "Nome e orçamento diário são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const budget = parseFloat(newAdset.dailyBudget);
    if (isNaN(budget) || budget <= 0) {
      toast({
        title: "Erro",
        description: "Valor de orçamento inválido.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createAdset({
        name: newAdset.name,
        campaign_id: campaignId!,
        daily_budget: budget,
        level: 'adset'
      });

      toast({
        title: "Conjunto criado",
        description: "Novo conjunto de anúncios criado com sucesso.",
      });

      setShowCreateDialog(false);
      setNewAdset({ name: '', dailyBudget: '' });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar conjunto de anúncios.",
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

  if (!adsets || adsets.length === 0) {
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
                <span>Novo Conjunto</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Conjunto de Anúncios</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="adset-name">Nome do Conjunto</Label>
                  <Input
                    id="adset-name"
                    value={newAdset.name}
                    onChange={(e) => setNewAdset(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Lookalike 2% - Compradoras"
                  />
                </div>
                <div>
                  <Label htmlFor="adset-budget">Orçamento Diário (R$)</Label>
                  <Input
                    id="adset-budget"
                    type="number"
                    value={newAdset.dailyBudget}
                    onChange={(e) => setNewAdset(prev => ({ ...prev, dailyBudget: e.target.value }))}
                    placeholder="150.00"
                    min="1"
                    step="0.01"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateAdset}>
                    Criar Conjunto
                  </Button>
                </div>
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
                      <TableCell colSpan={getVisibleColumns('adsets').length} className="p-0">
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
    </div>
  );
};

export default AdsetsTab;
