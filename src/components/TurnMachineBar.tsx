import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Shield, FastForward, Bot, ScrollText, Users } from 'lucide-react';

export const TurnMachineBar: React.FC = () => {
  const {
    turnNumber,
    currentPhase,
    activeScenario,
    advancePhase,
    executeAllCreaturesAI,
  } = useGameStore();

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'ranger': return 'text-amber-400 bg-amber-950/80 border-amber-800';
      case 'creature': return 'text-rose-400 bg-rose-950/80 border-rose-800';
      case 'companion': return 'text-blue-400 bg-blue-950/80 border-blue-800';
      case 'event': return 'text-purple-400 bg-purple-950/80 border-purple-800';
      default: return 'text-stone-300 bg-stone-900 border-stone-800';
    }
  };

  const getPhaseName = (phase: string) => {
    switch (phase) {
      case 'ranger': return 'Phase 1: Rangers Phase';
      case 'creature': return 'Phase 2: Creatures Phase (AI)';
      case 'companion': return 'Phase 3: Companions Phase';
      case 'event': return 'Phase 4: Event Phase';
      default: return phase;
    }
  };

  return (
    <div className="bg-stone-900/90 border-b border-amber-900/40 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md z-30">
      {/* Left: Active Scenario Info */}
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-amber-500" />
        <div>
          <h1 className="text-sm font-bold text-amber-300">
            {activeScenario ? activeScenario.title : 'Rangers of Shadow Deep VTT'}
          </h1>
          <p className="text-[11px] text-stone-400">
            Turn <strong className="text-stone-200">{turnNumber}</strong> — Automated Rules Engine
          </p>
        </div>
      </div>

      {/* Middle: Active Phase Pill Badge */}
      <div className="flex items-center gap-2">
        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 shadow-lg ${getPhaseColor(currentPhase)}`}>
          {currentPhase === 'creature' && <Bot className="w-4 h-4 animate-pulse text-rose-400" />}
          {currentPhase === 'ranger' && <Users className="w-4 h-4 text-amber-400" />}
          {currentPhase === 'event' && <ScrollText className="w-4 h-4 text-purple-400" />}
          {getPhaseName(currentPhase)}
        </span>
      </div>

      {/* Right: Phase Controls */}
      <div className="flex items-center gap-2">
        {currentPhase === 'creature' && (
          <button
            onClick={executeAllCreaturesAI}
            className="px-3 py-1.5 bg-rose-900/80 hover:bg-rose-800 border border-rose-700/60 text-rose-100 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Bot className="w-3.5 h-3.5" /> Auto-Execute AI
          </button>
        )}

        <button
          onClick={advancePhase}
          className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 text-stone-100 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-lg"
        >
          <span>Next Phase</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
