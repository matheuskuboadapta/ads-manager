import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export const CopyButton = ({ text, className = "" }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar para o clipboard:', error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={`h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity ${className}`}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
};