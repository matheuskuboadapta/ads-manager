import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Target, Edit2, Check, X, ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { formatCurrency, formatPercentage, getCPAColorClass } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { updateCampaign, createCampaign } from '@/utils/api';
import { useCampaignsData } from '@/hooks/useAdsData';
import FilterBar from './FilterBar';
import { Button } from '@/components/ui/button';
import ColumnOrderDialog from './ColumnOrderDialog';
import { useColumnOrder } from '@/hooks/useColumnOrder';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import DetailView from './DetailView';
import { useTableSort } from '@/hooks/useTableSort';
import { SortableHeader } from '@/components/ui/sortable-header';

interface CampaignsTabProps {
  accountId: string | null;
  onCampaignSelect: (campaignName: string) => void;
}

const CampaignsTab = ({ accountId, onCampaignSelect }: CampaignsTabProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [tempBudget, setTempBudget] = useState<string>('');
  const [newCampaign, setNewCampaign] = useState({ name: '', objective: 'CONVERSIONS' });
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [detailMetrics, setDetailMetrics] = useState<{ [campaignId: string]: { threeDay: any; sevenDay: any } }>({});
  const [showBudgetConfirmation, setShowBudgetConfirmation] = useState(false);
  const [pendingBudgetChange, setPendingBudgetChange] = useState<{ campaign: any; newBudget: number; currentBudget: number } | null>(null);
  const { toast } = useToast();
  const { columnOrders, updateColumnOrder, resetColumnOrder, getVisibleColumns, getAllColumns, isColumnVisible, toggleColumnVisibility } = useColumnOrder();
  const { settings, updateDateFilter, updateNameFilter, updateStatusFilter } = useGlobalSettings();

  const { data: campaigns, isLoading, error, updateOptimistic, clearOptimistic } = useCampaignsData(accountId, settings.dateFilter);

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

  const handleStatusChange = async (campaign: any, newStatus: boolean) => {
    const status = newStatus ? 'ATIVO' : 'DESATIVADA';
    
    try {
      await updateCampaign(campaign.realId, 'status', status);
      
      // Update optimistic
      updateOptimistic(campaign.firstAdId, { statusFinal: status });
      
      toast({
        title: "Status atualizado",
        description: `Campanha "${campaign.name}" ${newStatus ? 'ativada' : 'pausada'} com sucesso.`,
      });
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da campanha.",
        variant: "destructive",
      });
      // Revert optimistic update
      clearOptimistic(campaign.firstAdId);
    }
  };

  const handleObjectiveChange = async (campaign: any, newObjective: string) => {
    try {
      await updateCampaign(campaign.realId, 'objective', newObjective);
      
      // Update optimistic
      updateOptimistic(campaign.firstAdId, { objective: newObjective });
      
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
      // Revert optimistic update
      clearOptimistic(campaign.firstAdId);
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
      await updateCampaign(campaign.realId, 'budget', budget);
      
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

    try {
      await createCampaign({
        name: newCampaign.name,
        objective: newCampaign.objective,
        level: 'campaign',
      });
      
      setNewCampaign({ name: '', objective: 'CONVERSIONS' });
      setShowCreateDialog(false);
      
      toast({
        title: "Campanha criada",
        description: `Campanha "${newCampaign.name}" criada com sucesso.`,
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a campanha.",
        variant: "destructive",
      });
    }
  };

  const handleExpandCampaign = (campaignId: string) => {
    setExpandedCampaign(expandedCampaign === campaignId ? null : campaignId);
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
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Campanhas</h2>
          <Badge variant="secondary">{filteredCampaigns.length} campanhas</Badge>
        </div>
        
        <div className="flex items-center gap-2">
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
            tableType="campaigns"
            columnOrders={columnOrders}
            updateColumnOrder={updateColumnOrder}
            resetColumnOrder={resetColumnOrder}
            getVisibleColumns={getVisibleColumns}
            getAllColumns={getAllColumns}
            isColumnVisible={isColumnVisible}
            toggleColumnVisibility={toggleColumnVisibility}
          />
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
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
                          {column === 'status' && (
                            <Switch
                              checked={campaign.statusFinal === 'ATIVO'}
                              onCheckedChange={(checked) => handleStatusChange(campaign, checked)}
                              className="data-[state=checked]:bg-green-600"
                            />
                          )}
                          {column === 'name' && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{campaign.name}</span>
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
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleBudgetEdit(campaign.id, campaign.dailyBudget)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
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
                      <TableCell colSpan={getVisibleColumns('campaigns').length + 1} className="p-0">
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
    </div>
  );
};

export default CampaignsTab;
