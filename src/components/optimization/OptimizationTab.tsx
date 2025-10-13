import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';
import { OptimizationCampaignsSection } from './OptimizationCampaignsSection';
import { OptimizationAdsetsSection } from './OptimizationAdsetsSection';
import { OptimizationAdsSection } from './OptimizationAdsSection';

export function OptimizationTab() {
  const [dateRange, setDateRange] = useState('7'); // Default to 7 days

  const dateRangeOptions = [
    { value: '3', label: '3 dias' },
    { value: '7', label: '7 dias' },
    { value: '14', label: '14 dias' },
    { value: '30', label: '30 dias' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with date selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <CardTitle>Otimização Comparativa</CardTitle>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-muted-foreground">
                Período comparativo
              </Badge>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dateRangeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Compare o desempenho atual com os últimos 3 dias e o período selecionado.
          </p>
        </CardContent>
      </Card>

      {/* Campaigns Section */}
      <OptimizationCampaignsSection dateRange={parseInt(dateRange)} />

      {/* Adsets Section */}
      <OptimizationAdsetsSection dateRange={parseInt(dateRange)} />

      {/* Ads Section */}
      <OptimizationAdsSection dateRange={parseInt(dateRange)} />
    </div>
  );
}