
import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Megaphone, ExternalLink } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { updateAd } from '@/utils/api';
import { useAdsListData } from '@/hooks/useAdsData';
import FilterBar, { DateFilter } from './FilterBar';

interface AdsTabProps {
  adsetId: string | null;
}

const AdsTab = ({ adsetId }: AdsTabProps) => {
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter | null>(null);
  const { toast } = useToast();

  const { data: ads, isLoading, error } = useAdsListData(adsetId, dateFilter);

  const filteredAds = useMemo(() => {
    if (!ads) return [];

    return ads.filter(ad => {
      const matchesName = ad.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
      return matchesName && matchesStatus;
    });
  }, [ads, nameFilter, statusFilter]);

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

  const handleStatusChange = async (adId: string, newStatus: boolean) => {
    try {
      await updateAd(adId, 'status', newStatus ? 'ACTIVE' : 'PAUSED');
      
      toast({
        title: "Status atualizado",
        description: `Anúncio ${newStatus ? 'ativado' : 'pausado'} com sucesso.`,
      });
    } catch (error) {
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
          <h2 className="text-2xl font-bold text-slate-900">Anúncios</h2>
          <p className="text-slate-600">Visualize o desempenho individual dos anúncios</p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {filteredAds.length} anúncios
        </Badge>
      </div>

      <FilterBar
        activeTab="ads"
        onNameFilter={setNameFilter}
        onStatusFilter={setStatusFilter}
        onDateFilter={setDateFilter}
        nameFilter={nameFilter}
        statusFilter={statusFilter}
        dateFilter={dateFilter}
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
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold min-w-[80px]">Status</TableHead>
                <TableHead className="font-semibold min-w-[200px]">Nome do Anúncio</TableHead>
                <TableHead className="font-semibold min-w-[100px]">Formato</TableHead>
                <TableHead className="font-semibold text-right min-w-[120px]">Valor Gasto</TableHead>
                <TableHead className="font-semibold text-right min-w-[120px]">Faturamento</TableHead>
                <TableHead className="font-semibold text-right min-w-[80px]">Vendas</TableHead>
                <TableHead className="font-semibold text-right min-w-[100px]">Profit</TableHead>
                <TableHead className="font-semibold text-right min-w-[80px]">CPA</TableHead>
                <TableHead className="font-semibold text-right min-w-[80px]">CPM</TableHead>
                <TableHead className="font-semibold text-right min-w-[80px]">ROAS</TableHead>
                <TableHead className="font-semibold text-right min-w-[80px]">CTR</TableHead>
                <TableHead className="font-semibold text-right min-w-[90px]">Click CV</TableHead>
                <TableHead className="font-semibold text-right min-w-[80px]">EPC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAds.map((ad) => (
                <TableRow key={ad.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Switch
                      checked={ad.status === 'ACTIVE'}
                      onCheckedChange={(checked) => handleStatusChange(ad.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Megaphone className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{ad.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {ad.adFormat}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(ad.spend)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600 text-sm">
                    {formatCurrency(ad.revenue)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm">
                    {ad.sales}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    <span className={ad.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(ad.profit)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(ad.cpa)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(ad.cpm)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-sm">
                    {ad.roas.toFixed(2)}x
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatPercentage(ad.ctr)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatPercentage(ad.clickCv)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(ad.epc)}
                  </TableCell>
                </TableRow>
              ))}
              {summaryMetrics && (
                <TableRow className="bg-blue-50 border-t-2 border-blue-200 font-semibold">
                  <TableCell></TableCell>
                  <TableCell className="font-bold text-blue-900">
                    RESUMO ({filteredAds.length} anúncios)
                  </TableCell>
                  <TableCell></TableCell>
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
