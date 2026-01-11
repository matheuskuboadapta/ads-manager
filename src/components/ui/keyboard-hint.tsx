import { Command } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface KeyboardHintProps {
  currentTab: string;
  tabOrder: string[];
}

export function KeyboardHint({ currentTab, tabOrder }: KeyboardHintProps) {
  const currentIndex = tabOrder.indexOf(currentTab);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < tabOrder.length - 1;

  if (!hasPrevious && !hasNext) {
    return null;
  }

  return (
    <Badge 
      variant="outline" 
      className="flex items-center gap-2"
      title="Use as teclas A e D para navegar entre as abas"
    >
      <Command className="h-3 w-3" />
      <span className="text-xs">
        {hasPrevious && <kbd className="px-1 py-0.5 text-xs bg-muted rounded">A</kbd>}
        {hasPrevious && hasNext && <span className="mx-1">•</span>}
        {hasNext && <kbd className="px-1 py-0.5 text-xs bg-muted rounded">D</kbd>}
      </span>
    </Badge>
  );
}
