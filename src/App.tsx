import { useState, useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { useCompanyStore } from './store/useCompanyStore';
import { getAllMissions, getScenario } from './utils/gameDataLoader';
import { VttCanvas } from './components/VttCanvas';
import { TurnMachineBar } from './components/TurnMachineBar';
import { ActionControlsDrawer } from './components/ActionControlsDrawer';
import { CompanyRosterModal } from './components/CompanyRosterModal';
import { SettingsModal } from './components/SettingsModal';
import { AiGameMasterDrawer } from './components/AiGameMasterDrawer';
import { Shield, Users, Settings, Bot, Compass, Play } from 'lucide-react';

export function App() {
  const missions = getAllMissions();
  const { loadScenario, activeMissionIndex, activeScenarioIndex } = useGameStore();
  const { ranger, companions } = useCompanyStore();

  const [selectedMissionIdx, setSelectedMissionIdx] = useState<number>(activeMissionIndex);
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState<number>(activeScenarioIndex);

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);

  // Auto load default Mission 1 Scenario 1 at start
  useEffect(() => {
    const sc = getScenario(0, 1);
    if (sc) {
      loadScenario(0, 1, sc, ranger.name, companions);
    }
  }, []);

  const handleStartScenario = () => {
    const sc = getScenario(selectedMissionIdx, selectedScenarioIdx);
    if (sc) {
      loadScenario(selectedMissionIdx, selectedScenarioIdx, sc, ranger.name, companions);
    }
  };

  const activeMissionObj = missions[selectedMissionIdx];
  const activeScenariosList = activeMissionObj?.scenarios || [];

  return (
    <div className="flex flex-col h-screen w-screen bg-stone-950 text-stone-200 overflow-hidden select-none">

      {/* Top Header Navigation */}
      <header className="bg-stone-900 border-b border-amber-900/40 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 z-40 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-950 border border-amber-800 rounded-lg text-amber-500 gold-glow">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold gold-text tracking-wide">Rangers of Shadow Deep</h1>
            <p className="text-[10px] text-stone-400">Solo Web Virtual Tabletop & AI Game Master</p>
          </div>
        </div>

        {/* Mission & Scenario Selector */}
        <div className="flex items-center gap-2 bg-stone-950 p-1.5 rounded-lg border border-amber-900/30 text-xs">
          <Compass className="w-4 h-4 text-amber-500 ml-1" />
          <select
            value={selectedMissionIdx}
            onChange={(e) => {
              const idx = Number(e.target.value);
              setSelectedMissionIdx(idx);
              const firstSc = missions[idx]?.scenarios[0];
              if (firstSc) setSelectedScenarioIdx(firstSc.scenario_index);
            }}
            className="bg-transparent text-stone-200 outline-none font-medium cursor-pointer"
          >
            {missions.map((m, idx) => (
              <option key={idx} value={idx} className="bg-stone-900 text-stone-200">
                {m.title}
              </option>
            ))}
          </select>

          <span className="text-stone-600">|</span>

          <select
            value={selectedScenarioIdx}
            onChange={(e) => setSelectedScenarioIdx(Number(e.target.value))}
            className="bg-transparent text-stone-200 outline-none font-medium cursor-pointer"
          >
            {activeScenariosList.map((sc) => (
              <option key={sc.scenario_index} value={sc.scenario_index} className="bg-stone-900 text-stone-200">
                {sc.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleStartScenario}
            className="px-3 py-1 bg-amber-700 hover:bg-amber-600 text-stone-100 font-bold rounded flex items-center gap-1 transition-colors"
          >
            <Play className="w-3 h-3 fill-stone-100" /> Instantiate
          </button>
        </div>

        {/* Actions Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCompanyModalOpen(true)}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-xs font-semibold text-amber-300 flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-4 h-4 text-amber-500" />
            <span>Company Roster ({companions.length + 1})</span>
          </button>

          <button
            onClick={() => setIsAiDrawerOpen(true)}
            className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-800 rounded-lg text-xs font-semibold text-amber-300 flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Bot className="w-4 h-4 text-amber-400" />
            <span>Demander à l'Arbitre IA</span>
          </button>

          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-stone-300 transition-colors"
            title="Settings & API Keys"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Turn Machine Status Bar */}
      <TurnMachineBar />

      {/* Main Workspace (VTT Canvas + Action Controls) */}
      <div className="flex-1 flex min-h-0 relative">
        <div className="flex-1 h-full relative">
          <VttCanvas />
        </div>
        <ActionControlsDrawer />
      </div>

      {/* Modals & Drawers */}
      <CompanyRosterModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <AiGameMasterDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        onOpenSettings={() => {
          setIsAiDrawerOpen(false);
          setIsSettingsModalOpen(true);
        }}
      />

    </div>
  );
}

export default App;
