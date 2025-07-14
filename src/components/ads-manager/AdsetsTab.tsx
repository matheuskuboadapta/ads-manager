import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, BarChart3, Edit2, Check, X } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { updateAdset, createAdset } from '@/utils/api';
import { useAdsetsData } from '@/hooks/useAdsData';
import FilterBar from './FilterBar';
import ColumnOrderDialog from './ColumnOrderDialog';
import { useColumnOrder } from '@/hooks/useColumnOrder';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';

interface AdsetsTabProps {
  campaignId: string | null;
  onAdsetSelect: (adsetId: string) => void;
}

const AdsetsTab = ({ campaignId, onAdsetSelect }: AdsetsTabProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [tempBudget, setTempBudget] = useState<string>('');
  const [newAdset, setNewAdset] = useState({ name: '', dailyBudget: '' });
  const { toast } = useToast();
  const { columnOrders, updateColumnOrder, resetColumnOrder } = useColumnOrder();
  const { settings, updateDateFilter, updateNameFilter, updateStatusFilter } = useGlobalSettings();

  const { data: adsets, isLoading, error } = useAdsetsData(campaignId, settings.dateFilter);

  const filteredAdsets = useMemo(() => {
    if (!adsets) return [];

    return adsets.filter(adset => {
      const matchesName = adset.name.toLowerCase().includes(settings.nameFilter.toLowerCase());
      const matchesStatus = settings.statusFilter === 'all' || adset.status === settings.statusFilter;
      return matchesName && matchesStatus;
    });
  }, [adsets, settings.nameFilter, settings.statusFilter]);

  // Cálculo das métricas de resumo
  const summaryMetrics = useMemo(() => {
    if (!filteredAdsets.length) return null;

    const totalSpend = filteredAdsets.reduce((sum, adset) => sum + adset.spend, 0);
    const totalRevenue = filteredAdsets.reduce((sum, adset) => sum + adset.revenue, 0);
    const totalSales = filteredAdsets.reduce((sum, adset) => sum + adset.sales, 0);
    const totalProfit = filteredAdsets.reduce((sum, adset) => sum + adset.profit, 0);
    const totalClicks = filteredAdsets.reduce((sum, adset) => sum + adset.clicks, 0);
    const totalImpressions = filteredAdsets.reduce((sum, adset) => sum + adset.impressions, 0);
    const totalDailyBudget = filteredAdsets.reduce((sum, adset) => sum + adset.dailyBudget, 0);

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
    try {
      // Use firstAdId instead of realId to send the ad_id
      await updateAdset(adset.firstAdId, 'status', newStatus ? 'ACTIVE' : 'PAUSED');
      
      toast({
        title: "Status atualizado",
        description: `Conjunto ${newStatus ? 'ativado' : 'pausado'} com sucesso.`,
      });
    } catch (error) {
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

    try {
      // Use firstAdId instead of realId to send the ad_id
      await updateAdset(adset.firstAdId, 'budget', newBudget);
      
      setEditingBudget(null);
      toast({
        title: "Orçamento atualizado",
        description: "Orçamento diário alterado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar orçamento.",
        variant: "destructive",
      });
    }
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
          <h2 className="text-2xl font-bold text-slate-900">Conjuntos de Anúncios</h2>
          <p className="text-slate-600">Configure orçamentos e públicos-alvo</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="px-3 py-1">
            {filteredAdsets.length} conjuntos
          </Badge>
          <ColumnOrderDialog
            columnOrder={columnOrders.adsets}
            onColumnOrderChange={(newOrder) => updateColumnOrder('adsets', newOrder)}
            onReset={() => resetColumnOrder('adsets')}
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                {columnOrders.adsets.map((column) => {
                  const isRightAligned = !['status', 'name'].includes(column);
                  return (
                    <TableHead 
                      key={column}
                      className={`font-semibold min-w-[80px] ${isRightAligned ? 'text-right' : ''} ${column === 'name' ? 'min-w-[200px]' : ''} ${column === 'dailyBudget' ? 'min-w-[130px]' : ''}`}
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
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdsets.map((adset) => (
                <TableRow key={adset.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Switch
                      checked={adset.status === 'ACTIVE'}
                      onCheckedChange={(checked) => handleStatusChange(adset, checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="flex items-center space-x-2 cursor-pointer hover:text-blue-600 transition-colors flex-1"
                        onClick={() => onAdsetSelect(adset.name)}
                      >
                        <BarChart3 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="underline-offset-4 hover:underline truncate">{adset.name}</span>
                      </div>
                      <CopyButton text={adset.name} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingBudget === adset.id ? (
                      <div className="flex items-center justify-end space-x-1">
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
                      <div className="flex items-center justify-end space-x-1">
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
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(adset.spend)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600 text-sm">
                    {formatCurrency(adset.revenue)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm">
                    {adset.sales}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    <span className={adset.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(adset.profit)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(adset.cpa)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(adset.cpm)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-sm">
                    {adset.roas.toFixed(2)}x
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatPercentage(adset.ctr)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatPercentage(adset.clickCv)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(adset.epc)}
                  </TableCell>
                </TableRow>
              ))}
              {summaryMetrics && (
                <TableRow className="bg-blue-50 border-t-2 border-blue-200 font-semibold">
                  <TableCell></TableCell>
                  <TableCell className="font-bold text-blue-900">
                    RESUMO ({filteredAdsets.length} conjuntos)
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-blue-900">
                    {formatCurrency(summaryMetrics.dailyBudget)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-blue-900">
                    {formatCurrency(summaryMetrics.spend)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-700 text-sm">
                    {formatCurrency(summaryMetrics.revenue)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm text-blue-900">
                    {summaryMetrics.sales}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    <span className={summaryMetrics.profit > 0 ? 'text-green-700' : 'text-red-700'}>
                      {formatCurrency(summaryMetrics.profit)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-blue-900">
                    {formatCurrency(summaryMetrics.cpa)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-blue-900">
                    {formatCurrency(summaryMetrics.cpm)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-sm text-blue-900">
                    {summaryMetrics.roas.toFixed(2)}x
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-blue-900">
                    {formatPercentage(summaryMetrics.ctr)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-blue-900">
                    {formatPercentage(summaryMetrics.clickCv)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-blue-900">
                    {formatCurrency(summaryMetrics.epc)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdsetsTab;
