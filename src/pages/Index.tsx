
import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { RefreshCw, Users, Target, BarChart3, Megaphone, Settings, LogOut, Home, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalSettings } from '@/hooks/useGlobalSettings';
import { useLoading } from '@/hooks/useLoading';
import { useNavigate } from 'react-router-dom';
import AccountsTab from '@/components/ads-manager/AccountsTab';
import CampaignsTab from '@/components/ads-manager/CampaignsTab';
import AdsetsTab from '@/components/ads-manager/AdsetsTab';
import AdsTab from '@/components/ads-manager/AdsTab';
import RulesTab from '@/components/ads-manager/RulesTab';
import { HomeTab } from '@/components/home/HomeTab';
import { ChatSidebar } from '@/components/chat/ChatSidebar';

export default function Index() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [selectedAdset, setSelectedAdset] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(400);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const { updateNameFilter } = useGlobalSettings();
  const { loading: globalLoading, withLoading: withGlobalLoading } = useLoading();
  const navigate = useNavigate();

  // Aplica classe ao root quando o chat está aberto
  useEffect(() => {
    const rootElement = document.getElementById('root');
    const bodyElement = document.body;
    
    if (rootElement) {
      if (isChatOpen) {
        rootElement.classList.add('chat-open');
        bodyElement.classList.add('chat-open');
      } else {
        rootElement.classList.remove('chat-open');
        bodyElement.classList.remove('chat-open');
      }
    }
  }, [isChatOpen]);

  // Function to refresh all data
  const refreshAllData = withGlobalLoading(async () => {
    // Invalidate all queries to force refresh
    await queryClient.invalidateQueries();
    
    toast({
      title: "Dados atualizados",
      description: "As métricas foram atualizadas automaticamente.",
    });
  });

  console.log('=== INDEX STATE ===');
  console.log('activeTab:', activeTab);
  console.log('selectedAccount:', selectedAccount);
  console.log('selectedCampaign:', selectedCampaign);
  console.log('selectedAdset:', selectedAdset);
  console.log('===================');

  const handleRefresh = () => {
    refreshAllData();
  };

  const handleAccountSelect = (accountName: string) => {
    console.log('=== ACCOUNT SELECT HANDLER ===');
    console.log('Account selected:', accountName);
    console.log('Previous selectedAccount:', selectedAccount);
    
    setSelectedAccount(accountName);
    setSelectedCampaign(null);
    setSelectedAdset(null);
    setActiveTab('campaigns');
    
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
    
    // Clear the name filter when navigating to adsets tab
    // This prevents the campaign search filter from being applied to adset names
    updateNameFilter('');
    
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
    
    // Clear selections when accessing tabs directly
    if (tab === 'home') {
      setSelectedAccount(null);
      setSelectedCampaign(null);
      setSelectedAdset(null);
      console.log('Cleared all selections for', tab, 'tab');
    } else if (tab === 'accounts') {
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
      <header 
        className="bg-card border-b border-border px-6 py-4"
        style={{ 
          width: isChatOpen ? `calc(100vw - ${chatWidth}px)` : '100vw',
          transition: 'width 0.3s ease-in-out',
          minWidth: isChatOpen ? '900px' : 'auto'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary p-2 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Adapta Ads Manager</h1>
              <p className="text-muted-foreground text-sm">
                Logado como: {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-muted-foreground">
              Última atualização: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Badge>
            <ChatSidebar onToggle={setIsChatOpen} onWidthChange={setChatWidth} />
            <Button 
              onClick={() => navigate('/upload-ads')} 
              variant="outline" 
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload de ads
            </Button>
            <LoadingButton 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              loading={globalLoading}
              loadingText="Atualizando..."
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </LoadingButton>
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div 
        className={`chat-responsive-container ${isChatOpen ? 'chat-open' : ''}`}
        style={{ 
          width: isChatOpen ? `calc(100vw - ${chatWidth}px)` : '100vw',
          transition: 'width 0.3s ease-in-out',
          minWidth: isChatOpen ? '900px' : 'auto'
        }}
      >
        <main className={`p-6 chat-responsive-main ${isChatOpen ? 'overflow-x-auto' : ''}`}>
          <div className={`w-full ${isChatOpen ? 'min-w-max' : ''}`}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-[600px]">
            <TabsTrigger value="home" className="flex items-center space-x-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </TabsTrigger>
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
            <TabsTrigger value="rules" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Regras</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4">
            <HomeTab />
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <AccountsTab onAccountSelect={handleAccountSelect} />
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <CampaignsTab accountId={selectedAccount} accountName={selectedAccount} onCampaignSelect={handleCampaignSelect} />
          </TabsContent>

          <TabsContent value="adsets" className="space-y-4">
            <AdsetsTab campaignId={selectedCampaign} accountName={selectedAccount} onAdsetSelect={handleAdsetSelect} />
          </TabsContent>

          <TabsContent value="ads" className="space-y-4">
            <AdsTab adsetId={selectedAdset} campaignId={selectedCampaign} accountName={selectedAccount} />
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <RulesTab accountName={selectedAccount} />
          </TabsContent>
        </Tabs>
          </div>
        </main>
      </div>
      
      {/* Global Loading Overlay */}
      <LoadingOverlay 
        isVisible={globalLoading} 
        text="Atualizando dados..." 
      />
    </div>
  );
}
