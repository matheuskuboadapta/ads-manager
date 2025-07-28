import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useOptimizationData } from '@/hooks/useOptimizationData';
import { formatCurrency, formatPercentage, formatNumber } from '@/utils/formatters';

interface OptimizationCampaignsSectionProps {
  dateRange: number;
}

export function OptimizationCampaignsSection({ dateRange }: OptimizationCampaignsSectionProps) {
  const { campaignsData, isLoading } = useOptimizationData('campaigns', dateRange);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">Carregando dados de hoje...</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">Carregando últimos 3 dias...</div>
            </CardContent>
          </Card>
        </div>
        <div className="col-span-2">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">Carregando campanhas...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const hasData = campaignsData.main.length > 0 || campaignsData.today.length > 0 || campaignsData.last3Days.length > 0;

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Left side - Today's and 3 days data */}
      <div className="space-y-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Hoje</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px] overflow-auto">
              {campaignsData.today.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Campanha</TableHead>
                      <TableHead className="text-xs">Gasto</TableHead>
                      <TableHead className="text-xs">CPA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignsData.today.map((campaign, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs">{campaign.name}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(campaign.spend)}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(campaign.cpa)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">Nenhum dado encontrado para hoje</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Últimos 3 dias</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px] overflow-auto">
              {campaignsData.last3Days.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Campanha</TableHead>
                      <TableHead className="text-xs">Gasto</TableHead>
                      <TableHead className="text-xs">CPA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignsData.last3Days.map((campaign, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs">{campaign.name}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(campaign.spend)}</TableCell>
                        <TableCell className="text-xs">{formatCurrency(campaign.cpa)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">Nenhum dado encontrado para os últimos 3 dias</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Main campaigns table */}
      <div className="col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Campanhas - Últimos {dateRange} dias</CardTitle>
          </CardHeader>
          <CardContent>
            {campaignsData.main.length > 0 ? (
              <div className="overflow-auto max-h-[450px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Campanha</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Valor Gasto</TableHead>
                      <TableHead>CPA</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>CTR</TableHead>
                      <TableHead>CPC</TableHead>
                      <TableHead>CPM</TableHead>
                      <TableHead>Retorno</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>ROAS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignsData.main.map((campaign, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{formatCurrency(campaign.budget)}</TableCell>
                        <TableCell>{formatCurrency(campaign.spend)}</TableCell>
                        <TableCell>{formatCurrency(campaign.cpa)}</TableCell>
                        <TableCell>{formatNumber(campaign.clicks)}</TableCell>
                        <TableCell>{formatPercentage(campaign.ctr)}</TableCell>
                        <TableCell>{formatCurrency(campaign.cpc)}</TableCell>
                        <TableCell>{formatCurrency(campaign.cpm)}</TableCell>
                        <TableCell>{formatCurrency(campaign.revenue)}</TableCell>
                        <TableCell>{formatCurrency(campaign.profit)}</TableCell>
                        <TableCell>{formatPercentage(campaign.roas)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">Nenhuma campanha encontrada</p>
                  <p className="text-sm text-muted-foreground">
                    Verifique se há dados para o período selecionado
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}