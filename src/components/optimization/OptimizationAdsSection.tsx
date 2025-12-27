import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useOptimizationData } from '@/hooks/useOptimizationData';
import { formatCurrency, formatCurrencyNoDecimals, formatPercentage, formatNumber } from '@/utils/formatters';

interface OptimizationAdsSectionProps {
  dateRange: number;
}

export function OptimizationAdsSection({ dateRange }: OptimizationAdsSectionProps) {
  const { adsData, isLoading } = useOptimizationData('ads', dateRange);

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
              <div className="text-center text-muted-foreground">Carregando anúncios...</div>
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
              {adsData.last3Days.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Anúncio</TableHead>
                        <TableHead className="text-xs">Gasto</TableHead>
                        <TableHead className="text-xs">CPA</TableHead>
                        <TableHead className="text-xs">Clicks</TableHead>
                        <TableHead className="text-xs">CTR</TableHead>
                        <TableHead className="text-xs">Retorno</TableHead>
                        <TableHead className="text-xs">ROAS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adsData.last3Days.map((ad, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs">{ad.name}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(ad.spend)}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(ad.cpa)}</TableCell>
                          <TableCell className="text-xs">{formatNumber(ad.clicks)}</TableCell>
                          <TableCell className="text-xs">{formatPercentage(ad.ctr)}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(ad.revenue)}</TableCell>
                          <TableCell className="text-xs">{formatPercentage(ad.roas)}</TableCell>
                        </TableRow>
                      ))}
                      {/* Total row */}
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell className="text-xs">TOTAL</TableCell>
                        <TableCell className="text-xs">
                          {formatCurrency(adsData.last3Days.reduce((sum, item) => sum + item.spend, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalSpend = adsData.last3Days.reduce((sum, item) => sum + item.spend, 0);
                            const totalSales = adsData.last3Days.reduce((sum, item) => sum + (item.spend / item.cpa || 0), 0);
                            return formatCurrency(totalSales > 0 ? totalSpend / totalSales : 0);
                          })()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatNumber(adsData.last3Days.reduce((sum, item) => sum + item.clicks, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalImpressions = adsData.last3Days.reduce((sum, item) => sum + (item.clicks * 100 / item.ctr || 0), 0);
                            const totalClicks = adsData.last3Days.reduce((sum, item) => sum + item.clicks, 0);
                            return formatPercentage(totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0);
                          })()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatCurrency(adsData.last3Days.reduce((sum, item) => sum + item.revenue, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalSpend = adsData.last3Days.reduce((sum, item) => sum + item.spend, 0);
                            const totalRevenue = adsData.last3Days.reduce((sum, item) => sum + item.revenue, 0);
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
              {adsData.main.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Anúncio</TableHead>
                        <TableHead className="text-xs">Gasto</TableHead>
                        <TableHead className="text-xs">CPA</TableHead>
                        <TableHead className="text-xs">Clicks</TableHead>
                        <TableHead className="text-xs">CTR</TableHead>
                        <TableHead className="text-xs">Retorno</TableHead>
                        <TableHead className="text-xs">ROAS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adsData.main.map((ad, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-xs">{ad.name}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(ad.spend)}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(ad.cpa)}</TableCell>
                          <TableCell className="text-xs">{formatNumber(ad.clicks)}</TableCell>
                          <TableCell className="text-xs">{formatPercentage(ad.ctr)}</TableCell>
                          <TableCell className="text-xs">{formatCurrency(ad.revenue)}</TableCell>
                          <TableCell className="text-xs">{formatPercentage(ad.roas)}</TableCell>
                        </TableRow>
                      ))}
                      {/* Total row */}
                      <TableRow className="font-semibold bg-muted/50">
                        <TableCell className="text-xs">TOTAL</TableCell>
                        <TableCell className="text-xs">
                          {formatCurrency(adsData.main.reduce((sum, item) => sum + item.spend, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalSpend = adsData.main.reduce((sum, item) => sum + item.spend, 0);
                            const totalSales = adsData.main.reduce((sum, item) => sum + (item.spend / item.cpa || 0), 0);
                            return formatCurrency(totalSales > 0 ? totalSpend / totalSales : 0);
                          })()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatNumber(adsData.main.reduce((sum, item) => sum + item.clicks, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalImpressions = adsData.main.reduce((sum, item) => sum + (item.clicks * 100 / item.ctr || 0), 0);
                            const totalClicks = adsData.main.reduce((sum, item) => sum + item.clicks, 0);
                            return formatPercentage(totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0);
                          })()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatCurrency(adsData.main.reduce((sum, item) => sum + item.revenue, 0))}
                        </TableCell>
                        <TableCell className="text-xs">
                          {(() => {
                            const totalSpend = adsData.main.reduce((sum, item) => sum + item.spend, 0);
                            const totalRevenue = adsData.main.reduce((sum, item) => sum + item.revenue, 0);
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

      {/* Right side - Today's ads table */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Anúncios - Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {adsData.today.length > 0 ? (
              <div className="overflow-auto max-h-[450px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Anúncio</TableHead>
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
                    {adsData.today.map((ad, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant={ad.status === 'ATIVO' ? 'default' : 'secondary'}>
                            {ad.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{ad.name}</TableCell>
                        <TableCell>{formatCurrency(ad.budget)}</TableCell>
                        <TableCell>{formatCurrency(ad.spend)}</TableCell>
                        <TableCell>{formatCurrency(ad.cpa)}</TableCell>
                        <TableCell>{formatNumber(ad.clicks)}</TableCell>
                        <TableCell>{formatPercentage(ad.ctr)}</TableCell>
                        <TableCell>{formatCurrencyNoDecimals(ad.cpc)}</TableCell>
                        <TableCell>{formatCurrencyNoDecimals(ad.cpm)}</TableCell>
                        <TableCell>{formatCurrency(ad.revenue)}</TableCell>
                        <TableCell>{formatCurrency(ad.profit)}</TableCell>
                        <TableCell>{formatPercentage(ad.roas)}</TableCell>
                      </TableRow>
                    ))}
                    {/* Total row */}
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell>-</TableCell>
                      <TableCell>TOTAL</TableCell>
                      <TableCell>
                        {formatCurrency(adsData.today.reduce((sum, item) => sum + item.budget, 0))}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(adsData.today.reduce((sum, item) => sum + item.spend, 0))}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalSpend = adsData.today.reduce((sum, item) => sum + item.spend, 0);
                          const totalSales = adsData.today.reduce((sum, item) => sum + (item.spend / item.cpa || 0), 0);
                          return formatCurrency(totalSales > 0 ? totalSpend / totalSales : 0);
                        })()}
                      </TableCell>
                      <TableCell>
                        {formatNumber(adsData.today.reduce((sum, item) => sum + item.clicks, 0))}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalImpressions = adsData.today.reduce((sum, item) => sum + (item.clicks * 100 / item.ctr || 0), 0);
                          const totalClicks = adsData.today.reduce((sum, item) => sum + item.clicks, 0);
                          return formatPercentage(totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0);
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalSpend = adsData.today.reduce((sum, item) => sum + item.spend, 0);
                          const totalClicks = adsData.today.reduce((sum, item) => sum + item.clicks, 0);
                          return formatCurrency(totalClicks > 0 ? totalSpend / totalClicks : 0);
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalSpend = adsData.today.reduce((sum, item) => sum + item.spend, 0);
                          const totalImpressions = adsData.today.reduce((sum, item) => sum + (item.clicks * 100 / item.ctr || 0), 0);
                          return formatCurrency(totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0);
                        })()}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(adsData.today.reduce((sum, item) => sum + item.revenue, 0))}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(adsData.today.reduce((sum, item) => sum + item.profit, 0))}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const totalSpend = adsData.today.reduce((sum, item) => sum + item.spend, 0);
                          const totalRevenue = adsData.today.reduce((sum, item) => sum + item.revenue, 0);
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
                  <p className="text-muted-foreground mb-2">Nenhum anúncio encontrado para hoje</p>
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