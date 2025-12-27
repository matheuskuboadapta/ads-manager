import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Edit2, Check, X, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { useCampaignDetails } from '@/hooks/useCampaignDetails';
import { useToast } from '@/hooks/use-toast';
import { updateAdset, updateAd } from '@/utils/api';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface MobileCampaignDetailDialogProps {
  campaign: any;
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
}

const MobileCampaignDetailDialog = ({ 
  campaign, 
  isOpen, 
  onClose,
  isEditMode
}: MobileCampaignDetailDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settings } = useGlobalSettings();
  const [activeTab, setActiveTab] = useState<'adsets' | 'ads'>('adsets');
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [tempBudget, setTempBudget] = useState<string>('');
  const [localStatusUpdates, setLocalStatusUpdates] = useState<{ [id: string]: string }>({});
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [showBudgetConfirmation, setShowBudgetConfirmation] = useState(false);
  const [pendingBudgetChange, setPendingBudgetChange] = useState<{ item: any; newBudget: number; currentBudget: number; type: 'adset' | 'ad' } | null>(null);

  const { data: campaignDetails, isLoading: detailsLoading } = useCampaignDetails(
    campaign?.name || null,
    settings.dateFilter,
    isOpen
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab('adsets');
      setLocalStatusUpdates({});
    }
  }, [isOpen]);

  const handleAdsetStatusChange = async (adset: any, newStatus: boolean) => {
    const status = newStatus ? 'ACTIVE' : 'PAUSED';
    
    setLocalStatusUpdates(prev => ({ ...prev, [adset.id]: status }));
    setStatusUpdateLoading(true);
    
    try {
      await updateAdset(adset.realId || adset.id, 'status', status, user?.email || '');
      
      // Wait a bit before invalidating to give the database time to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      queryClient.invalidateQueries({
        queryKey: ['ads-data', settings.dateFilter]
      });
      
      toast({
        title: "Status atualizado",
        description: `Conjunto "${adset.name}" ${newStatus ? 'ativado' : 'pausado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Error updating adset status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do conjunto.",
        variant: "destructive",
      });
      setLocalStatusUpdates(prev => {
        const newState = { ...prev };
        delete newState[adset.id];
        return newState;
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleAdStatusChange = async (ad: any, newStatus: boolean) => {
    const status = newStatus ? 'ACTIVE' : 'PAUSED';
    
    setLocalStatusUpdates(prev => ({ ...prev, [ad.id]: status }));
    setStatusUpdateLoading(true);
    
    try {
      await updateAd(ad.realId || ad.id, 'status', status, user?.email || '');
      
      // Wait a bit before invalidating to give the database time to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      queryClient.invalidateQueries({
        queryKey: ['ads-data', settings.dateFilter]
      });
      
      toast({
        title: "Status atualizado",
        description: `Anúncio "${ad.name}" ${newStatus ? 'ativado' : 'pausado'} com sucesso.`,
      });
    } catch (error) {
      console.error('Error updating ad status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do anúncio.",
        variant: "destructive",
      });
      setLocalStatusUpdates(prev => {
        const newState = { ...prev };
        delete newState[ad.id];
        return newState;
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleBudgetEdit = (id: string, currentBudget: number) => {
    setEditingBudget(id);
    setTempBudget(currentBudget.toString());
  };

  const handleBudgetSave = async (item: any, type: 'adset' | 'ad') => {
    const budget = parseFloat(tempBudget);
    
    if (isNaN(budget) || budget < 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para o orçamento.",
        variant: "destructive",
      });
      return;
    }

    const currentBudget = item.dailyBudget;
    const budgetIncrease = budget / currentBudget;
    
    if (budgetIncrease >= 4) {
      setPendingBudgetChange({ item, newBudget: budget, currentBudget, type });
      setShowBudgetConfirmation(true);
      return;
    }

    await performBudgetUpdate(item, budget, type);
  };

  const performBudgetUpdate = async (item: any, budget: number, type: 'adset' | 'ad') => {
    try {
      if (type === 'adset') {
        await updateAdset(item.realId || item.id, 'budget', budget, user?.email || '');
      } else {
        await updateAd(item.realId || item.id, 'budget', budget, user?.email || '');
      }
      
      setEditingBudget(null);
      setTempBudget('');
      
      queryClient.invalidateQueries({
        queryKey: ['ads-data', settings.dateFilter]
      });
      
      toast({
        title: "Orçamento atualizado",
        description: `Orçamento do ${type === 'adset' ? 'conjunto' : 'anúncio'} "${item.name}" alterado para ${formatCurrency(budget)}.`,
      });
    } catch (error) {
      console.error(`Error updating ${type} budget:`, error);
      toast({
        title: "Erro",
        description: `Não foi possível atualizar o orçamento do ${type === 'adset' ? 'conjunto' : 'anúncio'}.`,
        variant: "destructive",
      });
    }
  };

  const handleBudgetConfirmation = async () => {
    if (pendingBudgetChange) {
      await performBudgetUpdate(pendingBudgetChange.item, pendingBudgetChange.newBudget, pendingBudgetChange.type);
      setShowBudgetConfirmation(false);
      setPendingBudgetChange(null);
    }
  };

  const handleBudgetCancel = () => {
    setEditingBudget(null);
    setTempBudget('');
  };

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' || status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  if (!campaign) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
          <DialogHeader className="p-4 pb-0 pr-12">
            <DialogTitle className="text-lg truncate pr-2">
              {campaign.name.length > 40 ? `${campaign.name.substring(0, 40)}...` : campaign.name}
            </DialogTitle>
          </DialogHeader>

          {/* Métricas resumidas da campanha */}
          <div className="p-4 space-y-3 border-b">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">CPA</p>
                <p className="font-semibold">
                  {formatCurrency(campaign.cpa)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">CTR</p>
                <p className="font-semibold">{formatPercentage(campaign.ctr)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Gasto</p>
                <p className="font-semibold">{formatCurrency(campaign.spend)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Vendas</p>
                <p className="font-semibold">{campaign.sales}</p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'adsets' | 'ads')}>
            <TabsList className="grid w-full grid-cols-2 p-0 h-auto">
              <TabsTrigger value="adsets" className="rounded-none">Conjuntos</TabsTrigger>
              <TabsTrigger value="ads" className="rounded-none">Anúncios</TabsTrigger>
            </TabsList>

            <TabsContent value="adsets" className="p-4 space-y-3 m-0">
              {detailsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : campaignDetails?.adsets && campaignDetails.adsets.length > 0 ? (
                campaignDetails.adsets.map((adset: any) => {
                  const localStatus = localStatusUpdates[adset.id];
                  const currentStatus = localStatus || adset.status;
                  const isChecked = currentStatus === 'ACTIVE' || currentStatus === 'ATIVO';
                  const isUpdating = statusUpdateLoading && localStatus !== undefined;

                  return (
                    <Card key={adset.id} className="overflow-hidden">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0 overflow-hidden max-w-[calc(100%-60px)]">
                            <h4 className="font-medium text-sm truncate break-all">
                              {adset.name.length > 40 ? `${adset.name.substring(0, 40)}...` : adset.name}
                            </h4>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs mt-1 ${getStatusColor(currentStatus)}`}
                            >
                              {currentStatus === 'ACTIVE' || currentStatus === 'ATIVO' ? 'Ativo' : 'Pausado'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 w-[60px] justify-end">
                            <Switch
                              checked={isChecked}
                              onCheckedChange={(checked) => handleAdsetStatusChange(adset, checked)}
                              disabled={statusUpdateLoading || !isEditMode}
                              className="data-[state=checked]:bg-green-600"
                            />
                            {isUpdating && <LoadingSpinner size="sm" />}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">CPA</p>
                            <p className="font-semibold">
                              {formatCurrency(adset.cpa)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">CTR</p>
                            <p className="font-semibold">{formatPercentage(adset.ctr)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Gasto</p>
                            <p className="font-semibold">{formatCurrency(adset.spend)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Vendas</p>
                            <p className="font-semibold">{adset.sales}</p>
                          </div>
                        </div>

                        {/* Orçamento - só mostra edição se for orçamento a nível de conjunto */}
                        <div className="pt-2 border-t">
                          {campaign.isAdsetLevelBudget ? (
                            editingBudget === adset.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  value={tempBudget}
                                  onChange={(e) => setTempBudget(e.target.value)}
                                  className="h-8 text-sm"
                                  step="0.01"
                                  min="0"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleBudgetSave(adset, 'adset')}
                                  className="h-8 w-8 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleBudgetCancel}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-gray-500">Orçamento</p>
                                  <p className="font-semibold text-sm">{formatCurrency(adset.dailyBudget || 0)}</p>
                                </div>
                                {isEditMode && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleBudgetEdit(adset.id, adset.dailyBudget || 0)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )
                          ) : (
                            <div className="text-xs text-yellow-600">
                              Orçamento a nível de campanha
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum conjunto encontrado</p>
              )}
            </TabsContent>

            <TabsContent value="ads" className="p-4 space-y-3 m-0">
              {detailsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : campaignDetails?.ads && campaignDetails.ads.length > 0 ? (
                campaignDetails.ads.map((ad: any) => {
                  const localStatus = localStatusUpdates[ad.id];
                  const currentStatus = localStatus || ad.status;
                  const isChecked = currentStatus === 'ACTIVE' || currentStatus === 'ATIVO';
                  const isUpdating = statusUpdateLoading && localStatus !== undefined;

                  return (
                    <Card key={ad.id} className="overflow-hidden">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0 overflow-hidden max-w-[calc(100%-60px)]">
                            <h4 className="font-medium text-sm truncate break-all">
                              {ad.name.length > 40 ? `${ad.name.substring(0, 40)}...` : ad.name}
                            </h4>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs mt-1 ${getStatusColor(currentStatus)}`}
                            >
                              {currentStatus === 'ACTIVE' || currentStatus === 'ATIVO' ? 'Ativo' : 'Pausado'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 w-[60px] justify-end">
                            <Switch
                              checked={isChecked}
                              onCheckedChange={(checked) => handleAdStatusChange(ad, checked)}
                              disabled={statusUpdateLoading || !isEditMode}
                              className="data-[state=checked]:bg-green-600"
                            />
                            {isUpdating && <LoadingSpinner size="sm" />}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">CPA</p>
                            <p className="font-semibold">
                              {formatCurrency(ad.cpa)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">CTR</p>
                            <p className="font-semibold">{formatPercentage(ad.ctr)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Gasto</p>
                            <p className="font-semibold">{formatCurrency(ad.spend)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Vendas</p>
                            <p className="font-semibold">{ad.sales}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum anúncio encontrado</p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

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
            <AlertDialogCancel onClick={() => {
              setShowBudgetConfirmation(false);
              setPendingBudgetChange(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBudgetConfirmation}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MobileCampaignDetailDialog;
