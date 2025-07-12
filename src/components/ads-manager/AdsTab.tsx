
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Megaphone, ExternalLink } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { updateAd } from '@/utils/api';

interface Ad {
  id: string;
  name: string;
  status: 'active' | 'paused';
  adFormat: string;
  spend: number;
  revenue: number;
  sales: number;
  profit: number;
  cpa: number;
  clicks: number;
  cpm: number;
  cpc: number;
  ctr: number;
  clickCv: number;
  epc: number;
  roas: number;
}

interface AdsTabProps {
  adsetId: string | null;
}

// Mock data
const mockAds: Ad[] = [
  {
    id: 'ad_001',
    name: 'Creme Anti-Idade - Carousel',
    status: 'active',
    adFormat: 'Carousel/Collection',
    spend: 1240.30,
    revenue: 4180.50,
    sales: 12,
    profit: 2940.20,
    cpa: 103.36,
    clicks: 320,
    cpm: 16.80,
    cpc: 3.88,
    ctr: 4.33,
    clickCv: 3.75,
    epc: 13.06,
    roas: 3.37
  },
  {
    id: 'ad_002',
    name: 'Sérum Vitamina C - Video',
    status: 'active',
    adFormat: 'Video',
    spend: 890.50,
    revenue: 2650.30,
    sales: 8,
    profit: 1759.80,
    cpa: 111.31,
    clicks: 240,
    cpm: 14.20,
    cpc: 3.71,
    ctr: 3.83,
    clickCv: 3.33,
    epc: 11.04,
    roas: 2.98
  },
  {
    id: 'ad_003',
    name: 'Kit Skincare - Single Image',
    status: 'paused',
    adFormat: 'Single Image',
    spend: 430.15,
    revenue: 1290.40,
    sales: 4,
    profit: 860.25,
    cpa: 107.54,
    clicks: 120,
    cpm: 12.40,
    cpc: 3.58,
    ctr: 3.46,
    clickCv: 3.33,
    epc: 10.75,
    roas: 3.00
  }
];

const AdsTab = ({ adsetId }: AdsTabProps) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (adsetId) {
      loadAds();
    }
  }, [adsetId]);

  const loadAds = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setAds(mockAds);
    setLoading(false);
  };

  const handleStatusChange = async (adId: string, newStatus: boolean) => {
    try {
      await updateAd(adId, 'status', newStatus ? 'active' : 'paused');
      
      setAds(prev => prev.map(ad => 
        ad.id === adId 
          ? { ...ad, status: newStatus ? 'active' : 'paused' }
          : ad
      ));

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600">Carregando anúncios...</span>
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
          {ads.length} anúncios
        </Badge>
      </div>

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

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Nome do Anúncio</TableHead>
              <TableHead className="font-semibold">Formato</TableHead>
              <TableHead className="font-semibold text-right">Valor Gasto</TableHead>
              <TableHead className="font-semibold text-right">Faturamento</TableHead>
              <TableHead className="font-semibold text-right">Vendas</TableHead>
              <TableHead className="font-semibold text-right">Profit</TableHead>
              <TableHead className="font-semibold text-right">ROAS</TableHead>
              <TableHead className="font-semibold text-right">CPA</TableHead>
              <TableHead className="font-semibold text-right">CTR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ads.map((ad) => (
              <TableRow key={ad.id} className="hover:bg-slate-50">
                <TableCell>
                  <Switch
                    checked={ad.status === 'active'}
                    onCheckedChange={(checked) => handleStatusChange(ad.id, checked)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <Megaphone className="h-4 w-4 text-blue-600" />
                    <span>{ad.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {ad.adFormat}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(ad.spend)}
                </TableCell>
                <TableCell className="text-right font-mono text-green-600">
                  {formatCurrency(ad.revenue)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {ad.sales}
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span className={ad.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(ad.profit)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {ad.roas.toFixed(2)}x
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(ad.cpa)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPercentage(ad.ctr)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
