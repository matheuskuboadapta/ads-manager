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
      <div className="grid grid-cols-2 gap-4">
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
        <div>
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
    <div className="grid grid-cols-2 gap-4">
      {/* Left side - Last 3 days and period data */}
      <div className="space-y-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Últimos 3 dias</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px] overflow-auto">
              {campaignsData.last3Days.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Campanha</TableHead>
                        <TableHead className="text-xs">Gasto</TableHead>
                        <TableHead className="text-xs">CPA</TableHead>
                        <TableHead className="text-xs">Clicks</TableHead>
                        <TableHead className="text-xs">CTR</TableHead>
                        <TableHead className="text-xs">Retorno</TableHead>
                        <TableHead className="text-xs">ROAS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaignsData.last3Days.map((campaign, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs">{campaign.name}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(campaign.spend)}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(campaign.cpa)}</TableCell>
                          <TableCell className="text-xs">{formatNumber(campaign.clicks)}</TableCell>
                          <TableCell className="text-xs">{formatPercentage(campaign.ctr)}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(campaign.revenue)}</TableCell>
                          <TableCell className="text-xs">{formatPercentage(campaign.roas)}</TableCell>
                        </TableRow>
                      ))}
                      {/* Total row */}
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell className="text-xs">TOTAL</TableCell>
                        <TableCell className="text-xs">
                          {formatCurrency(campaignsData.last3Days.reduce((sum, item) => sum + item.spend, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalSpend = campaignsData.last3Days.reduce((sum, item) => sum + item.spend, 0);
                            const totalSales = campaignsData.last3Days.reduce((sum, item) => sum + (item.spend / item.cpa || 0), 0);
                            return formatCurrency(totalSales > 0 ? totalSpend / totalSales : 0);
                          })()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatNumber(campaignsData.last3Days.reduce((sum, item) => sum + item.clicks, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalImpressions = campaignsData.last3Days.reduce((sum, item) => sum + (item.clicks * 100 / item.ctr || 0), 0);
                            const totalClicks = campaignsData.last3Days.reduce((sum, item) => sum + item.clicks, 0);
                            return formatPercentage(totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0);
                          })()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatCurrency(campaignsData.last3Days.reduce((sum, item) => sum + item.revenue, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalSpend = campaignsData.last3Days.reduce((sum, item) => sum + item.spend, 0);
                            const totalRevenue = campaignsData.last3Days.reduce((sum, item) => sum + item.revenue, 0);
                            return formatPercentage(totalSpend > 0 ? (totalRevenue / totalSpend) * 100 : 0);
                          })()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">Nenhum dado encontrado para os últimos 3 dias</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Últimos {dateRange} dias</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px] overflow-auto">
              {campaignsData.main.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Campanha</TableHead>
                        <TableHead className="text-xs">Gasto</TableHead>
                        <TableHead className="text-xs">CPA</TableHead>
                        <TableHead className="text-xs">Clicks</TableHead>
                        <TableHead className="text-xs">CTR</TableHead>
                        <TableHead className="text-xs">Retorno</TableHead>
                        <TableHead className="text-xs">ROAS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaignsData.main.map((campaign, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs">{campaign.name}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(campaign.spend)}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(campaign.cpa)}</TableCell>
                          <TableCell className="text-xs">{formatNumber(campaign.clicks)}</TableCell>
                          <TableCell className="text-xs">{formatPercentage(campaign.ctr)}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(campaign.revenue)}</TableCell>
                          <TableCell className="text-xs">{formatPercentage(campaign.roas)}</TableCell>
                        </TableRow>
                      ))}
                      {/* Total row */}
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell className="text-xs">TOTAL</TableCell>
                        <TableCell className="text-xs">
                          {formatCurrency(campaignsData.main.reduce((sum, item) => sum + item.spend, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalSpend = campaignsData.main.reduce((sum, item) => sum + item.spend, 0);
                            const totalSales = campaignsData.main.reduce((sum, item) => sum + (item.spend / item.cpa || 0), 0);
                            return formatCurrency(totalSales > 0 ? totalSpend / totalSales : 0);
                          })()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatNumber(campaignsData.main.reduce((sum, item) => sum + item.clicks, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalImpressions = campaignsData.main.reduce((sum, item) => sum + (item.clicks * 100 / item.ctr || 0), 0);
                            const totalClicks = campaignsData.main.reduce((sum, item) => sum + item.clicks, 0);
                            return formatPercentage(totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0);
                          })()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatCurrency(campaignsData.main.reduce((sum, item) => sum + item.revenue, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalSpend = campaignsData.main.reduce((sum, item) => sum + item.spend, 0);
                            const totalRevenue = campaignsData.main.reduce((sum, item) => sum + item.revenue, 0);
                            return formatPercentage(totalSpend > 0 ? (totalRevenue / totalSpend) * 100 : 0);
                          })()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">Nenhum dado encontrado para o período selecionado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Today's campaigns table */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Campanhas - Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {campaignsData.today.length > 0 ? (
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
                    {campaignsData.today.map((campaign, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant={campaign.status === 'ATIVO' ? 'default' : 'secondary'}>
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
                    {/* Total row */}
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell>-</TableCell>
                      <TableCell>TOTAL</TableCell>
                      <TableCell>
                        {formatCurrency(campaignsData.today.reduce((sum, item) => sum + item.budget, 0))}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(campaignsData.today.reduce((sum, item) => sum + item.spend, 0))}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalSpend = campaignsData.today.reduce((sum, item) => sum + item.spend, 0);
                          const totalSales = campaignsData.today.reduce((sum, item) => sum + (item.spend / item.cpa || 0), 0);
                          return formatCurrency(totalSales > 0 ? totalSpend / totalSales : 0);
                        })()}
                      </TableCell>
                      <TableCell>
                        {formatNumber(campaignsData.today.reduce((sum, item) => sum + item.clicks, 0))}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalImpressions = campaignsData.today.reduce((sum, item) => sum + (item.clicks * 100 / item.ctr || 0), 0);
                          const totalClicks = campaignsData.today.reduce((sum, item) => sum + item.clicks, 0);
                          return formatPercentage(totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0);
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalSpend = campaignsData.today.reduce((sum, item) => sum + item.spend, 0);
                          const totalClicks = campaignsData.today.reduce((sum, item) => sum + item.clicks, 0);
                          return formatCurrency(totalClicks > 0 ? totalSpend / totalClicks : 0);
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalSpend = campaignsData.today.reduce((sum, item) => sum + item.spend, 0);
                          const totalImpressions = campaignsData.today.reduce((sum, item) => sum + (item.clicks * 100 / item.ctr || 0), 0);
                          return formatCurrency(totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0);
                        })()}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(campaignsData.today.reduce((sum, item) => sum + item.revenue, 0))}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(campaignsData.today.reduce((sum, item) => sum + item.profit, 0))}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalSpend = campaignsData.today.reduce((sum, item) => sum + item.spend, 0);
                          const totalRevenue = campaignsData.today.reduce((sum, item) => sum + item.revenue, 0);
                          return formatPercentage(totalSpend > 0 ? (totalRevenue / totalSpend) * 100 : 0);
                        })()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">Nenhuma campanha encontrada para hoje</p>
                  <p className="text-sm text-muted-foreground">
                    Verifique se há dados para hoje na base de dados
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