import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Crosshair, Swords, Search, Activity, ScrollText, Trash2, Dices } from 'lucide-react';

export const ActionControlsDrawer: React.FC = () => {
  const {
    tokens,
    selectedTokenId,
    logs,
    performMeleeAttack,
    performRangedAttack,
    performSkillTest,
    performSearchClue,
    removeToken,
    clearLogs,
  } = useGameStore();

  const [targetTokenId, setTargetTokenId] = useState<string>('');
  const [coverMod, setCoverMod] = useState<number>(0);
  const [skillName, setSkillName] = useState<string>('Perception');
  const [skillTn, setSkillTn] = useState<number>(8);

  const selectedToken = tokens.find((t) => t.id === selectedTokenId);
  const eligibleTargets = tokens.filter((t) => t.id !== selectedTokenId && (t.currentHp ?? 1) > 0);
  const eligibleClues = tokens.filter((t) => t.category === 'clue' && !t.status.isSearched);

  return (
    <div className="w-80 h-full bg-stone-900/95 border-l border-amber-900/40 p-4 flex flex-col gap-4 text-xs text-stone-200 overflow-hidden backdrop-blur-md z-30">

      {/* Selected Token Section */}
      <div className="bg-stone-950 p-3 rounded-lg border border-amber-900/30 space-y-3">
        <div className="flex items-center justify-between border-b border-amber-900/30 pb-2">
          <h3 className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
            <Activity className="w-4 h-4 text-amber-500" />
            {selectedToken ? selectedToken.name : 'No Token Selected'}
          </h3>
          {selectedToken && (
            <button
              onClick={() => removeToken(selectedToken.id)}
              className="p-1 text-stone-500 hover:text-red-400 rounded"
              title="Remove Token"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {selectedToken ? (
          <div className="space-y-2">
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-1 text-center font-mono text-[11px] bg-stone-900 p-2 rounded">
              <div>
                <span className="text-stone-500 block text-[9px]">Fight</span>
                <span className="font-bold text-amber-300">+{selectedToken.fight ?? selectedToken.stats?.Fight ?? 0}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[9px]">Shoot</span>
                <span className="font-bold text-emerald-400">+{selectedToken.shoot ?? selectedToken.stats?.Shoot ?? 0}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[9px]">Armour</span>
                <span className="font-bold text-blue-400">{selectedToken.armor ?? selectedToken.stats?.Armour ?? 10}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[9px]">HP</span>
                <span className="font-bold text-rose-400">{selectedToken.currentHp ?? 0}/{selectedToken.maxHp ?? 0}</span>
              </div>
            </div>

            {/* Position coordinates */}
            <div className="text-[10px] text-stone-400 flex justify-between">
              <span>Position: ({selectedToken.x.toFixed(1)}", {selectedToken.y.toFixed(1)}")</span>
              <span className="capitalize font-semibold text-amber-500">{selectedToken.category}</span>
            </div>

            {/* Combat Actions */}
            <div className="space-y-2 pt-2 border-t border-stone-800">
              <label className="text-[10px] text-amber-500 font-bold block">Target for Attack / Skill</label>
              <select
                value={targetTokenId}
                onChange={(e) => setTargetTokenId(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1 text-stone-200 outline-none text-xs"
              >
                <option value="">-- Select Target Token --</option>
                {eligibleTargets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={() => targetTokenId && performMeleeAttack(selectedToken.id, targetTokenId)}
                  disabled={!targetTokenId}
                  className="flex-1 py-1.5 bg-rose-900/80 hover:bg-rose-800 disabled:opacity-40 text-rose-100 font-bold rounded flex items-center justify-center gap-1"
                >
                  <Swords className="w-3.5 h-3.5" /> Melee
                </button>
                <button
                  onClick={() => targetTokenId && performRangedAttack(selectedToken.id, targetTokenId, coverMod)}
                  disabled={!targetTokenId}
                  className="flex-1 py-1.5 bg-emerald-900/80 hover:bg-emerald-800 disabled:opacity-40 text-emerald-100 font-bold rounded flex items-center justify-center gap-1"
                >
                  <Crosshair className="w-3.5 h-3.5" /> Shoot
                </button>
              </div>

              {/* Cover selector for shooting */}
              <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1">
                <span>Target Cover:</span>
                <select
                  value={coverMod}
                  onChange={(e) => setCoverMod(Number(e.target.value))}
                  className="bg-stone-900 border border-stone-800 rounded px-1.5 py-0.5 text-stone-200"
                >
                  <option value={0}>Open (No Cover)</option>
                  <option value={2}>Light Cover (+2)</option>
                  <option value={4}>Heavy Cover (+4)</option>
                </select>
              </div>

              {/* Skill Test Button */}
              <div className="pt-2 border-t border-stone-800/80 space-y-1.5">
                <div className="flex gap-2 items-center">
                  <select
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    className="flex-1 bg-stone-900 border border-stone-700 rounded px-1.5 py-1 text-stone-200 text-[10px]"
                  >
                    <option value="Perception">Perception</option>
                    <option value="Survival">Survival</option>
                    <option value="Stealth">Stealth</option>
                    <option value="Track">Track</option>
                    <option value="Lockpicking">Lockpicking</option>
                    <option value="Climb">Climb</option>
                    <option value="Swim">Swim</option>
                  </select>
                  <input
                    type="number"
                    value={skillTn}
                    onChange={(e) => setSkillTn(Number(e.target.value))}
                    className="w-12 bg-stone-900 border border-stone-700 rounded px-1 py-1 text-center font-bold text-stone-100 text-[10px]"
                    placeholder="TN"
                    title="Target Number (TN)"
                  />
                  <button
                    onClick={() => performSkillTest(selectedToken.id, skillName, 2, skillTn)}
                    className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded text-[10px] flex items-center gap-1"
                  >
                    <Dices className="w-3 h-3 text-amber-400" /> Test
                  </button>
                </div>
              </div>

              {/* Clue Search Button */}
              {eligibleClues.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      const nearestClue = eligibleClues[0];
                      if (nearestClue) performSearchClue(selectedToken.id, nearestClue.id);
                    }}
                    className="w-full py-1.5 bg-amber-800 hover:bg-amber-700 text-amber-100 font-bold rounded flex items-center justify-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5" /> Search Nearest Clue
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-stone-500 italic text-center py-2">
            Click on any token on the battlemap to select it and trigger actions.
          </p>
        )}
      </div>

      {/* Real-time Combat & Event Log */}
      <div className="flex-1 bg-stone-950 p-3 rounded-lg border border-stone-800 flex flex-col min-h-0">
        <div className="flex items-center justify-between pb-2 border-b border-stone-800 mb-2">
          <h4 className="font-bold text-stone-300 flex items-center gap-1.5">
            <ScrollText className="w-4 h-4 text-amber-500" /> Event & Action Log
          </h4>
          <button
            onClick={clearLogs}
            className="text-[10px] text-stone-500 hover:text-stone-300 underline"
          >
            Clear
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[11px]">
          {logs.length === 0 ? (
            <p className="text-stone-600 italic">No logs yet.</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`p-2 rounded border text-[11px] leading-relaxed ${
                  log.type === 'combat'
                    ? 'bg-rose-950/40 border-rose-900/40 text-rose-200'
                    : log.type === 'ai'
                    ? 'bg-amber-950/40 border-amber-900/40 text-amber-200'
                    : log.type === 'event'
                    ? 'bg-purple-950/40 border-purple-900/40 text-purple-200'
                    : log.type === 'llm'
                    ? 'bg-blue-950/40 border-blue-900/40 text-blue-200'
                    : 'bg-stone-900/60 border-stone-800 text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] opacity-60 mb-0.5">
                  <span>T{log.turnNumber} • {log.phase.toUpperCase()}</span>
                  <span>{log.timestamp}</span>
                </div>
                <div>{log.message}</div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
