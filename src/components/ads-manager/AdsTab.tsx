
import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Megaphone, ExternalLink, Play, ChevronDown, ChevronRight } from 'lucide-react';
import { CopyButton } from '@/components/ui/copy-button';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { updateAd } from '@/utils/api';
import { useAdsListData } from '@/hooks/useAdsData';
import FilterBar from './FilterBar';
import ColumnOrderDialog from './ColumnOrderDialog';
import { useColumnOrder } from '@/hooks/useColumnOrder';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import DetailView from './DetailView';

interface AdsTabProps {
  adsetId: string | null;
}

const AdsTab = ({ adsetId }: AdsTabProps) => {
  const [expandedAd, setExpandedAd] = useState<string | null>(null);
  const { toast } = useToast();
  const { columnOrders, updateColumnOrder, resetColumnOrder, getVisibleColumns, getAllColumns, isColumnVisible, toggleColumnVisibility } = useColumnOrder();
  const { settings, updateDateFilter, updateNameFilter, updateStatusFilter } = useGlobalSettings();

  const { data: ads, isLoading, error, updateOptimistic, clearOptimistic } = useAdsListData(adsetId, settings.dateFilter);

  const filteredAds = useMemo(() => {
    if (!ads) return [];

    return ads.filter(ad => {
      const matchesName = ad.name.toLowerCase().includes(settings.nameFilter.toLowerCase());
      const matchesStatus = settings.statusFilter === 'all' || 
        (settings.statusFilter === 'ACTIVE' && ad.statusFinal === 'ATIVO') ||
        (settings.statusFilter === 'PAUSED' && ad.statusFinal === 'DESATIVADO');
      return matchesName && matchesStatus;
    });
  }, [ads, settings.nameFilter, settings.statusFilter]);

  // Cálculo das métricas de resumo
  const summaryMetrics = useMemo(() => {
    if (!filteredAds.length) return null;

    const totalSpend = filteredAds.reduce((sum, ad) => sum + ad.spend, 0);
    const totalRevenue = filteredAds.reduce((sum, ad) => sum + ad.revenue, 0);
    const totalSales = filteredAds.reduce((sum, ad) => sum + ad.sales, 0);
    const totalProfit = filteredAds.reduce((sum, ad) => sum + ad.profit, 0);
    const totalClicks = filteredAds.reduce((sum, ad) => sum + ad.clicks, 0);
    const totalImpressions = filteredAds.reduce((sum, ad) => sum + ad.impressions, 0);

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

  if (!ads || ads.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-slate-600 mb-2">Nenhum anúncio encontrado</p>
          <p className="text-slate-500 text-sm">Selecione um conjunto com anúncios ativos ou acesse todos os anúncios</p>
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

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Megaphone className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">Visualização Somente</h3>
            <p className="text-blue-700 text-sm">
              No MVP, anúncios são apenas para visualização. Edições devem ser feitas no Meta Ads Manager.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b-slate-200">
                {getVisibleColumns('ads').map((column) => {
                  const isRightAligned = !['status', 'name', 'videoLink'].includes(column);
                  return (
                    <TableHead 
                      key={column}
                      className={`font-semibold min-w-[80px] ${isRightAligned ? 'text-right' : ''} ${column === 'name' ? 'min-w-[200px]' : ''} ${column === 'videoLink' ? 'text-center' : ''}`}
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
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAds.map((ad) => (
                <>
                  <TableRow key={ad.id} className="hover:bg-slate-50">
                  {getVisibleColumns('ads').map((column) => {
                    const isRightAligned = !['status', 'name', 'videoLink'].includes(column);
                    
                    return (
                      <TableCell 
                        key={column}
                        className={`${isRightAligned ? 'text-right font-mono text-sm' : ''} ${column === 'name' ? 'font-medium' : ''} ${column === 'videoLink' ? 'text-center' : ''}`}
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
                  {expandedAd === ad.id && (
                    <TableRow>
                      <TableCell colSpan={getVisibleColumns('ads').length} className="p-0">
                        <DetailView 
                          type="ad" 
                          name={ad.name} 
                          id={ad.id} 
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
                        {column === 'cpa' && formatCurrency(summaryMetrics.cpa)}
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
    </div>
  );
};

export default AdsTab;
