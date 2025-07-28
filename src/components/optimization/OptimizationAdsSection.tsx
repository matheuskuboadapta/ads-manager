import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useOptimizationData } from '@/hooks/useOptimizationData';
import { formatCurrency, formatPercentage, formatNumber } from '@/utils/formatters';

interface OptimizationAdsSectionProps {
  dateRange: number;
}

export function OptimizationAdsSection({ dateRange }: OptimizationAdsSectionProps) {
  const { adsData, isLoading } = useOptimizationData('ads', dateRange);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Anúncios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Left side - Today's data */}
      <div className="space-y-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Hoje</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Anúncio</TableHead>
                    <TableHead className="text-xs">Gasto</TableHead>
                    <TableHead className="text-xs">CPA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adsData.today.map((ad, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs">{ad.name}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(ad.spend)}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(ad.cpa)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Últimos 3 dias</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[200px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Anúncio</TableHead>
                    <TableHead className="text-xs">Gasto</TableHead>
                    <TableHead className="text-xs">CPA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adsData.last3Days.map((ad, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs">{ad.name}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(ad.spend)}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(ad.cpa)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Main ads table */}
      <div className="col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Anúncios - Últimos {dateRange} dias</CardTitle>
          </CardHeader>
          <CardContent>
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
                  {adsData.main.map((ad, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant={ad.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {ad.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{ad.name}</TableCell>
                      <TableCell>{formatCurrency(ad.budget)}</TableCell>
                      <TableCell>{formatCurrency(ad.spend)}</TableCell>
                      <TableCell>{formatCurrency(ad.cpa)}</TableCell>
                      <TableCell>{formatNumber(ad.clicks)}</TableCell>
                      <TableCell>{formatPercentage(ad.ctr)}</TableCell>
                      <TableCell>{formatCurrency(ad.cpc)}</TableCell>
                      <TableCell>{formatCurrency(ad.cpm)}</TableCell>
                      <TableCell>{formatCurrency(ad.revenue)}</TableCell>
                      <TableCell>{formatCurrency(ad.profit)}</TableCell>
                      <TableCell>{formatPercentage(ad.roas)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}