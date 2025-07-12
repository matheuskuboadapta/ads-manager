
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, BarChart3, Target, Users, Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AccountsTab from '@/components/ads-manager/AccountsTab';
import CampaignsTab from '@/components/ads-manager/CampaignsTab';
import AdsetsTab from '@/components/ads-manager/AdsetsTab';
import AdsTab from '@/components/ads-manager/AdsTab';
import NavigationBreadcrumb from '@/components/ads-manager/NavigationBreadcrumb';

const Index = () => {
  const [activeTab, setActiveTab] = useState('accounts');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [selectedAdset, setSelectedAdset] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { toast } = useToast();

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
      toast({
        title: "Dados atualizados",
        description: "As métricas foram atualizadas automaticamente.",
        duration: 2000,
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [toast]);

  const handleManualRefresh = () => {
    setLastRefresh(new Date());
    toast({
      title: "Atualizando dados",
      description: "Sincronizando com a base de dados...",
      duration: 2000,
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

  const handleBreadcrumbClick = (level: string) => {
    if (level === 'accounts') {
      setActiveTab('accounts');
      setSelectedAccount(null);
      setSelectedCampaign(null);
      setSelectedAdset(null);
    } else if (level === 'campaigns') {
      setActiveTab('campaigns');
      setSelectedCampaign(null);
      setSelectedAdset(null);
    } else if (level === 'adsets') {
      setActiveTab('adsets');
      setSelectedAdset(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Adapta Ads Manager</h1>
                <p className="text-sm text-slate-500">Gerenciamento de campanhas publicitárias</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-500">
                Última atualização: {lastRefresh.toLocaleTimeString('pt-BR')}
              </span>
              <Button 
                onClick={handleManualRefresh} 
                variant="outline" 
                size="sm"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Atualizar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-lg border-0 bg-white">
          <div className="p-6">
            {/* Breadcrumb Navigation */}
            <NavigationBreadcrumb
              activeTab={activeTab}
              selectedAccount={selectedAccount}
              selectedCampaign={selectedCampaign}
              selectedAdset={selectedAdset}
              onBreadcrumbClick={handleBreadcrumbClick}
            />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex bg-slate-100">
                <TabsTrigger value="accounts" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Contas</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="campaigns" 
                  disabled={!selectedAccount}
                  className="flex items-center space-x-2"
                >
                  <Target className="h-4 w-4" />
                  <span>Campanhas</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="adsets" 
                  disabled={!selectedCampaign}
                  className="flex items-center space-x-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Conjuntos</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="ads" 
                  disabled={!selectedAdset}
                  className="flex items-center space-x-2"
                >
                  <Megaphone className="h-4 w-4" />
                  <span>Anúncios</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="accounts" className="mt-6">
                <AccountsTab onAccountSelect={handleAccountSelect} />
              </TabsContent>

              <TabsContent value="campaigns" className="mt-6">
                <CampaignsTab 
                  accountId={selectedAccount} 
                  onCampaignSelect={handleCampaignSelect}
                />
              </TabsContent>

              <TabsContent value="adsets" className="mt-6">
                <AdsetsTab 
                  campaignId={selectedCampaign} 
                  onAdsetSelect={handleAdsetSelect}
                />
              </TabsContent>

              <TabsContent value="ads" className="mt-6">
                <AdsTab adsetId={selectedAdset} />
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
