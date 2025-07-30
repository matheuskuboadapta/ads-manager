import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useOptimizationData } from '@/hooks/useOptimizationData';
import { formatCurrency, formatPercentage, formatNumber } from '@/utils/formatters';

interface OptimizationAdsetsSectionProps {
  dateRange: number;
}

export function OptimizationAdsetsSection({ dateRange }: OptimizationAdsetsSectionProps) {
  const { adsetsData, isLoading } = useOptimizationData('adsets', dateRange);

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
              <div className="text-center text-muted-foreground">Carregando conjuntos de anúncios...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              {adsetsData.last3Days.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Conjunto</TableHead>
                        <TableHead className="text-xs">Gasto</TableHead>
                        <TableHead className="text-xs">CPA</TableHead>
                        <TableHead className="text-xs">Clicks</TableHead>
                        <TableHead className="text-xs">CTR</TableHead>
                        <TableHead className="text-xs">Retorno</TableHead>
                        <TableHead className="text-xs">ROAS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adsetsData.last3Days.map((adset, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs">{adset.name}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(adset.spend)}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(adset.cpa)}</TableCell>
                          <TableCell className="text-xs">{formatNumber(adset.clicks)}</TableCell>
                          <TableCell className="text-xs">{formatPercentage(adset.ctr)}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(adset.revenue)}</TableCell>
                          <TableCell className="text-xs">{formatPercentage(adset.roas)}</TableCell>
                        </TableRow>
                      ))}
                      {/* Total row */}
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell className="text-xs">TOTAL</TableCell>
                        <TableCell className="text-xs">
                          {formatCurrency(adsetsData.last3Days.reduce((sum, item) => sum + item.spend, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalSpend = adsetsData.last3Days.reduce((sum, item) => sum + item.spend, 0);
                            const totalSales = adsetsData.last3Days.reduce((sum, item) => sum + (item.spend / item.cpa || 0), 0);
                            return formatCurrency(totalSales > 0 ? totalSpend / totalSales : 0);
                          })()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatNumber(adsetsData.last3Days.reduce((sum, item) => sum + item.clicks, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalImpressions = adsetsData.last3Days.reduce((sum, item) => sum + (item.clicks * 100 / item.ctr || 0), 0);
                            const totalClicks = adsetsData.last3Days.reduce((sum, item) => sum + item.clicks, 0);
                            return formatPercentage(totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0);
                          })()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatCurrency(adsetsData.last3Days.reduce((sum, item) => sum + item.revenue, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalSpend = adsetsData.last3Days.reduce((sum, item) => sum + item.spend, 0);
                            const totalRevenue = adsetsData.last3Days.reduce((sum, item) => sum + item.revenue, 0);
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
              {adsetsData.main.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Conjunto</TableHead>
                        <TableHead className="text-xs">Gasto</TableHead>
                        <TableHead className="text-xs">CPA</TableHead>
                        <TableHead className="text-xs">Clicks</TableHead>
                        <TableHead className="text-xs">CTR</TableHead>
                        <TableHead className="text-xs">Retorno</TableHead>
                        <TableHead className="text-xs">ROAS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adsetsData.main.map((adset, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs">{adset.name}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(adset.spend)}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(adset.cpa)}</TableCell>
                          <TableCell className="text-xs">{formatNumber(adset.clicks)}</TableCell>
                          <TableCell className="text-xs">{formatPercentage(adset.ctr)}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(adset.revenue)}</TableCell>
                          <TableCell className="text-xs">{formatPercentage(adset.roas)}</TableCell>
                        </TableRow>
                      ))}
                      {/* Total row */}
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell className="text-xs">TOTAL</TableCell>
                        <TableCell className="text-xs">
                          {formatCurrency(adsetsData.main.reduce((sum, item) => sum + item.spend, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalSpend = adsetsData.main.reduce((sum, item) => sum + item.spend, 0);
                            const totalSales = adsetsData.main.reduce((sum, item) => sum + (item.spend / item.cpa || 0), 0);
                            return formatCurrency(totalSales > 0 ? totalSpend / totalSales : 0);
                          })()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatNumber(adsetsData.main.reduce((sum, item) => sum + item.clicks, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalImpressions = adsetsData.main.reduce((sum, item) => sum + (item.clicks * 100 / item.ctr || 0), 0);
                            const totalClicks = adsetsData.main.reduce((sum, item) => sum + item.clicks, 0);
                            return formatPercentage(totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0);
                          })()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatCurrency(adsetsData.main.reduce((sum, item) => sum + item.revenue, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalSpend = adsetsData.main.reduce((sum, item) => sum + item.spend, 0);
                            const totalRevenue = adsetsData.main.reduce((sum, item) => sum + item.revenue, 0);
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

      {/* Right side - Today's adsets table */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Conjuntos de Anúncios - Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {adsetsData.today.length > 0 ? (
              <div className="overflow-auto max-h-[450px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Conjunto</TableHead>
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
                    {adsetsData.today.map((adset, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant={adset.status === 'ATIVO' ? 'default' : 'secondary'}>
                            {adset.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{adset.name}</TableCell>
                        <TableCell>{formatCurrency(adset.budget)}</TableCell>
                        <TableCell>{formatCurrency(adset.spend)}</TableCell>
                        <TableCell>{formatCurrency(adset.cpa)}</TableCell>
                        <TableCell>{formatNumber(adset.clicks)}</TableCell>
                        <TableCell>{formatPercentage(adset.ctr)}</TableCell>
                        <TableCell>{formatCurrency(adset.cpc)}</TableCell>
                        <TableCell>{formatCurrency(adset.cpm)}</TableCell>
                        <TableCell>{formatCurrency(adset.revenue)}</TableCell>
                        <TableCell>{formatCurrency(adset.profit)}</TableCell>
                        <TableCell>{formatPercentage(adset.roas)}</TableCell>
                      </TableRow>
                    ))}
                    {/* Total row */}
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell>-</TableCell>
                      <TableCell>TOTAL</TableCell>
                      <TableCell>
                        {formatCurrency(adsetsData.today.reduce((sum, item) => sum + item.budget, 0))}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(adsetsData.today.reduce((sum, item) => sum + item.spend, 0))}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalSpend = adsetsData.today.reduce((sum, item) => sum + item.spend, 0);
                          const totalSales = adsetsData.today.reduce((sum, item) => sum + (item.spend / item.cpa || 0), 0);
                          return formatCurrency(totalSales > 0 ? totalSpend / totalSales : 0);
                        })()}
                      </TableCell>
                      <TableCell>
                        {formatNumber(adsetsData.today.reduce((sum, item) => sum + item.clicks, 0))}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalImpressions = adsetsData.today.reduce((sum, item) => sum + (item.clicks * 100 / item.ctr || 0), 0);
                          const totalClicks = adsetsData.today.reduce((sum, item) => sum + item.clicks, 0);
                          return formatPercentage(totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0);
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalSpend = adsetsData.today.reduce((sum, item) => sum + item.spend, 0);
                          const totalClicks = adsetsData.today.reduce((sum, item) => sum + item.clicks, 0);
                          return formatCurrency(totalClicks > 0 ? totalSpend / totalClicks : 0);
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalSpend = adsetsData.today.reduce((sum, item) => sum + item.spend, 0);
                          const totalImpressions = adsetsData.today.reduce((sum, item) => sum + (item.clicks * 100 / item.ctr || 0), 0);
                          return formatCurrency(totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0);
                        })()}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(adsetsData.today.reduce((sum, item) => sum + item.revenue, 0))}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(adsetsData.today.reduce((sum, item) => sum + item.profit, 0))}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalSpend = adsetsData.today.reduce((sum, item) => sum + item.spend, 0);
                          const totalRevenue = adsetsData.today.reduce((sum, item) => sum + item.revenue, 0);
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
                  <p className="text-muted-foreground mb-2">Nenhum conjunto encontrado para hoje</p>
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