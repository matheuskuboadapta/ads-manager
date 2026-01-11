import { useEffect } from 'react';

interface UseKeyboardNavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  enabled?: boolean;
}

// Define the tab order for navigation
const TAB_ORDER = ['home', 'accounts', 'campaigns', 'adsets', 'ads', 'rules'];

export function useKeyboardNavigation({ 
  currentTab, 
  onTabChange, 
  enabled = true 
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    if (!enabled || !currentTab) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contenteditable element
      const target = event.target as HTMLElement;
      const isInputElement = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInputElement) return;

      const currentIndex = TAB_ORDER.indexOf(currentTab);
      if (currentIndex === -1) return;

      // Handle 'A' key - navigate left
      if (event.key === 'a' || event.key === 'A') {
        event.preventDefault();
        const previousIndex = currentIndex - 1;
        if (previousIndex >= 0) {
          const previousTab = TAB_ORDER[previousIndex];
          console.log(`Navegando para a esquerda: ${currentTab} → ${previousTab}`);
          onTabChange(previousTab);
        }
      }

      // Handle 'D' key - navigate right
      if (event.key === 'd' || event.key === 'D') {
        event.preventDefault();
        const nextIndex = currentIndex + 1;
        if (nextIndex < TAB_ORDER.length) {
          const nextTab = TAB_ORDER[nextIndex];
          console.log(`Navegando para a direita: ${currentTab} → ${nextTab}`);
          onTabChange(nextTab);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentTab, onTabChange, enabled]);

  // Return the current tab index and total tabs for potential UI indicators
  return {
    currentIndex: TAB_ORDER.indexOf(currentTab),
    totalTabs: TAB_ORDER.length,
    tabOrder: TAB_ORDER,
  };
}

