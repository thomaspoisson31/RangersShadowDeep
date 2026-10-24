import { useState, useEffect, useRef } from 'react';
import { useGameStore } from './store/useGameStore';
import { useCompanyStore } from './store/useCompanyStore';
import { getAllMissions, getScenario } from './utils/gameDataLoader';
import { VttCanvas } from './components/VttCanvas';
import { TurnMachineBar } from './components/TurnMachineBar';
import { ActionControlsDrawer } from './components/ActionControlsDrawer';
import { CompanyRosterModal } from './components/CompanyRosterModal';
import { SettingsModal } from './components/SettingsModal';
import { AiGameMasterDrawer } from './components/AiGameMasterDrawer';
import { GlobalRosterModal } from './components/GlobalRosterModal';
import {
  Shield,
  Users,
  Settings,
  Bot,
  Compass,
  Play,
  Download,
  Upload,
  Maximize2,
  Minimize2,
  Eye,
  ChevronUp,
  FileText,
} from 'lucide-react';

export function App() {
  const missions = getAllMissions();
  const { loadScenario, activeMissionIndex, activeScenarioIndex } = useGameStore();
  const { ranger, companions } = useCompanyStore();

  const [selectedMissionIdx, setSelectedMissionIdx] = useState<number>(activeMissionIndex);
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState<number>(activeScenarioIndex);

  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [isGlobalRosterOpen, setIsGlobalRosterOpen] = useState<boolean>(false);

  // Collapsible UI panels state (collapsed by default as requested in 1.1)
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(true);
  const [isTurnBarCollapsed, setIsTurnBarCollapsed] = useState<boolean>(true);
  const [isActionDrawerCollapsed, setIsActionDrawerCollapsed] = useState<boolean>(true);

  // Zen Mode state (1.2)
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  // 3D View angle state (3.1)
  const [is3dView, setIs3dView] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { exportGameState, importGameState, exportLogsToTxt } = useGameStore();

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

  const handleExportSave = () => {
    const jsonStr = exportGameState();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rosd-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSave = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        importGameState(content);
      }
    };
    reader.readAsText(file);
  };

  const handleExportLogs = () => {
    const logsTxt = exportLogsToTxt();
    const blob = new Blob([logsTxt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rosd-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-stone-950 text-stone-200 overflow-hidden select-none font-sans relative">

      {/* Zen Mode Floating Toggle Button */}
      <button
        onClick={() => setIsZenMode(!isZenMode)}
        className="fixed top-3 right-3 z-50 bg-stone-900/90 hover:bg-stone-800 text-amber-400 border border-amber-900/50 p-2 rounded-lg shadow-2xl backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-bold"
        title={isZenMode ? "Quitter le Mode Zen" : "Mode Zen (Maximiser la surface de jeu)"}
      >
        {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        <span>{isZenMode ? "Quitter Zen" : "Mode Zen"}</span>
      </button>

      {/* Top Header Navigation */}
      {!isZenMode && (
        <>
          {isHeaderCollapsed ? (
            <div className="bg-stone-900/80 border-b border-amber-900/30 px-4 py-1 flex items-center justify-between z-40 text-xs backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-amber-300">Rangers of Shadow Deep</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsGlobalRosterOpen(true)}
                  className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded border border-stone-700 text-[11px] flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" /> Stats Tokens
                </button>
                <button
                  onClick={() => setIsHeaderCollapsed(false)}
                  className="text-stone-400 hover:text-amber-400 px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-800 border border-stone-700"
                >
                  ▼ Menu En-tête
                </button>
              </div>
            </div>
          ) : (
            <header className="bg-stone-900 border-b border-amber-900/40 px-6 py-2 flex flex-wrap items-center justify-between gap-4 z-40 shadow-xl relative">
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

              {/* Actions Navigation & Save/Load */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsGlobalRosterOpen(true)}
                  className="px-2.5 py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-800 rounded-lg text-xs font-semibold text-amber-300 flex items-center gap-1.5 transition-colors"
                  title="Voir toutes les statistiques de tous les tokens"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Stats Tokens</span>
                </button>

                <button
                  onClick={() => setIsCompanyModalOpen(true)}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-xs font-semibold text-amber-300 flex items-center gap-1.5 transition-colors"
                >
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>Company ({companions.length + 1})</span>
                </button>

                <button
                  onClick={() => setIsAiDrawerOpen(true)}
                  className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-800 rounded-lg text-xs font-semibold text-amber-300 flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <Bot className="w-4 h-4 text-amber-400" />
                  <span>Arbitre IA</span>
                </button>

                {/* Save / Load Buttons */}
                <button
                  onClick={handleExportSave}
                  className="p-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-amber-400"
                  title="Enregistrer la partie (Export JSON)"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-amber-400"
                  title="Charger une partie (Import JSON)"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportSave}
                  accept=".json"
                  className="hidden"
                />

                <button
                  onClick={handleExportLogs}
                  className="p-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-stone-300"
                  title="Exporter les logs d'évènements (TXT)"
                >
                  <FileText className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="p-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg text-stone-300 transition-colors"
                  title="Settings & API Keys"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsHeaderCollapsed(true)}
                  className="p-1.5 hover:bg-stone-800 rounded text-stone-400"
                  title="Masquer le menu"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </header>
          )}

          {/* Turn Machine Status Bar */}
          <TurnMachineBar
            isCollapsed={isTurnBarCollapsed}
            onToggleCollapse={() => setIsTurnBarCollapsed(!isTurnBarCollapsed)}
          />
        </>
      )}

      {/* Main Workspace (VTT Canvas + Action Controls) */}
      <div className="flex-1 flex min-h-0 relative">
        <div className="flex-1 h-full relative">
          <VttCanvas
            is3dView={is3dView}
            onToggle3dView={() => setIs3dView(!is3dView)}
          />
        </div>
        {!isZenMode && (
          <ActionControlsDrawer
            isCollapsed={isActionDrawerCollapsed}
            onToggleCollapse={() => setIsActionDrawerCollapsed(!isActionDrawerCollapsed)}
          />
        )}
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

      <GlobalRosterModal
        isOpen={isGlobalRosterOpen}
        onClose={() => setIsGlobalRosterOpen(false)}
      />

    </div>
  );
}

export default App;
