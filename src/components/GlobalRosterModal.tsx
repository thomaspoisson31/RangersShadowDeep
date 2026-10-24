import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Users, Search, Heart, X, Eye } from 'lucide-react';

interface GlobalRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalRosterModal: React.FC<GlobalRosterModalProps> = ({ isOpen, onClose }) => {
  const { tokens, selectToken, selectedTokenId } = useGameStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'ranger' | 'companion' | 'monster' | 'clue'>('all');

  if (!isOpen) return null;

  const filteredTokens = tokens.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-stone-900 border border-amber-900/50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-stone-200">
        {/* Modal Header */}
        <div className="p-4 bg-stone-950 border-b border-amber-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-amber-400 gold-text">Roster Global & Stats des Tokens</h2>
            <span className="text-xs bg-amber-950 border border-amber-800 text-amber-300 px-2 py-0.5 rounded-full font-mono">
              {tokens.length} Active Tokens
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-stone-800 bg-stone-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 bg-stone-950 border border-stone-700 px-3 py-1.5 rounded-lg flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher un token par nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-stone-100 outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                categoryFilter === 'all' ? 'bg-amber-800 text-amber-100' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Tous ({tokens.length})
            </button>
            <button
              onClick={() => setCategoryFilter('ranger')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                categoryFilter === 'ranger' ? 'bg-amber-800 text-amber-100' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Rangers
            </button>
            <button
              onClick={() => setCategoryFilter('companion')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                categoryFilter === 'companion' ? 'bg-amber-800 text-amber-100' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Compagnons
            </button>
            <button
              onClick={() => setCategoryFilter('monster')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                categoryFilter === 'monster' ? 'bg-amber-800 text-amber-100' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Monstres
            </button>
            <button
              onClick={() => setCategoryFilter('clue')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                categoryFilter === 'clue' ? 'bg-amber-800 text-amber-100' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Indices
            </button>
          </div>
        </div>

        {/* Tokens Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-950 text-stone-400 font-mono uppercase text-[10px] border-b border-stone-800 sticky top-0">
              <tr>
                <th className="py-2 px-3">Nom / Catégorie</th>
                <th className="py-2 px-3 text-center">PV (Health)</th>
                <th className="py-2 px-3 text-center">Armure</th>
                <th className="py-2 px-3 text-center">Combat</th>
                <th className="py-2 px-3 text-center">Tir</th>
                <th className="py-2 px-3 text-center">Déplacement</th>
                <th className="py-2 px-3 text-center">Position</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 font-mono">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-stone-500 italic">
                    Aucun token trouvé.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((t) => {
                  const isSelected = selectedTokenId === t.id;
                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-stone-800/60 transition-colors ${
                        isSelected ? 'bg-amber-950/40 border-l-2 border-amber-500' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-sans font-bold flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full inline-block border border-stone-600"
                          style={{ backgroundColor: t.color || '#d97706' }}
                        />
                        <div>
                          <div className="text-stone-100">{t.name}</div>
                          <span className="text-[10px] font-mono text-stone-400 capitalize">
                            {t.category}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {t.maxHp !== undefined ? (
                          <span className="text-rose-400 font-bold flex items-center justify-center gap-1">
                            <Heart className="w-3 h-3 fill-rose-500" />
                            {t.currentHp}/{t.maxHp}
                          </span>
                        ) : (
                          <span className="text-stone-600">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-blue-400 font-bold">
                        {t.armor ?? t.stats?.Armour ?? '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-amber-300 font-bold">
                        +{t.fight ?? t.stats?.Fight ?? 0}
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                        +{t.shoot ?? t.stats?.Shoot ?? 0}
                      </td>
                      <td className="py-2.5 px-3 text-center text-stone-300">
                        {t.move ?? t.stats?.Move ?? 6}"
                      </td>
                      <td className="py-2.5 px-3 text-center text-stone-400 text-[10px]">
                        ({t.x.toFixed(1)}", {t.y.toFixed(1)}")
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <button
                          onClick={() => {
                            selectToken(t.id);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700/60 rounded text-[11px] font-semibold flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" /> Sélectionner
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-lg"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
