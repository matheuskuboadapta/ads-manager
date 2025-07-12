
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Target, BarChart3, Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AccountsTab from '@/components/ads-manager/AccountsTab';
import CampaignsTab from '@/components/ads-manager/CampaignsTab';
import AdsetsTab from '@/components/ads-manager/AdsetsTab';
import AdsTab from '@/components/ads-manager/AdsTab';

export default function Index() {
  const [activeTab, setActiveTab] = useState('accounts');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [selectedAdset, setSelectedAdset] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRefresh = () => {
    toast({
      title: "Dados atualizados",
      description: "As métricas foram atualizadas automaticamente.",
    });
  };

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccount(accountId);
    setActiveTab('campaigns');
  };

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaign(campaignId);
    setActiveTab('adsets');
  };

  const handleAdsetSelect = (adsetId: string) => {
    setSelectedAdset(adsetId);
    setActiveTab('ads');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Clear selections when accessing tabs directly
    if (tab === 'accounts') {
      setSelectedAccount(null);
      setSelectedCampaign(null);
      setSelectedAdset(null);
    } else if (tab === 'campaigns') {
      setSelectedCampaign(null);
      setSelectedAdset(null);
    } else if (tab === 'adsets') {
      setSelectedAdset(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Adapta Ads Manager</h1>
              <p className="text-slate-600 text-sm">Gerenciamento de campanhas publicitárias</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-slate-600">
              Última atualização: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Badge>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="accounts" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Contas</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Campanhas</span>
            </TabsTrigger>
            <TabsTrigger value="adsets" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Conjuntos</span>
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center space-x-2">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">Anúncios</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="space-y-4">
            <AccountsTab onAccountSelect={handleAccountSelect} />
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <CampaignsTab accountId={selectedAccount} onCampaignSelect={handleCampaignSelect} />
          </TabsContent>

          <TabsContent value="adsets" className="space-y-4">
            <AdsetsTab campaignId={selectedCampaign} onAdsetSelect={handleAdsetSelect} />
          </TabsContent>

          <TabsContent value="ads" className="space-y-4">
            <AdsTab adsetId={selectedAdset} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
