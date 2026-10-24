import React, { useState } from 'react';
import { useCompanyStore } from '../store/useCompanyStore';
import { gameData } from '../utils/gameDataLoader';
import { Shield, Heart, Crosshair, Footprints, Award, Backpack, UserPlus, Trash2, Dices, X } from 'lucide-react';

interface CompanyRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyRosterModal: React.FC<CompanyRosterModalProps> = ({ isOpen, onClose }) => {
  const {
    ranger,
    companions,
    stash,
    totalCampaignXp,
    updateRanger,
    addCompanion,
    removeCompanion,
    removeItemFromInventory,
    moveItemStashToRanger,
    moveItemRangerToStash,
    removeItemFromStash,
    rollSurvivalCheck,
    rollTreasure
  } = useCompanyStore();

  const [activeTab, setActiveTab] = useState<'ranger' | 'companions' | 'stash' | 'rolls'>('ranger');
  const [selectedCompanionToHire, setSelectedCompanionToHire] = useState<string>('');
  const [rollLog, setRollLog] = useState<Array<{ type: string; title: string; detail: string }>>([]);

  if (!isOpen) return null;

  const handleHireCompanion = () => {
    if (!selectedCompanionToHire) return;
    const template = gameData.companions_roster.find(c => c.name === selectedCompanionToHire);
    if (!template) return;

    const newCompanion = {
      id: `comp-${Date.now()}`,
      name: `${template.name} ${companions.length + 1}`,
      role: template.name,
      rp: template.rp,
      stats: { ...template.stats },
      currentHp: template.stats.Health,
      skills: template.skills ? { ...template.skills } : {},
      equipment: template.equipment ? [...template.equipment] : [],
    };

    addCompanion(newCompanion);
    setSelectedCompanionToHire('');
  };

  const handleRollSurvival = () => {
    const result = rollSurvivalCheck(ranger.name);
    setRollLog(prev => [
      { type: 'survival', title: `Survival Check: ${ranger.name} (Roll ${result.roll})`, detail: `${result.result} - ${result.detail}` },
      ...prev
    ]);
  };

  const handleRollTreasure = () => {
    const result = rollTreasure();
    setRollLog(prev => [
      { type: 'treasure', title: `Treasure Roll (Roll ${result.roll})`, detail: result.result },
      ...prev
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="parchment-card w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden border border-amber-700/50 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-900/80 border-b border-amber-900/40">
          <div>
            <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
              <Shield className="w-6 h-6 text-amber-500" /> Company Roster & Campaign Stash
            </h2>
            <p className="text-xs text-stone-400">Manage your Ranger, hire Companions, organize 5-slot inventory & perform post-game rolls.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-amber-900/30 bg-stone-900/50 px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('ranger')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'ranger'
                ? 'bg-amber-950/80 text-amber-300 border-t-2 border-amber-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Award className="w-4 h-4" /> Ranger Sheet
          </button>
          <button
            onClick={() => setActiveTab('companions')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'companions'
                ? 'bg-amber-950/80 text-amber-300 border-t-2 border-amber-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <UserPlus className="w-4 h-4" /> Companions ({companions.length})
          </button>
          <button
            onClick={() => setActiveTab('stash')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'stash'
                ? 'bg-amber-950/80 text-amber-300 border-t-2 border-amber-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Backpack className="w-4 h-4" /> Equipment & Stash ({stash.length})
          </button>
          <button
            onClick={() => setActiveTab('rolls')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors flex items-center gap-2 ${
              activeTab === 'rolls'
                ? 'bg-amber-950/80 text-amber-300 border-t-2 border-amber-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Dices className="w-4 h-4" /> Post-Game Rolls
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: RANGER SHEET */}
          {activeTab === 'ranger' && (
            <div className="space-y-6">
              {/* Ranger Info Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-stone-900/60 p-4 rounded-lg border border-amber-900/30">
                <div>
                  <label className="text-xs text-amber-500 font-semibold block mb-1">Ranger Name</label>
                  <input
                    type="text"
                    value={ranger.name}
                    onChange={(e) => updateRanger({ name: e.target.value })}
                    className="w-full bg-stone-950 border border-amber-900/50 rounded px-3 py-1.5 text-stone-100 font-bold focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <span className="text-xs text-amber-500 font-semibold block mb-1">Level & Experience</span>
                  <div className="text-sm font-bold text-stone-200 py-1.5">
                    Level <span className="text-amber-400">{ranger.level}</span> ({ranger.xp} XP / Total Campaign {totalCampaignXp} XP)
                  </div>
                </div>
                <div>
                  <span className="text-xs text-amber-500 font-semibold block mb-1">Build Points Available</span>
                  <div className="text-sm font-bold text-amber-300 py-1.5">
                    {ranger.buildPoints} Points
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div>
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">Core Attributes</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  <div className="bg-stone-900/80 p-3 rounded border border-stone-800 text-center">
                    <Footprints className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                    <span className="text-xs text-stone-400 block">Move</span>
                    <span className="text-lg font-bold text-stone-100">{ranger.stats.Move}"</span>
                  </div>
                  <div className="bg-stone-900/80 p-3 rounded border border-stone-800 text-center">
                    <Crosshair className="w-4 h-4 text-red-500 mx-auto mb-1" />
                    <span className="text-xs text-stone-400 block">Fight</span>
                    <span className="text-lg font-bold text-stone-100">+{ranger.stats.Fight}</span>
                  </div>
                  <div className="bg-stone-900/80 p-3 rounded border border-stone-800 text-center">
                    <Crosshair className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                    <span className="text-xs text-stone-400 block">Shoot</span>
                    <span className="text-lg font-bold text-stone-100">+{ranger.stats.Shoot}</span>
                  </div>
                  <div className="bg-stone-900/80 p-3 rounded border border-stone-800 text-center">
                    <Shield className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                    <span className="text-xs text-stone-400 block">Armour</span>
                    <span className="text-lg font-bold text-stone-100">{ranger.stats.Armour}</span>
                  </div>
                  <div className="bg-stone-900/80 p-3 rounded border border-stone-800 text-center">
                    <Award className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                    <span className="text-xs text-stone-400 block">Will</span>
                    <span className="text-lg font-bold text-stone-100">+{ranger.stats.Will}</span>
                  </div>
                  <div className="bg-stone-900/80 p-3 rounded border border-stone-800 text-center">
                    <Heart className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                    <span className="text-xs text-stone-400 block">Health</span>
                    <span className="text-lg font-bold text-rose-400">{ranger.currentHp} / {ranger.stats.Health}</span>
                  </div>
                </div>
              </div>

              {/* Skills & Heroic Abilities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-stone-900/50 p-4 rounded border border-stone-800">
                  <h3 className="text-sm font-bold text-amber-400 mb-3">Skills</h3>
                  <div className="space-y-2">
                    {Object.entries(ranger.skills).map(([skill, val]) => (
                      <div key={skill} className="flex justify-between items-center text-sm border-b border-stone-800/60 pb-1">
                        <span className="text-stone-300">{skill}</span>
                        <span className="font-bold text-amber-300">+{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-stone-900/50 p-4 rounded border border-stone-800">
                  <h3 className="text-sm font-bold text-amber-400 mb-3">Heroic Abilities & Spells</h3>
                  <div className="space-y-3">
                    {ranger.heroicAbilities.map((ha) => (
                      <div key={ha.id} className="p-2 bg-stone-950/80 rounded border border-amber-900/20 text-xs">
                        <div className="font-bold text-amber-300">{ha.name} (Ability)</div>
                        <div className="text-stone-400 mt-0.5">{ha.description}</div>
                      </div>
                    ))}
                    {ranger.spells.map((sp) => (
                      <div key={sp.id} className="p-2 bg-stone-950/80 rounded border border-amber-900/20 text-xs">
                        <div className="font-bold text-purple-300">{sp.name} (Spell)</div>
                        <div className="text-stone-400 mt-0.5">{sp.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPANIONS */}
          {activeTab === 'companions' && (
            <div className="space-y-6">
              {/* Hire companion bar */}
              <div className="flex gap-3 bg-stone-900/80 p-4 rounded-lg border border-amber-900/30 items-end">
                <div className="flex-1">
                  <label className="text-xs text-amber-500 font-semibold block mb-1">Hire New Companion from Roster</label>
                  <select
                    value={selectedCompanionToHire}
                    onChange={(e) => setSelectedCompanionToHire(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-200 outline-none text-sm"
                  >
                    <option value="">-- Select Companion Template --</option>
                    {gameData.companions_roster.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} (Cost: {c.rp} Recruitment Points) - HP:{c.stats.Health}, Fight:+{c.stats.Fight}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleHireCompanion}
                  disabled={!selectedCompanionToHire}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-stone-100 font-bold rounded text-sm transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Recruit
                </button>
              </div>

              {/* Current Companions */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Active Companions</h3>
                {companions.length === 0 ? (
                  <p className="text-sm text-stone-500 italic">No companions in company roster.</p>
                ) : (
                  companions.map((comp) => (
                    <div key={comp.id} className="bg-stone-900/60 p-4 rounded-lg border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-amber-300 text-base flex items-center gap-2">
                          {comp.name} <span className="text-xs px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-400">{comp.role}</span>
                        </div>
                        <div className="text-xs text-stone-400 mt-1 flex gap-4">
                          <span>Move: {comp.stats.Move}"</span>
                          <span>Fight: +{comp.stats.Fight}</span>
                          <span>Shoot: +{comp.stats.Shoot}</span>
                          <span>Armour: {comp.stats.Armour}</span>
                          <span>HP: <strong className="text-rose-400">{comp.currentHp}/{comp.stats.Health}</strong></span>
                        </div>
                        {comp.equipment && comp.equipment.length > 0 && (
                          <div className="text-xs text-stone-500 mt-1">
                            Gear: {comp.equipment.join(', ')}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeCompanion(comp.id)}
                        className="p-2 text-stone-500 hover:text-red-400 hover:bg-stone-800 rounded transition-colors self-end sm:self-center"
                        title="Dismiss Companion"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: STASH & INVENTORY */}
          {activeTab === 'stash' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ranger Active Inventory (5 slots max) */}
              <div className="bg-stone-900/60 p-4 rounded-lg border border-amber-900/30">
                <h3 className="text-sm font-bold text-amber-400 flex items-center justify-between mb-3">
                  <span>Ranger Active Inventory</span>
                  <span className="text-xs text-stone-400">({ranger.inventory.length}/5 slots used)</span>
                </h3>
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const item = ranger.inventory[idx];
                    return (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-stone-950 rounded border border-stone-800 text-xs">
                        {item ? (
                          <>
                            <span className="font-semibold text-stone-200">{item}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => moveItemRangerToStash(idx)}
                                className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[10px]"
                              >
                                Move to Stash
                              </button>
                              <button
                                onClick={() => removeItemFromInventory(idx)}
                                className="p-1 text-stone-500 hover:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <span className="text-stone-600 italic">Empty Slot</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Campaign Stash */}
              <div className="bg-stone-900/60 p-4 rounded-lg border border-stone-800">
                <h3 className="text-sm font-bold text-amber-400 mb-3">
                  Campaign Stash ({stash.length} Items)
                </h3>
                {stash.length === 0 ? (
                  <p className="text-xs text-stone-500 italic">Campaign stash is empty.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {stash.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-stone-950 rounded border border-stone-850 text-xs">
                        <span className="text-stone-300">{item}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveItemStashToRanger(idx)}
                            disabled={ranger.inventory.length >= 5}
                            className="px-2 py-1 bg-amber-900/60 hover:bg-amber-800 disabled:opacity-40 text-amber-200 rounded text-[10px]"
                          >
                            Equip
                          </button>
                          <button
                            onClick={() => removeItemFromStash(idx)}
                            className="p-1 text-stone-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ROLLS */}
          {activeTab === 'rolls' && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <button
                  onClick={handleRollSurvival}
                  className="px-4 py-2 bg-rose-900/80 hover:bg-rose-800 border border-rose-700/50 text-rose-100 font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <Dices className="w-4 h-4" /> Roll Survival Table (Fallen Figure)
                </button>
                <button
                  onClick={handleRollTreasure}
                  className="px-4 py-2 bg-amber-900/80 hover:bg-amber-800 border border-amber-700/50 text-amber-100 font-bold rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <Dices className="w-4 h-4" /> Roll Treasure Table
                </button>
              </div>

              {/* Roll log list */}
              <div className="bg-stone-950 p-4 rounded-lg border border-stone-800 space-y-3 min-h-48 max-h-80 overflow-y-auto">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Post-Game Roll Results</h4>
                {rollLog.length === 0 ? (
                  <p className="text-xs text-stone-500 italic">No rolls performed in this session yet.</p>
                ) : (
                  rollLog.map((log, idx) => (
                    <div key={idx} className="p-3 bg-stone-900/80 rounded border border-stone-800 text-xs space-y-1">
                      <div className="font-bold text-amber-300">{log.title}</div>
                      <div className="text-stone-300">{log.detail}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
