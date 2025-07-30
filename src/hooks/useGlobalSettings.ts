import { useState, useCallback, useEffect } from 'react';
import { DateFilter } from '@/components/ads-manager/FilterBar';

interface GlobalSettings {
  dateFilter: DateFilter | null;
  nameFilter: string;
  statusFilter: string;
}

const DEFAULT_SETTINGS: GlobalSettings = {
  dateFilter: null, // Deixar null para que useAdsData use seu próprio filtro padrão
  nameFilter: '',
  statusFilter: 'all'
};

const STORAGE_KEY = 'ads-manager-global-settings';

export const useGlobalSettings = () => {
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);

  // Carregar configurações do localStorage ao inicializar
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        // Converter strings de data de volta para objetos Date
        if (parsed.dateFilter) {
          parsed.dateFilter.from = new Date(parsed.dateFilter.from);
          parsed.dateFilter.to = new Date(parsed.dateFilter.to);
        }
        setSettings(parsed);
        console.log('Loaded settings from localStorage:', parsed);
      } else {
        console.log('No saved settings found, using defaults:', DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }, []);

  // Salvar configurações no localStorage sempre que mudarem
  const saveSettings = useCallback((newSettings: GlobalSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      console.log('Saved new settings:', newSettings);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  }, []);

  const updateDateFilter = useCallback((dateFilter: DateFilter | null) => {
    console.log('Updating date filter:', dateFilter);
    saveSettings({ ...settings, dateFilter });
  }, [settings, saveSettings]);

  const updateNameFilter = useCallback((nameFilter: string) => {
    saveSettings({ ...settings, nameFilter });
  }, [settings, saveSettings]);

  const updateStatusFilter = useCallback((statusFilter: string) => {
    saveSettings({ ...settings, statusFilter });
  }, [settings, saveSettings]);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateDateFilter,
    updateNameFilter,
    updateStatusFilter,
    resetSettings
  };
};