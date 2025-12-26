
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

/**
 * Obtém as 3 primeiras letras do mês atual em português
 */
export function getCurrentMonthPrefix(): string {
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  const currentMonth = new Date().getMonth();
  return months[currentMonth];
}

/**
 * Parseia um valor de grupo de anúncios no formato [Mês] [Letra] [Número]
 * Ex: "Dez F1" -> { month: "Dez", letter: "F", number: 1 }
 */
export function parseAdsetGroupName(value: string): { month: string; letter: string; number: number } | null {
  const match = value.match(/^([A-Za-z]{3})\s+([A-Z])(\d+)$/);
  if (!match) return null;
  
  // Capitaliza a primeira letra do mês (Dez, Jan, etc.)
  const month = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
  
  return {
    month: month,
    letter: match[2],
    number: parseInt(match[3], 10)
  };
}

/**
 * Gera o próximo valor de grupo de anúncios baseado no último valor usado
 * Formato: [Mês] [Letra] [Número]
 * - Número vai de 1 a 9
 * - Quando passa de 9, volta para 1 e incrementa a letra
 * - Se mudar de mês, começa do zero com o novo mês
 */
export function getNextAdsetGroupName(lastValue: string | null): string {
  const currentMonth = getCurrentMonthPrefix();
  
  // Se não há último valor ou o último valor é de outro mês, começa do zero
  if (!lastValue) {
    return `${currentMonth} A1`;
  }
  
  const parsed = parseAdsetGroupName(lastValue);
  if (!parsed) {
    // Se não conseguiu parsear, começa do zero
    return `${currentMonth} A1`;
  }
  
  // Se o mês mudou, começa do zero com o novo mês
  if (parsed.month !== currentMonth) {
    return `${currentMonth} A1`;
  }
  
  // Incrementa o número
  let nextNumber = parsed.number + 1;
  let nextLetter = parsed.letter;
  
  // Se passou de 9, volta para 1 e incrementa a letra
  if (nextNumber > 9) {
    nextNumber = 1;
    // Incrementa a letra (A -> B -> C -> ... -> Z)
    const letterCode = nextLetter.charCodeAt(0);
    if (letterCode >= 90) { // Se for Z, volta para A
      nextLetter = 'A';
    } else {
      nextLetter = String.fromCharCode(letterCode + 1);
    }
  }
  
  return `${currentMonth} ${nextLetter}${nextNumber}`;
}

/**
 * Salva o último valor usado do grupo de anúncios no localStorage
 */
export function saveLastAdsetGroupName(value: string): void {
  try {
    localStorage.setItem('lastAdsetGroupName', value);
  } catch (error) {
    console.error('Erro ao salvar último valor do grupo de anúncios:', error);
  }
}

/**
 * Carrega o último valor usado do grupo de anúncios do localStorage
 */
export function getLastAdsetGroupName(): string | null {
  try {
    return localStorage.getItem('lastAdsetGroupName');
  } catch (error) {
    console.error('Erro ao carregar último valor do grupo de anúncios:', error);
    return null;
  }
}
