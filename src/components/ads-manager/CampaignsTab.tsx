
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, Plus, Target } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { updateCampaign, createCampaign } from '@/utils/api';

interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: 'active' | 'paused';
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

interface CampaignsTabProps {
  accountId: string | null;
  onCampaignSelect: (campaignId: string) => void;
}

// Mock data
const mockCampaigns: Campaign[] = [
  {
    id: 'camp_001',
    name: 'Black Friday 2024 - Cremes',
    objective: 'CONVERSIONS',
    status: 'active',
    spend: 5420.30,
    revenue: 18250.80,
    sales: 47,
    profit: 12830.50,
    cpa: 115.30,
    clicks: 1250,
    cpm: 15.40,
    cpc: 4.34,
    ctr: 2.82,
    clickCv: 3.76,
    epc: 14.60,
    roas: 3.37
  },
  {
    id: 'camp_002',
    name: 'Retargeting - Abandono Carrinho',
    objective: 'CONVERSIONS',
    status: 'active',
    spend: 2840.75,
    revenue: 9150.30,
    sales: 28,
    profit: 6309.55,
    cpa: 101.46,
    clicks: 890,
    cpm: 12.80,
    cpc: 3.19,
    ctr: 4.01,
    clickCv: 3.15,
    epc: 10.28,
    roas: 3.22
  },
  {
    id: 'camp_003',
    name: 'Prospecção - Lookalike',
    objective: 'REACH',
    status: 'paused',
    spend: 1180.40,
    revenue: 2890.20,
    sales: 12,
    profit: 1709.80,
    cpa: 98.37,
    clicks: 420,
    cpm: 8.90,
    cpc: 2.81,
    ctr: 3.17,
    clickCv: 2.86,
    epc: 6.88,
    roas: 2.45
  }
];

const CampaignsTab = ({ accountId, onCampaignSelect }: CampaignsTabProps) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', objective: 'CONVERSIONS' });
  const { toast } = useToast();

  useEffect(() => {
    if (accountId) {
      loadCampaigns();
    }
  }, [accountId]);

  const loadCampaigns = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setCampaigns(mockCampaigns);
    setLoading(false);
  };

  const handleStatusChange = async (campaignId: string, newStatus: boolean) => {
    try {
      await updateCampaign(campaignId, 'status', newStatus ? 'active' : 'paused');
      
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, status: newStatus ? 'active' : 'paused' }
          : campaign
      ));

      toast({
        title: "Status atualizado",
        description: `Campanha ${newStatus ? 'ativada' : 'pausada'} com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status da campanha.",
        variant: "destructive",
      });
    }
  };

  const handleObjectiveChange = async (campaignId: string, newObjective: string) => {
    try {
      await updateCampaign(campaignId, 'objective', newObjective);
      
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, objective: newObjective }
          : campaign
      ));

      toast({
        title: "Objetivo atualizado",
        description: "Objetivo da campanha alterado com sucesso.",
      });
    } catch (error) {
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
      loadCampaigns();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar campanha.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600">Carregando campanhas...</span>
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
            {campaigns.length} campanhas
          </Badge>
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

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Nome da Campanha</TableHead>
              <TableHead className="font-semibold">Objetivo</TableHead>
              <TableHead className="font-semibold text-right">Valor Gasto</TableHead>
              <TableHead className="font-semibold text-right">Faturamento</TableHead>
              <TableHead className="font-semibold text-right">Vendas</TableHead>
              <TableHead className="font-semibold text-right">Profit</TableHead>
              <TableHead className="font-semibold text-right">ROAS</TableHead>
              <TableHead className="font-semibold text-right">CTR</TableHead>
              <TableHead className="font-semibold text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id} className="hover:bg-slate-50">
                <TableCell>
                  <Switch
                    checked={campaign.status === 'active'}
                    onCheckedChange={(checked) => handleStatusChange(campaign.id, checked)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span>{campaign.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={campaign.objective}
                    onValueChange={(value) => handleObjectiveChange(campaign.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONVERSIONS">Conversões</SelectItem>
                      <SelectItem value="REACH">Alcance</SelectItem>
                      <SelectItem value="TRAFFIC">Tráfego</SelectItem>
                      <SelectItem value="AWARENESS">Reconhecimento</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(campaign.spend)}
                </TableCell>
                <TableCell className="text-right font-mono text-green-600">
                  {formatCurrency(campaign.revenue)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {campaign.sales}
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span className={campaign.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(campaign.profit)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {campaign.roas.toFixed(2)}x
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPercentage(campaign.ctr)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    onClick={() => onCampaignSelect(campaign.id)}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Ver Conjuntos</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CampaignsTab;
