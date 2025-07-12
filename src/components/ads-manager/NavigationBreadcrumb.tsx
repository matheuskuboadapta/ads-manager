
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationBreadcrumbProps {
  activeTab: string;
  selectedAccount: string | null;
  selectedCampaign: string | null;
  selectedAdset: string | null;
  onBreadcrumbClick: (level: string) => void;
}

const NavigationBreadcrumb = ({
  activeTab,
  selectedAccount,
  selectedCampaign,
  selectedAdset,
  onBreadcrumbClick
}: NavigationBreadcrumbProps) => {
  const breadcrumbs = [];

  // Always show Home/Accounts
  breadcrumbs.push({
    label: 'Contas',
    level: 'accounts',
    active: activeTab === 'accounts'
  });

  // Show Campaign level if account is selected
  if (selectedAccount) {
    breadcrumbs.push({
      label: `Campanhas (${selectedAccount.slice(0, 8)}...)`,
      level: 'campaigns',
      active: activeTab === 'campaigns'
    });
  }

  // Show Adset level if campaign is selected
  if (selectedCampaign) {
    breadcrumbs.push({
      label: `Conjuntos (${selectedCampaign.slice(0, 8)}...)`,
      level: 'adsets',
      active: activeTab === 'adsets'
    });
  }

  // Show Ads level if adset is selected
  if (selectedAdset) {
    breadcrumbs.push({
      label: `Anúncios (${selectedAdset.slice(0, 8)}...)`,
      level: 'ads',
      active: activeTab === 'ads'
    });
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-600">
      <Home className="h-4 w-4 text-slate-400" />
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.level} className="flex items-center space-x-2">
          {index > 0 && <ChevronRight className="h-4 w-4 text-slate-400" />}
          <Button
            variant={breadcrumb.active ? "default" : "ghost"}
            size="sm"
            onClick={() => onBreadcrumbClick(breadcrumb.level)}
            className={`h-auto p-2 ${breadcrumb.active ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {breadcrumb.label}
          </Button>
        </div>
      ))}
    </nav>
  );
};

export default NavigationBreadcrumb;
