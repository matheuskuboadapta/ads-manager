
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
import { useCampaignsData } from '@/hooks/useAdsData';

interface CampaignsTabProps {
  accountId: string | null;
  onCampaignSelect: (campaignId: string) => void;
}

const CampaignsTab = ({ accountId, onCampaignSelect }: CampaignsTabProps) => {
  const { data: campaigns, isLoading, error } = useCampaignsData(accountId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', objective: 'CONVERSIONS' });
  const { toast } = useToast();

  const handleStatusChange = async (campaignId: string, newStatus: boolean) => {
    try {
      await updateCampaign(campaignId, 'status', newStatus ? 'active' : 'paused');
      
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
          <p className="text-slate-500 text-sm">Selecione uma conta com campanhas ativas</p>
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
                    onClick={() => onCampaignSelect(campaign.name)}
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
