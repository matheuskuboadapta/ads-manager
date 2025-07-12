
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Eye, Plus, BarChart3, Edit2, Check, X } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { updateAdset, createAdset } from '@/utils/api';
import { useAdsetsData } from '@/hooks/useAdsData';

interface AdsetsTabProps {
  campaignId: string | null;
  onAdsetSelect: (adsetId: string) => void;
}

const AdsetsTab = ({ campaignId, onAdsetSelect }: AdsetsTabProps) => {
  const { data: adsets, isLoading, error } = useAdsetsData(campaignId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [tempBudget, setTempBudget] = useState<string>('');
  const [newAdset, setNewAdset] = useState({ name: '', dailyBudget: '' });
  const { toast } = useToast();

  const handleStatusChange = async (adsetId: string, newStatus: boolean) => {
    try {
      await updateAdset(adsetId, 'status', newStatus ? 'active' : 'paused');
      
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

  const handleBudgetSave = async (adsetId: string) => {
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
      await updateAdset(adsetId, 'budget', newBudget);
      
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
          <p className="text-slate-500 text-sm">Selecione uma campanha com conjuntos ativos</p>
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
            {adsets.length} conjuntos
          </Badge>
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

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Nome do Conjunto</TableHead>
              <TableHead className="font-semibold text-right">Orçamento Diário</TableHead>
              <TableHead className="font-semibold text-right">Valor Gasto</TableHead>
              <TableHead className="font-semibold text-right">Faturamento</TableHead>
              <TableHead className="font-semibold text-right">Vendas</TableHead>
              <TableHead className="font-semibold text-right">Profit</TableHead>
              <TableHead className="font-semibold text-right">ROAS</TableHead>
              <TableHead className="font-semibold text-right">CPA</TableHead>
              <TableHead className="font-semibold text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adsets.map((adset) => (
              <TableRow key={adset.id} className="hover:bg-slate-50">
                <TableCell>
                  <Switch
                    checked={adset.status === 'active'}
                    onCheckedChange={(checked) => handleStatusChange(adset.id, checked)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span>{adset.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {editingBudget === adset.id ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={tempBudget}
                        onChange={(e) => setTempBudget(e.target.value)}
                        className="w-24 h-8"
                        min="1"
                        step="0.01"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleBudgetSave(adset.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleBudgetCancel}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end space-x-2">
                      <span className="font-mono">{formatCurrency(adset.dailyBudget)}</span>
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
                <TableCell className="text-right font-mono">
                  {formatCurrency(adset.spend)}
                </TableCell>
                <TableCell className="text-right font-mono text-green-600">
                  {formatCurrency(adset.revenue)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {adset.sales}
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span className={adset.profit > 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(adset.profit)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {adset.roas.toFixed(2)}x
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(adset.cpa)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    onClick={() => onAdsetSelect(adset.name)}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Ver Anúncios</span>
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

export default AdsetsTab;
