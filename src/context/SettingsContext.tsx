import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AppSettings } from '../types';

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetData: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  hourly_rate: 15.00,
  currency_symbol: '$',
  pay_period: 'weekly',
  paid_breaks: false,
  theme: 'light',
  gemini_api_key: ''
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('@shiftlog/settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const merged = { ...defaultSettings, ...parsed }; // Ensure backwards compat for theme
        setSettings(merged);
        document.documentElement.setAttribute('data-theme', merged.theme);
      } catch (e) {
        console.error("Failed to parse settings", e);
        document.documentElement.setAttribute('data-theme', defaultSettings.theme);
      }
    } else {
      document.documentElement.setAttribute('data-theme', defaultSettings.theme);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }, [settings.theme, isLoaded]);

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem('@shiftlog/settings', JSON.stringify(next));
      return next;
    });
  };

  const resetData = async () => {
    const { supabase } = await import('../supabase');
    const { data } = await supabase.auth.getUser();
    if (data?.user?.id) {
      // Deleting shifts automatically cascades and deletes breaks
      await supabase.from('shifts').delete().eq('user_id', data.user.id);
    }
    localStorage.removeItem('@shiftlog/settings');
    setSettings(defaultSettings);
  };

  if (!isLoaded) return null; // or a loader

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetData }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
