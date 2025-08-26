
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const getCPAColorClass = (cpa: number, allCPAs: number[]): string => {
  if (allCPAs.length === 0 || cpa === 0) return '';
  
  const threshold = 550; // R$550 threshold
  
  if (cpa <= threshold) {
    // Green tones: CPA <= R$550 (good performance)
    const distanceFromThreshold = threshold - cpa;
    const maxDistance = threshold; // Maximum possible distance (when CPA = 0)
    const intensity = Math.min(1, distanceFromThreshold / maxDistance);
    
    if (intensity <= 0.2) return 'bg-green-50';
    if (intensity <= 0.4) return 'bg-green-100';
    if (intensity <= 0.6) return 'bg-green-200';
    if (intensity <= 0.8) return 'bg-green-300';
    return 'bg-green-400';
  } else {
    // Red tones: CPA > R$550 (bad performance)
    const distanceFromThreshold = cpa - threshold;
    const maxDistance = Math.max(...allCPAs) - threshold;
    const intensity = Math.min(1, distanceFromThreshold / maxDistance);
    
    if (intensity <= 0.2) return 'bg-red-50';
    if (intensity <= 0.4) return 'bg-red-100';
    if (intensity <= 0.6) return 'bg-red-200';
    if (intensity <= 0.8) return 'bg-red-300';
    return 'bg-red-400';
  }
};

/**
 * Quebra um texto longo em linhas menores, respeitando palavras completas
 * @param text - O texto a ser formatado
 * @param maxLength - O comprimento máximo de cada linha (padrão: 80 caracteres)
 * @returns O texto formatado com quebras de linha
 */
export function wrapText(text: string, maxLength: number = 80): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    // Se a palavra sozinha é maior que o limite, quebra ela
    if (word.length > maxLength) {
      if (currentLine) {
        lines.push(currentLine.trim());
        currentLine = '';
      }
      
      // Quebra a palavra longa
      for (let i = 0; i < word.length; i += maxLength) {
        lines.push(word.slice(i, i + maxLength));
      }
      continue;
    }

    // Verifica se adicionar a palavra excederia o limite
    if ((currentLine + ' ' + word).length > maxLength) {
      if (currentLine) {
        lines.push(currentLine.trim());
        currentLine = word;
      } else {
        // Se a linha está vazia, adiciona a palavra mesmo que seja longa
        lines.push(word);
      }
    } else {
      currentLine += (currentLine ? ' ' : '') + word;
    }
  }

  // Adiciona a última linha se houver conteúdo
  if (currentLine) {
    lines.push(currentLine.trim());
  }

  return lines.join('\n');
}
