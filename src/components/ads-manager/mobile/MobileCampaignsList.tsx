import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, TrendingUp, TrendingDown, Edit2, Check, X } from 'lucide-react';
import { formatCurrency, formatCurrencyNoDecimals, formatPercentage } from '@/utils/formatters';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface MobileCampaignsListProps {
  campaigns: any[];
  onCampaignClick: (campaign: any) => void;
  onStatusChange: (campaign: any, newStatus: boolean) => void;
  onBudgetEdit: (campaignId: string, currentBudget: number) => void;
  onBudgetSave: (campaign: any, newBudget: string) => void;
  onBudgetCancel: () => void;
  editingBudget: string | null;
  tempBudget: string;
  setTempBudget: (value: string) => void;
  statusUpdateLoading: boolean;
  isEditMode: boolean;
  localStatusUpdates: { [campaignId: string]: string };
}

const MobileCampaignsList = ({ 
  campaigns, 
  onCampaignClick, 
  onStatusChange,
  onBudgetEdit,
  onBudgetSave,
  onBudgetCancel,
  editingBudget,
  tempBudget,
  setTempBudget,
  statusUpdateLoading,
  isEditMode,
  localStatusUpdates
}: MobileCampaignsListProps) => {
  const getStatusColor = (status: string) => {
    return status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getTrendIcon = (value: number, previousValue: number) => {
    if (previousValue === 0) return null;
    const delta = ((value - previousValue) / previousValue) * 100;
    
    if (delta > 0) {
      return <TrendingUp className="h-3 w-3 text-green-600" />;
    } else if (delta < 0) {
      return <TrendingDown className="h-3 w-3 text-red-600" />;
    }
    return null;
  };

  return (
    <div className="space-y-3 pb-20">
      {campaigns.map((campaign) => {
        const localStatus = localStatusUpdates[campaign.id];
        const serverStatus = campaign.statusFinal;
        const currentStatus = localStatus || serverStatus;
        const isChecked = currentStatus === 'ATIVO';
        const isUpdating = statusUpdateLoading && localStatus !== undefined;

        return (
          <Card 
            key={campaign.id} 
            className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
            onClick={() => onCampaignClick(campaign)}
          >
            <CardContent className="p-4 space-y-3">
              {/* Header com nome e status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 overflow-hidden max-w-[calc(100%-90px)]">
                  <h3 className="font-semibold text-base truncate break-all">
                    {campaign.name.length > 40 ? `${campaign.name.substring(0, 40)}...` : campaign.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(currentStatus)}`}
                    >
                      {currentStatus}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0 w-[90px] justify-end" onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={isChecked}
                    onCheckedChange={(checked) => onStatusChange(campaign, checked)}
                    disabled={statusUpdateLoading || !isEditMode}
                    className="data-[state=checked]:bg-green-600"
                  />
                  {isUpdating && <LoadingSpinner size="sm" />}
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Métricas principais */}
              <div className="flex gap-3">
                {/* Coluna esquerda - métricas principais */}
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">CTR</p>
                    <p className="font-semibold text-sm">{formatPercentage(campaign.ctr)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">CPA</p>
                    <p className="font-semibold text-sm">
                      {formatCurrency(campaign.cpa)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Gasto</p>
                    <p className="font-semibold text-sm">{formatCurrency(campaign.spend)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Vendas</p>
                    <p className="font-semibold text-sm">{campaign.sales}</p>
                  </div>
                </div>

                {/* Coluna direita - CPC e CPM */}
                <div className="flex flex-col gap-3 text-right min-w-[80px]">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">CPC</p>
                    <p className="font-semibold text-sm">{formatCurrencyNoDecimals(campaign.cpc)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">CPM</p>
                    <p className="font-semibold text-sm">{formatCurrencyNoDecimals(campaign.cpm)}</p>
                  </div>
                </div>
              </div>

              {/* Orçamento diário */}
              {!campaign.isAdsetLevelBudget && (
                <div className="pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                  {editingBudget === campaign.id ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Orçamento Diário</p>
                        <Input
                          type="number"
                          value={tempBudget}
                          onChange={(e) => setTempBudget(e.target.value)}
                          className="h-8 text-sm"
                          step="0.01"
                          min="0"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex gap-1 pt-5">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBudgetSave(campaign, tempBudget);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBudgetCancel();
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Orçamento Diário</p>
                        <p className="font-semibold text-sm">{formatCurrency(campaign.dailyBudget)}</p>
                      </div>
                      {isEditMode && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBudgetEdit(campaign.id, campaign.dailyBudget);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MobileCampaignsList;
