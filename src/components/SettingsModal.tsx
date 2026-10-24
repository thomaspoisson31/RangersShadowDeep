import React, { useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { Settings, Key, Sliders, Globe, Eye, EyeOff, Save, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetSettings } = useSettingsStore();
  const [showKey, setShowKey] = useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="parchment-card w-full max-w-lg rounded-xl overflow-hidden border border-amber-700/50 shadow-2xl space-y-4 p-6">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/40 pb-3">
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" /> AI Game Master Settings
          </h2>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-amber-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Selector */}
        <div>
          <label className="text-xs font-semibold text-amber-500 block mb-1">AI Provider</label>
          <select
            value={settings.provider}
            onChange={(e) => {
              const provider = e.target.value as any;
              let defaultModel = 'gpt-4o';
              if (provider === 'anthropic') defaultModel = 'claude-3-5-sonnet-20241022';
              if (provider === 'google') defaultModel = 'gemini-1.5-pro';
              updateSettings({ provider, model: defaultModel });
            }}
            className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-100 font-medium outline-none text-sm"
          >
            <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
            <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
            <option value="google">Google Gemini (Gemini 1.5 Pro / Flash)</option>
            <option value="custom">Custom OpenAI-Compatible API</option>
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="text-xs font-semibold text-amber-500 block mb-1 flex items-center gap-1">
            <Key className="w-3.5 h-3.5" /> API Key
          </label>
          <div className="relative flex items-center">
            <input
              type={showKey ? 'text' : 'password'}
              value={settings.apiKey}
              onChange={(e) => updateSettings({ apiKey: e.target.value })}
              placeholder="Paste your API Key here..."
              className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-100 font-mono text-xs outline-none focus:border-amber-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 text-stone-400 hover:text-stone-200"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-stone-500 mt-1">Your key is stored locally in your browser (localStorage) and never transmitted to external servers except direct provider endpoints.</p>
        </div>

        {/* Custom Base URL if custom */}
        {settings.provider === 'custom' && (
          <div>
            <label className="text-xs font-semibold text-amber-500 block mb-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Base API URL
            </label>
            <input
              type="text"
              value={settings.baseUrl || ''}
              onChange={(e) => updateSettings({ baseUrl: e.target.value })}
              placeholder="e.g. https://api.openai.com/v1"
              className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-100 text-xs font-mono outline-none focus:border-amber-500"
            />
          </div>
        )}

        {/* Model Name */}
        <div>
          <label className="text-xs font-semibold text-amber-500 block mb-1">Model Name</label>
          <input
            type="text"
            value={settings.model}
            onChange={(e) => updateSettings({ model: e.target.value })}
            placeholder="e.g. gpt-4o or claude-3-5-sonnet-20241022"
            className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-100 text-xs font-mono outline-none focus:border-amber-500"
          />
        </div>

        {/* Temperature */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-amber-500 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" /> Temperature: {settings.temperature}
            </label>
            <span className="text-[10px] text-stone-400">
              {settings.temperature < 0.4 ? 'Strict Rules' : settings.temperature > 0.6 ? 'Creative Story' : 'Balanced'}
            </span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={settings.temperature}
            onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center pt-2 border-t border-amber-900/30">
          <button
            onClick={resetSettings}
            className="text-xs text-stone-500 hover:text-stone-300 underline"
          >
            Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-stone-100 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-4 h-4" /> Save & Close
          </button>
        </div>

      </div>
    </div>
  );
};
