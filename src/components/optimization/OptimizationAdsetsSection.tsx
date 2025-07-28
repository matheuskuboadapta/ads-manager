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
      <Card>
        <CardHeader>
          <CardTitle>Conjuntos de Anúncios</CardTitle>
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
                    <TableHead className="text-xs">Conjunto</TableHead>
                    <TableHead className="text-xs">Gasto</TableHead>
                    <TableHead className="text-xs">CPA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adsetsData.today.map((adset, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs">{adset.name}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(adset.spend)}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(adset.cpa)}</TableCell>
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
                    <TableHead className="text-xs">Conjunto</TableHead>
                    <TableHead className="text-xs">Gasto</TableHead>
                    <TableHead className="text-xs">CPA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adsetsData.last3Days.map((adset, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs">{adset.name}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(adset.spend)}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(adset.cpa)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Main adsets table */}
      <div className="col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Conjuntos de Anúncios - Últimos {dateRange} dias</CardTitle>
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
                  {adsetsData.main.map((adset, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant={adset.status === 'ACTIVE' ? 'default' : 'secondary'}>
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
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}