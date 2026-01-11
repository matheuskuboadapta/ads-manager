
import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { RefreshCw, Users, Target, BarChart3, Megaphone, Settings, LogOut, Home, Upload } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLoading } from '@/hooks/useLoading';
import { useNavigate } from 'react-router-dom';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import AccountsTab from '@/components/ads-manager/AccountsTab';
import CampaignsTab from '@/components/ads-manager/CampaignsTab';
import AdsetsTab from '@/components/ads-manager/AdsetsTab';
import AdsTab from '@/components/ads-manager/AdsTab';
import RulesTab from '@/components/ads-manager/RulesTab';
import { HomeTab } from '@/components/home/HomeTab';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';

export default function Index() {
  // Use URL-based filters for tab, account, campaign, and adset
  const { 
    tab: activeTab, 
    account: selectedAccount, 
    campaign: selectedCampaign, 
    adset: selectedAdset, 
    setFilters
  } = useUrlFilters();
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(400);
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const { loading: globalLoading, withLoading: withGlobalLoading } = useLoading();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    
    // Update all params at once to avoid sync issues
    setFilters({
      account: accountName,
      campaign: null,
      adset: null,
      tab: 'campaigns'
    });
    
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
    
    // Update all params at once to avoid sync issues
    // Clear the search filter when navigating to adsets tab
    setFilters({
      campaign: campaignName,
      adset: null,
      tab: 'adsets',
      search: ''
    });
    
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
    
    // Update all params at once to avoid sync issues
    setFilters({
      adset: adsetName,
      tab: 'ads'
    });
    
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
    
    // Clear selections when accessing tabs directly using setFilters for atomic updates
    if (tab === 'home') {
      setFilters({
        tab: 'home',
        account: null,
        campaign: null,
        adset: null
      });
      console.log('Cleared all selections for', tab, 'tab');
    } else if (tab === 'accounts') {
      setFilters({
        tab: 'accounts',
        account: null,
        campaign: null,
        adset: null
      });
      console.log('Cleared all selections for accounts tab');
    } else if (tab === 'campaigns') {
      setFilters({
        tab: 'campaigns',
        campaign: null,
        adset: null
      });
      console.log('Cleared campaign and adset selections for campaigns tab');
    } else if (tab === 'adsets') {
      setFilters({
        tab: 'adsets',
        adset: null
      });
      console.log('Cleared adset selection for adsets tab');
    } else {
      setFilters({ tab });
    }
    console.log('==========================');
  };

  // Enable keyboard navigation (A/D keys to navigate between tabs)
  useKeyboardNavigation({
    currentTab: activeTab,
    onTabChange: handleTabChange,
    enabled: true,
  });

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
            {isMobile && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[250px] sm:w-[300px] p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b">
                      <h2 className="font-semibold">Menu</h2>
                    </div>
                    <nav className="flex-1 p-4">
                      <ul className="space-y-2">
                        <li>
                          <Button
                            variant={activeTab === 'home' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => {
                              handleTabChange('home');
                              setMobileMenuOpen(false);
                            }}
                          >
                            <Home className="h-4 w-4 mr-2" />
                            Home
                          </Button>
                        </li>
                        <li>
                          <Button
                            variant={activeTab === 'campaigns' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => {
                              handleTabChange('campaigns');
                              setMobileMenuOpen(false);
                            }}
                          >
                            <Target className="h-4 w-4 mr-2" />
                            Campanhas
                          </Button>
                        </li>
                      </ul>
                    </nav>
                    <div className="p-4 border-t space-y-2">
                      <div className="text-sm text-muted-foreground mb-2">
                        {user?.email}
                      </div>
                      <Button
                        onClick={() => {
                          navigate('/upload-ads');
                          setMobileMenuOpen(false);
                        }}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload de ads
                      </Button>
                      <Button
                        onClick={() => {
                          signOut();
                          setMobileMenuOpen(false);
                        }}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <div className={isMobile ? "hidden" : "bg-primary p-2 rounded-lg"}>
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className={isMobile ? "" : ""}>
              <h1 className={`font-bold text-foreground ${isMobile ? 'text-lg' : 'text-xl'}`}>Adapta Ads Manager</h1>
              {!isMobile && (
                <p className="text-muted-foreground text-sm">
                  Logado como: {user?.email}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {!isMobile && (
              <>
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
              </>
            )}
            <LoadingButton 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm"
              loading={globalLoading}
              loadingText={isMobile ? "" : "Atualizando..."}
              className={isMobile ? "p-2" : ""}
            >
              <RefreshCw className={`h-4 w-4 ${!isMobile ? 'mr-2' : ''}`} />
              {!isMobile && 'Atualizar'}
            </LoadingButton>
            {!isMobile && (
              <Button onClick={signOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            )}
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
        <main className={`${isMobile ? 'p-4' : 'p-6'} chat-responsive-main ${isChatOpen ? 'overflow-x-auto' : ''}`}>
          <div className={`w-full ${isChatOpen ? 'min-w-max' : ''}`}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          {!isMobile && (
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
          )}

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
