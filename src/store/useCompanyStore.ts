import { create } from 'zustand';
import type { RangerCharacter, CompanionCharacter } from '../types/gameState';
import { gameData } from '../utils/gameDataLoader';

const COMPANY_STORAGE_KEY = 'rosd_vtt_company_state';

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

export interface CompanyState {
  ranger: RangerCharacter;
  companions: CompanionCharacter[];
  stash: string[];
  totalCampaignXp: number;
  completedScenarios: string[];

  // Actions
  updateRanger: (partial: Partial<RangerCharacter>) => void;
  addRangerXp: (amount: number) => void;
  addCompanion: (companion: CompanionCharacter) => void;
  removeCompanion: (id: string) => void;
  updateCompanion: (id: string, partial: Partial<CompanionCharacter>) => void;
  addItemToInventory: (item: string) => boolean; // returns true if added to ranger inventory or false if added to stash
  removeItemFromInventory: (index: number) => void;
  addItemToStash: (item: string) => void;
  removeItemFromStash: (index: number) => void;
  moveItemStashToRanger: (stashIndex: number) => boolean;
  moveItemRangerToStash: (rangerItemIndex: number) => void;

  // Post scenario & Progression mechanics
  rollSurvivalCheck: (figureName: string) => { roll: number; result: string; detail: string };
  rollTreasure: () => { roll: number; result: string; item?: string };
  recordCompletedScenario: (scenarioId: string) => void;
  resetCompany: () => void;
}

const defaultRanger: RangerCharacter = {
  id: 'ranger-1',
  name: 'Ranger Eldrin',
  level: 1,
  xp: 0,
  buildPoints: 0,
  stats: {
    Move: 6,
    Fight: 2,
    Shoot: 2,
    Armour: 11,
    Will: 3,
    Health: 18,
  },
  currentHp: 18,
  skills: {
    'Perception': 3,
    'Survival': 2,
    'Stealth': 2,
    'Track': 2,
    'Climb': 1,
    'Swim': 1,
  },
  heroicAbilities: [
    { id: 'ha-1', name: 'Powerful Blow', description: '+3 damage on next successful melee attack', usesMax: 1, usesRemaining: 1 },
    { id: 'ha-2', name: 'Evade', description: 'Step back out of combat without suffering free attack', usesMax: 1, usesRemaining: 1 },
  ],
  spells: [
    { id: 'sp-1', name: 'Heal', description: 'Restore up to 5 Health to a figure within 6 inches', usesMax: 1, usesRemaining: 1 },
  ],
  inventory: ['Hand Weapon', 'Bow', 'Quiver (20 Arrows)', 'Light Armour', 'Herb of Healing'],
};

const defaultCompanions: CompanionCharacter[] = [
  {
    id: 'comp-1',
    name: 'Brother Thomas',
    role: 'Acolyte',
    rp: 10,
    stats: { Move: 6, Fight: 0, Shoot: 0, Armour: 10, Will: 3, Health: 8 },
    currentHp: 8,
    skills: { 'Heal': 3 },
    equipment: ['Staff', 'Healing Herbs'],
  },
  {
    id: 'comp-2',
    name: 'Garrick',
    role: 'Man-at-Arms',
    rp: 20,
    stats: { Move: 6, Fight: 3, Shoot: 0, Armour: 12, Will: 2, Health: 12 },
    currentHp: 12,
    skills: { 'Track': 1 },
    equipment: ['Hand Weapon', 'Shield', 'Light Armour'],
  },
];

const loadSavedCompany = () => {
  try {
    const saved = getItem(COMPANY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ranger: { ...defaultRanger, ...parsed.ranger },
        companions: parsed.companions || defaultCompanions,
        stash: parsed.stash || ['Potion of Healing', 'Torch', '50 Gold Pieces'],
        totalCampaignXp: parsed.totalCampaignXp || 0,
        completedScenarios: parsed.completedScenarios || [],
      };
    }
  } catch (e) {
    console.error('Failed to parse saved company state:', e);
  }
  return {
    ranger: defaultRanger,
    companions: defaultCompanions,
    stash: ['Potion of Healing', 'Torch', '50 Gold Pieces'],
    totalCampaignXp: 0,
    completedScenarios: [],
  };
};

export const useCompanyStore = create<CompanyState>((set, get) => {
  const initial = loadSavedCompany();

  const persist = (state: Partial<CompanyState>) => {
    try {
      const current = get();
      const payload = {
        ranger: state.ranger ?? current.ranger,
        companions: state.companions ?? current.companions,
        stash: state.stash ?? current.stash,
        totalCampaignXp: state.totalCampaignXp ?? current.totalCampaignXp,
        completedScenarios: state.completedScenarios ?? current.completedScenarios,
      };
      setItem(COMPANY_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save company state:', e);
    }
  };

  return {
    ranger: initial.ranger,
    companions: initial.companions,
    stash: initial.stash,
    totalCampaignXp: initial.totalCampaignXp,
    completedScenarios: initial.completedScenarios,

    updateRanger: (partial) => {
      set((state) => {
        const ranger = { ...state.ranger, ...partial };
        persist({ ranger });
        return { ranger };
      });
    },

    addRangerXp: (amount) => {
      set((state) => {
        const newXp = state.ranger.xp + amount;
        const newTotalXp = state.totalCampaignXp + amount;

        let newLevel = state.ranger.level;
        let newBuildPoints = state.ranger.buildPoints;
        const targetLevel = Math.floor(newXp / 100) + 1;
        if (targetLevel > newLevel) {
          newBuildPoints += (targetLevel - newLevel);
          newLevel = targetLevel;
        }

        const ranger = {
          ...state.ranger,
          xp: newXp,
          level: newLevel,
          buildPoints: newBuildPoints,
        };

        persist({ ranger, totalCampaignXp: newTotalXp });
        return { ranger, totalCampaignXp: newTotalXp };
      });
    },

    addCompanion: (companion) => {
      set((state) => {
        const companions = [...state.companions, companion];
        persist({ companions });
        return { companions };
      });
    },

    removeCompanion: (id) => {
      set((state) => {
        const companions = state.companions.filter((c) => c.id !== id);
        persist({ companions });
        return { companions };
      });
    },

    updateCompanion: (id, partial) => {
      set((state) => {
        const companions = state.companions.map((c) => (c.id === id ? { ...c, ...partial } : c));
        persist({ companions });
        return { companions };
      });
    },

    addItemToInventory: (item) => {
      const { ranger, stash } = get();
      if (ranger.inventory.length < 5) {
        const nextInventory = [...ranger.inventory, item];
        const nextRanger = { ...ranger, inventory: nextInventory };
        set({ ranger: nextRanger });
        persist({ ranger: nextRanger });
        return true;
      } else {
        const nextStash = [...stash, item];
        set({ stash: nextStash });
        persist({ stash: nextStash });
        return false;
      }
    },

    removeItemFromInventory: (index) => {
      set((state) => {
        const nextInventory = [...state.ranger.inventory];
        nextInventory.splice(index, 1);
        const ranger = { ...state.ranger, inventory: nextInventory };
        persist({ ranger });
        return { ranger };
      });
    },

    addItemToStash: (item) => {
      set((state) => {
        const stash = [...state.stash, item];
        persist({ stash });
        return { stash };
      });
    },

    removeItemFromStash: (index) => {
      set((state) => {
        const stash = [...state.stash];
        stash.splice(index, 1);
        persist({ stash });
        return { stash };
      });
    },

    moveItemStashToRanger: (stashIndex) => {
      const { ranger, stash } = get();
      if (ranger.inventory.length >= 5) return false;
      const item = stash[stashIndex];
      if (!item) return false;

      const nextStash = [...stash];
      nextStash.splice(stashIndex, 1);
      const nextInventory = [...ranger.inventory, item];
      const nextRanger = { ...ranger, inventory: nextInventory };

      set({ ranger: nextRanger, stash: nextStash });
      persist({ ranger: nextRanger, stash: nextStash });
      return true;
    },

    moveItemRangerToStash: (rangerItemIndex) => {
      const { ranger, stash } = get();
      const item = ranger.inventory[rangerItemIndex];
      if (!item) return;

      const nextInventory = [...ranger.inventory];
      nextInventory.splice(rangerItemIndex, 1);
      const nextStash = [...stash, item];
      const nextRanger = { ...ranger, inventory: nextInventory };

      set({ ranger: nextRanger, stash: nextStash });
      persist({ ranger: nextRanger, stash: nextStash });
    },

    rollSurvivalCheck: (figureName) => {
      const roll = Math.floor(Math.random() * 20) + 1;
      const tableData = gameData.random_tables.survival_table as any;
      const results = Array.isArray(tableData) ? tableData : (tableData?.results || []);

      const entry = results.find((e: any) => {
        if (e.roll_range) {
          const [min, max] = e.roll_range;
          return roll >= min && roll <= max;
        }
        return false;
      }) || { result: 'Full Recovery', description: 'The figure recovers fully with no permanent harm.' };

      return {
        roll,
        result: entry.result || 'Full Recovery',
        detail: entry.description || entry.details || `${figureName} rolls ${roll}: ${entry.result}`,
      };
    },

    rollTreasure: () => {
      const roll = Math.floor(Math.random() * 20) + 1;
      const tableData = gameData.random_tables.treasure_table as any;
      const results = Array.isArray(tableData) ? tableData : (tableData?.results || []);

      const entry = results.find((e: any) => {
        if (e.roll_range) {
          const [min, max] = e.roll_range;
          return roll >= min && roll <= max;
        }
        return false;
      });

      const typeName = entry ? (entry.type || entry.result || 'Gold & Jewels') : 'Gold Coins';
      const detail = entry ? (entry.effect || (entry.sub_table ? `Roll on ${entry.sub_table}` : '')) : '20 Gold Coins';
      const resultText = `${typeName}${detail ? `: ${detail}` : ''}`;

      return {
        roll,
        result: resultText,
        item: typeName,
      };
    },

    recordCompletedScenario: (scenarioId) => {
      set((state) => {
        if (state.completedScenarios.includes(scenarioId)) return state;
        const completedScenarios = [...state.completedScenarios, scenarioId];
        persist({ completedScenarios });
        return { completedScenarios };
      });
    },

    resetCompany: () => {
      removeItem(COMPANY_STORAGE_KEY);
      set({
        ranger: defaultRanger,
        companions: defaultCompanions,
        stash: ['Potion of Healing', 'Torch', '50 Gold Pieces'],
        totalCampaignXp: 0,
        completedScenarios: [],
      });
    },
  };
});
