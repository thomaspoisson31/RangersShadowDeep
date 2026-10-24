import { create } from 'zustand';
import type { LLMSettings } from '../types/gameState';

const SETTINGS_KEY = 'rosd_vtt_llm_settings';

const defaultSettings: LLMSettings = {
  provider: 'openai',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
  temperature: 0.5,
  enabled: true,
};

interface SettingsState {
  settings: LLMSettings;
  updateSettings: (partial: Partial<LLMSettings>) => void;
  resetSettings: () => void;
}

const getItem = (key: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return null;
};

const setItem = (key: string, value: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value);
  }
};

const removeItem = (key: string) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(key);
  }
};

const loadSavedSettings = (): LLMSettings => {
  try {
    const saved = getItem(SETTINGS_KEY);
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
  return defaultSettings;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: loadSavedSettings(),
  updateSettings: (partial) => {
    set((state) => {
      const next = { ...state.settings, ...partial };
      try {
        setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save settings', e);
      }
      return { settings: next };
    });
  },
  resetSettings: () => {
    removeItem(SETTINGS_KEY);
    set({ settings: defaultSettings });
  },
}));
