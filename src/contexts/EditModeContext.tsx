import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface EditModeContextType {
  isEditMode: boolean;
  toggleEditMode: () => void;
  setEditMode: (enabled: boolean) => void;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

interface EditModeProviderProps {
  children: ReactNode;
}

export function EditModeProvider({ children }: EditModeProviderProps) {
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Load edit mode from localStorage on mount
  useEffect(() => {
    const savedEditMode = localStorage.getItem('adapta-edit-mode');
    if (savedEditMode !== null) {
      setIsEditMode(JSON.parse(savedEditMode));
    }
  }, []);

  const toggleEditMode = () => {
    const newMode = !isEditMode;
    setIsEditMode(newMode);
    localStorage.setItem('adapta-edit-mode', JSON.stringify(newMode));
  };

  const setEditMode = (enabled: boolean) => {
    setIsEditMode(enabled);
    localStorage.setItem('adapta-edit-mode', JSON.stringify(enabled));
  };

  const value = {
    isEditMode,
    toggleEditMode,
    setEditMode,
  };

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode(): EditModeContextType {
  const context = useContext(EditModeContext);
  if (context === undefined) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return context;
}
