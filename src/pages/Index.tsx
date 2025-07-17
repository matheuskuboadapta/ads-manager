
import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Target, BarChart3, Megaphone, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();

  // Function to refresh all data
  const refreshAllData = () => {
    // Invalidate all queries to force refresh
    queryClient.invalidateQueries();
    
    toast({
      title: "Dados atualizados",
      description: "As métricas foram atualizadas automaticamente.",
    });
  };

  console.log('=== INDEX STATE ===');
  console.log('activeTab:', activeTab);
  console.log('selectedAccount:', selectedAccount);
  console.log('selectedCampaign:', selectedCampaign);
  console.log('selectedAdset:', selectedAdset);
  console.log('===================');

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleAccountSelect = (accountName: string) => {
    console.log('=== ACCOUNT SELECT HANDLER ===');
    console.log('Account selected:', accountName);
    console.log('Previous selectedAccount:', selectedAccount);
    
    setSelectedAccount(accountName);
    setSelectedCampaign(null);
    setSelectedAdset(null);
    setActiveTab('campaigns');
    
    // Refresh data when navigating to campaigns
    refreshAllData();
    
    console.log('State will be updated to:', {
      selectedAccount: accountName,
      selectedCampaign: null,
      selectedAdset: null,
      activeTab: 'campaigns'
    });
    console.log('==============================');
  };

  const handleCampaignSelect = (campaignName: string) => {
    console.log('=== CAMPAIGN SELECT HANDLER ===');
    console.log('Campaign selected:', campaignName);
    console.log('Current selectedAccount:', selectedAccount);
    console.log('Previous selectedCampaign:', selectedCampaign);
    
    setSelectedCampaign(campaignName);
    setSelectedAdset(null);
    setActiveTab('adsets');
    
    // Refresh data when navigating to adsets
    refreshAllData();
    
    console.log('State will be updated to:', {
      selectedAccount: selectedAccount,
      selectedCampaign: campaignName,
      selectedAdset: null,
      activeTab: 'adsets'
    });
    console.log('===============================');
  };

  const handleAdsetSelect = (adsetName: string) => {
    console.log('=== ADSET SELECT HANDLER ===');
    console.log('Adset selected:', adsetName);
    console.log('Current selectedCampaign:', selectedCampaign);
    console.log('Previous selectedAdset:', selectedAdset);
    
    setSelectedAdset(adsetName);
    setActiveTab('ads');
    
    // Refresh data when navigating to ads
    refreshAllData();
    
    console.log('State will be updated to:', {
      selectedCampaign: selectedCampaign,
      selectedAdset: adsetName,
      activeTab: 'ads'
    });
    console.log('============================');
  };

  const handleTabChange = (tab: string) => {
    console.log('=== TAB CHANGE HANDLER ===');
    console.log('Tab changed to:', tab);
    console.log('Previous tab:', activeTab);
    
    setActiveTab(tab);
    
    // Refresh data whenever tab changes
    refreshAllData();
    
    // Clear selections when accessing tabs directly
    if (tab === 'accounts') {
      setSelectedAccount(null);
      setSelectedCampaign(null);
      setSelectedAdset(null);
      console.log('Cleared all selections for accounts tab');
    } else if (tab === 'campaigns') {
      setSelectedCampaign(null);
      setSelectedAdset(null);
      console.log('Cleared campaign and adset selections for campaigns tab');
    } else if (tab === 'adsets') {
      setSelectedAdset(null);
      console.log('Cleared adset selection for adsets tab');
    }
    console.log('==========================');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-2 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Adapta Ads Manager</h1>
              <p className="text-muted-foreground text-sm">Gerenciamento de campanhas publicitárias</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Badge variant="outline" className="text-muted-foreground">
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
