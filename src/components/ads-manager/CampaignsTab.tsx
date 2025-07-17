
import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Target } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { updateCampaign, createCampaign } from '@/utils/api';
import { useCampaignsData } from '@/hooks/useAdsData';
import FilterBar from './FilterBar';
import { Button } from '@/components/ui/button';
import ColumnOrderDialog from './ColumnOrderDialog';
import { useColumnOrder } from '@/hooks/useColumnOrder';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';

interface CampaignsTabProps {
  accountId: string | null;
  onCampaignSelect: (campaignName: string) => void;
}

const CampaignsTab = ({ accountId, onCampaignSelect }: CampaignsTabProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', objective: 'CONVERSIONS' });
  const { toast } = useToast();
  const { columnOrders, updateColumnOrder, resetColumnOrder } = useColumnOrder();
  const { settings, updateDateFilter, updateNameFilter, updateStatusFilter } = useGlobalSettings();

  const { data: campaigns, isLoading, error, updateOptimistic, clearOptimistic } = useCampaignsData(accountId, settings.dateFilter);

  const filteredCampaigns = useMemo(() => {
    if (!campaigns) return [];

    return campaigns.filter(campaign => {
      const matchesName = campaign.name.toLowerCase().includes(settings.nameFilter.toLowerCase());
      const matchesStatus = settings.statusFilter === 'all' || 
        (settings.statusFilter === 'ACTIVE' && campaign.statusFinal === 'ATIVO') ||
        (settings.statusFilter === 'PAUSED' && campaign.statusFinal === 'DESATIVADA');
      return matchesName && matchesStatus;
    });
  }, [campaigns, settings.nameFilter, settings.statusFilter]);

  // Cálculo das métricas de resumo
  const summaryMetrics = useMemo(() => {
    if (!filteredCampaigns.length) return null;

    const totalSpend = filteredCampaigns.reduce((sum, campaign) => sum + campaign.spend, 0);
    const totalRevenue = filteredCampaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
    const totalSales = filteredCampaigns.reduce((sum, campaign) => sum + campaign.sales, 0);
    const totalProfit = filteredCampaigns.reduce((sum, campaign) => sum + campaign.profit, 0);
    const totalClicks = filteredCampaigns.reduce((sum, campaign) => sum + campaign.clicks, 0);
    const totalImpressions = filteredCampaigns.reduce((sum, campaign) => sum + campaign.impressions, 0);

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

  const handleStatusChange = async (campaign: any, newStatus: boolean) => {
    // Atualização otimística - mostrar mudança imediatamente
    updateOptimistic(campaign.firstAdId, { 
      status: newStatus ? 'ACTIVE' : 'PAUSED',
      statusFinal: newStatus ? 'ATIVO' : 'DESATIVADA'
    });
    
    try {
      // Use firstAdId instead of realId to send the ad_id
      await updateCampaign(campaign.firstAdId, 'status', newStatus ? 'ATIVO' : 'DESATIVADA');
      
      toast({
        title: "Status atualizado",
        description: `Campanha ${newStatus ? 'ativada' : 'pausada'} com sucesso.`,
      });
    } catch (error) {
      // Reverter a mudança otimística em caso de erro
      clearOptimistic(campaign.firstAdId);
      
      toast({
        title: "Erro",
        description: "Falha ao atualizar status da campanha.",
        variant: "destructive",
      });
    }
  };

  const handleObjectiveChange = async (campaign: any, newObjective: string) => {
    // Atualização otimística - mostrar mudança imediatamente
    updateOptimistic(campaign.firstAdId, { objective: newObjective });
    
    try {
      // Use firstAdId instead of realId to send the ad_id
      await updateCampaign(campaign.firstAdId, 'objective', newObjective);
      
      toast({
        title: "Objetivo atualizado",
        description: "Objetivo da campanha alterado com sucesso.",
      });
    } catch (error) {
      // Reverter a mudança otimística em caso de erro
      clearOptimistic(campaign.firstAdId);
      
      toast({
        title: "Erro",
        description: "Falha ao atualizar objetivo da campanha.",
        variant: "destructive",
      });
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da campanha é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createCampaign({
        name: newCampaign.name,
        objective: newCampaign.objective,
        level: 'campaign'
      });

      toast({
        title: "Campanha criada",
        description: "Nova campanha criada com sucesso.",
      });

      setShowCreateDialog(false);
      setNewCampaign({ name: '', objective: 'CONVERSIONS' });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar campanha.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600">Carregando campanhas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 mb-2">Erro ao carregar dados das campanhas</p>
          <p className="text-slate-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-slate-600 mb-2">Nenhuma campanha encontrada</p>
          <p className="text-slate-500 text-sm">Selecione uma conta com campanhas ativas ou acesse todas as campanhas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Campanhas</h2>
          <p className="text-slate-600">Gerencie suas campanhas publicitárias</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="px-3 py-1">
            {filteredCampaigns.length} campanhas
          </Badge>
          <ColumnOrderDialog
            columnOrder={columnOrders.campaigns}
            onColumnOrderChange={(newOrder) => updateColumnOrder('campaigns', newOrder)}
            onReset={() => resetColumnOrder('campaigns')}
          />
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Nova Campanha</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Campanha</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Nome da Campanha</Label>
                  <Input
                    id="campaign-name"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Black Friday 2024 - Produtos"
                  />
                </div>
                <div>
                  <Label htmlFor="campaign-objective">Objetivo</Label>
                  <Select
                    value={newCampaign.objective}
                    onValueChange={(value) => setNewCampaign(prev => ({ ...prev, objective: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONVERSIONS">Conversões</SelectItem>
                      <SelectItem value="REACH">Alcance</SelectItem>
                      <SelectItem value="TRAFFIC">Tráfego</SelectItem>
                      <SelectItem value="AWARENESS">Reconhecimento da Marca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateCampaign}>
                    Criar Campanha
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <FilterBar
        activeTab="campaigns"
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
                {columnOrders.campaigns.map((column) => {
                  const isRightAligned = !['status', 'name'].includes(column);
                  return (
                    <TableHead 
                      key={column}
                      className={`font-semibold min-w-[80px] ${isRightAligned ? 'text-right' : ''} ${column === 'name' ? 'min-w-[200px]' : ''}`}
                    >
                      {column === 'status' && 'Status'}
                      {column === 'name' && 'Nome da Campanha'}
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
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id} className="hover:bg-slate-50">
                  {columnOrders.campaigns.map((column) => {
                    const isRightAligned = !['status', 'name'].includes(column);
                    
                    return (
                      <TableCell 
                        key={column}
                        className={`${isRightAligned ? 'text-right font-mono text-sm' : ''} ${column === 'name' ? 'font-medium' : ''}`}
                      >
                        {column === 'status' && (
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={campaign.statusFinal === 'ATIVO'}
                              onCheckedChange={(checked) => handleStatusChange(campaign, checked)}
                            />
                            {!campaign.isAdsetLevelBudget && (
                              <div className="text-xs text-muted-foreground">
                                Orçamento: {formatCurrency(campaign.dailyBudget)}/dia
                              </div>
                            )}
                            {campaign.isAdsetLevelBudget && (
                              <div className="text-xs text-yellow-600">
                                Orçamento a nível de conjunto
                              </div>
                            )}
                          </div>
                        )}
                        {column === 'name' && (
                          <div className="flex items-center space-x-2">
                            <div 
                              className="flex items-center space-x-2 cursor-pointer hover:text-blue-600 transition-colors flex-1"
                              onClick={() => {
                                console.log('Clicking on campaign:', campaign.name);
                                onCampaignSelect(campaign.name);
                              }}
                            >
                              <Target className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              <span className="underline-offset-4 hover:underline truncate">{campaign.name}</span>
                            </div>
                            <CopyButton text={campaign.name} />
                          </div>
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
              ))}
              {summaryMetrics && (
                <TableRow className="bg-blue-50 border-t-2 border-blue-200 font-semibold">
                  {columnOrders.campaigns.map((column) => {
                    const isRightAligned = !['status', 'name'].includes(column);
                    
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
                        {column === 'cpa' && formatCurrency(summaryMetrics.cpa)}
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
    </div>
  );
};

export default CampaignsTab;
