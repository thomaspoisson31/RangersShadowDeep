import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { askAiGameMaster } from '../utils/llmClient';
import { Bot, Send, Sparkles, X, Settings } from 'lucide-react';

interface AiGameMasterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiGameMasterDrawer: React.FC<AiGameMasterDrawerProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const { activeScenario, tokens, logs, turnNumber, currentPhase, addLog } = useGameStore();
  const { settings } = useSettingsStore();

  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'ai',
      text: 'Greetings, Ranger! I am your AI Game Master & Tactical Arbitrator. Ask me to resolve ambiguous line-of-sight, clarify special rules, or describe the dark fantasy aftermath of combat.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  if (!isOpen) return null;

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    const responseText = await askAiGameMaster(
      textToSend,
      settings,
      activeScenario,
      tokens,
      logs,
      turnNumber,
      currentPhase
    );

    const aiMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      sender: 'ai',
      text: responseText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);

    // Also add to global action log
    addLog(`[AI GM Arbitrator]: ${responseText.substring(0, 120)}...`, 'llm');
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-96 bg-stone-950 border-l border-amber-900/50 shadow-2xl flex flex-col font-sans text-xs text-stone-200">

      {/* Header */}
      <div className="p-4 bg-stone-900 border-b border-amber-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="font-bold text-amber-400 text-sm">Game Master AI Arbitrator</h3>
            <p className="text-[10px] text-stone-400">{settings.provider.toUpperCase()} ({settings.model})</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSettings}
            className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded"
            title="Configure AI Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 bg-stone-900/50 border-b border-stone-800 flex gap-2 overflow-x-auto">
        <button
          onClick={() => handleSendQuery('Arbitrate Line of Sight & Cover for closest heroes and monsters.')}
          className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 rounded border border-amber-800/60 font-semibold whitespace-nowrap flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" /> Arbitrate Line of Sight
        </button>
        <button
          onClick={() => handleSendQuery('Narrate an atmospheric dark fantasy description of current battlefield state.')}
          className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 rounded border border-amber-800/60 font-semibold whitespace-nowrap flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" /> Narrate Atmosphere
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg border leading-relaxed space-y-1 ${
              msg.sender === 'user'
                ? 'bg-amber-950/50 border-amber-800/60 ml-6 text-amber-100'
                : 'bg-stone-900 border-stone-800 mr-4 text-stone-200'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono">
              <span className="font-bold uppercase">{msg.sender === 'user' ? 'You' : 'AI Game Master'}</span>
              <span>{msg.timestamp}</span>
            </div>
            <div className="whitespace-pre-wrap">{msg.text}</div>
          </div>
        ))}
        {loading && (
          <div className="p-3 bg-stone-900 rounded-lg border border-stone-800 text-stone-400 animate-pulse flex items-center gap-2">
            <Bot className="w-4 h-4 text-amber-500 animate-spin" />
            <span>Consulting the Shadow Deep rules & outcome...</span>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-3 bg-stone-900 border-t border-amber-900/40 flex items-center gap-2">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
          placeholder="Ask a rules question or ask for arbitration..."
          className="flex-1 bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-100 text-xs outline-none focus:border-amber-500"
        />
        <button
          onClick={() => handleSendQuery()}
          disabled={!inputQuery.trim() || loading}
          className="p-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-stone-100 font-bold rounded flex items-center justify-center transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
