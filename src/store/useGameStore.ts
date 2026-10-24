import { create } from 'zustand';
import type { Token, BoardConfig, LogEntry, TurnPhase } from '../types/gameState';
import type { Scenario, EventCardEntry } from '../types/gameData';
import { getBestiaryEntry } from '../utils/gameDataLoader';
import {
  resolveMeleeCombat,
  resolveRangedAttack,
  resolveSkillTest,
  executeCreatureAI,
  resolveClueInteraction,
  drawEventCard,
} from '../utils/rulesEngine';

export interface RulerMeasurement {
  startInches: { x: number; y: number };
  endInches: { x: number; y: number };
  distanceInches: number;
}

interface GameState {
  // Scenario state
  activeMissionIndex: number;
  activeScenarioIndex: number;
  activeScenario: Scenario | null;

  // Board configuration
  boardConfig: BoardConfig;

  // VTT Tokens
  tokens: Token[];
  selectedTokenId: string | null;

  // Turn Machine State
  turnNumber: number;
  currentPhase: TurnPhase;
  activeTokenId: string | null;
  eventDeck: EventCardEntry[];
  drawnEvents: EventCardEntry[];

  // Tools & Measuring
  activeTool: 'select' | 'pan' | 'ruler' | 'calibrate';
  rulerMeasurement: RulerMeasurement | null;

  // Combat / Event Logs
  logs: LogEntry[];

  // Actions
  loadScenario: (missionIndex: number, scenarioIndex: number, scenario: Scenario, rangerName: string, companions: any[]) => void;
  setBoardConfig: (partial: Partial<BoardConfig>) => void;
  setActiveTool: (tool: 'select' | 'pan' | 'ruler' | 'calibrate') => void;
  setRulerMeasurement: (ruler: RulerMeasurement | null) => void;

  // Token actions
  addToken: (token: Omit<Token, 'id'>) => string;
  updateToken: (id: string, partial: Partial<Token> | ((prev: Token) => Partial<Token>)) => void;
  moveToken: (id: string, x: number, y: number) => void;
  removeToken: (id: string) => void;
  selectToken: (id: string | null) => void;

  // Turn Machine Actions
  advancePhase: () => void;
  executeAllCreaturesAI: () => void;
  executeSingleCreatureAI: (monsterId: string) => void;
  triggerEventPhase: () => void;

  // Rules Action Handlers
  performMeleeAttack: (attackerId: string, defenderId: string) => void;
  performRangedAttack: (shooterId: string, targetId: string, coverMod?: number) => void;
  performSkillTest: (tokenId: string, skillName: string, bonus: number, tn: number) => void;
  performSearchClue: (tokenId: string, clueTokenId: string) => void;

  // Calibration action
  calibrateScale: (startPx: { x: number; y: number }, endPx: { x: number; y: number }, realInches: number) => void;

  // Logs & Helper
  addLog: (message: string, type?: LogEntry['type'], details?: any) => void;
  clearLogs: () => void;
  resetGame: () => void;
}

const defaultBoardConfig: BoardConfig = {
  widthFeet: 3.0,
  lengthFeet: 3.0,
  pixelsPerInch: 25.0,
  mapImageUrl: null,
  calibrationMode: false,
  calibrationStep: 'none',
  calibrationStartPoint: null,
  calibrationEndPoint: null,
  gridVisible: true,
  gridSizeInches: 1.0,
};

export const useGameStore = create<GameState>((set, get) => ({
  activeMissionIndex: 0,
  activeScenarioIndex: 1,
  activeScenario: null,

  boardConfig: defaultBoardConfig,

  tokens: [],
  selectedTokenId: null,

  turnNumber: 1,
  currentPhase: 'ranger',
  activeTokenId: null,
  eventDeck: [],
  drawnEvents: [],

  activeTool: 'select',
  rulerMeasurement: null,

  logs: [],

  loadScenario: (missionIndex, scenarioIndex, scenario, rangerName, companions) => {
    const widthFeet = scenario.table_setup.dimensions.width_feet || 3.0;
    const lengthFeet = scenario.table_setup.dimensions.length_feet || 3.0;
    const widthInches = widthFeet * 12;
    const lengthInches = lengthFeet * 12;
    const centerInches = { x: widthInches / 2, y: lengthInches / 2 };

    const newTokens: Token[] = [];

    // 1. Place Ranger token
    newTokens.push({
      id: 'ranger-token-1',
      name: rangerName || 'Ranger',
      category: 'ranger',
      x: centerInches.x,
      y: centerInches.y,
      radiusInches: 0.5,
      currentHp: 18,
      maxHp: 18,
      armor: 11,
      fight: 2,
      shoot: 2,
      move: 6,
      will: 3,
      status: {
        isActivated: false,
        actionsLeft: 2,
        maxActions: 2,
      },
      color: '#d97706',
    });

    // 2. Place Companions
    companions.forEach((comp, idx) => {
      const angle = (idx * 2 * Math.PI) / Math.max(1, companions.length);
      const dist = 2.0;
      newTokens.push({
        id: `companion-token-${comp.id}`,
        name: comp.name,
        category: 'companion',
        x: centerInches.x + Math.cos(angle) * dist,
        y: centerInches.y + Math.sin(angle) * dist,
        radiusInches: 0.5,
        currentHp: comp.currentHp || comp.stats?.Health || 10,
        maxHp: comp.stats?.Health || 10,
        armor: comp.stats?.Armour || 10,
        fight: comp.stats?.Fight || 0,
        shoot: comp.stats?.Shoot || 0,
        move: comp.stats?.Move || 6,
        will: comp.stats?.Will || 2,
        status: {
          isActivated: false,
          actionsLeft: 2,
          maxActions: 2,
        },
        color: '#3b82f6',
      });
    });

    // 3. Place Markers (Clues)
    let clueCounter = 1;
    if (scenario.table_setup.markers) {
      scenario.table_setup.markers.forEach((m) => {
        if (m.type === 'clue_marker') {
          const range = m.id_range || [clueCounter, clueCounter];
          const count = range[1] - range[0] + 1;
          for (let i = 0; i < count; i++) {
            const clueId = range[0] + i;
            let cx = centerInches.x;
            let cy = centerInches.y;
            if (m.placement === 'inside_random_building' || m.placement === 'inside_house') {
              cx = 6 + (clueCounter * 7) % (widthInches - 12);
              cy = 6 + (clueCounter * 9) % (lengthInches - 12);
            } else if (m.placement === 'distance_from_center_toward_corners') {
              const dist = m.distance_inches || 14.0;
              const angle = (clueCounter * Math.PI) / 2 + Math.PI / 4;
              cx = centerInches.x + Math.cos(angle) * dist;
              cy = centerInches.y + Math.sin(angle) * dist;
            } else {
              cx = 4 + (clueCounter * 8) % (widthInches - 8);
              cy = 4 + (clueCounter * 10) % (lengthInches - 8);
            }

            newTokens.push({
              id: `clue-token-${clueId}`,
              name: `Clue Marker ${clueId}`,
              category: 'clue',
              x: Math.max(2, Math.min(widthInches - 2, cx)),
              y: Math.max(2, Math.min(lengthInches - 2, cy)),
              radiusInches: 0.4,
              clueId,
              status: {
                isSearched: false,
              },
              color: '#eab308',
            });
            clueCounter++;
          }
        }
      });
    }

    // 4. Place Initial Enemies
    if (scenario.table_setup.initial_enemies) {
      let enemyCount = 0;
      scenario.table_setup.initial_enemies.forEach((ie) => {
        const bestiaryData = getBestiaryEntry(ie.type);
        const stats = bestiaryData?.stats || { Move: 6, Fight: 1, Shoot: 0, Armour: 10, Will: 0, Health: 6 };

        for (let i = 0; i < ie.quantity; i++) {
          enemyCount++;
          let ex = centerInches.x;
          let ey = centerInches.y;

          if (ie.placement === 'table_edge_center_offset' && ie.edges) {
            const edge = ie.edges[i % ie.edges.length];
            const dist = ie.distance_from_edge_inches || 6.0;
            if (edge === 'north') { ex = centerInches.x + (i - 1) * 4; ey = dist; }
            else if (edge === 'south') { ex = centerInches.x + (i - 1) * 4; ey = lengthInches - dist; }
            else if (edge === 'east') { ex = widthInches - dist; ey = centerInches.y + (i - 1) * 4; }
            else { ex = dist; ey = centerInches.y + (i - 1) * 4; }
          } else {
            const angle = (enemyCount * Math.PI) / 3;
            const dist = 10.0 + enemyCount * 2;
            ex = centerInches.x + Math.cos(angle) * dist;
            ey = centerInches.y + Math.sin(angle) * dist;
          }

          newTokens.push({
            id: `enemy-token-${enemyCount}`,
            name: `${ie.type} ${enemyCount}`,
            category: 'monster',
            x: Math.max(2, Math.min(widthInches - 2, ex)),
            y: Math.max(2, Math.min(lengthInches - 2, ey)),
            radiusInches: 0.5,
            currentHp: stats.Health,
            maxHp: stats.Health,
            armor: stats.Armour,
            fight: stats.Fight,
            shoot: stats.Shoot,
            move: stats.Move,
            will: stats.Will,
            traits: bestiaryData?.traits || [],
            specialRules: bestiaryData?.special_rules || '',
            status: {
              isActivated: false,
              actionsLeft: 2,
              maxActions: 2,
            },
            color: '#ef4444',
            sourceData: bestiaryData,
          });
        }
      });
    }

    // 5. Place Target Point token
    if (scenario.mechanics?.target_point) {
      newTokens.push({
        id: 'target-point-token',
        name: 'Target Point',
        category: 'target_point',
        x: centerInches.x,
        y: centerInches.y,
        radiusInches: 0.6,
        status: {},
        color: '#a855f7',
      });
    }

    const eventDeck = scenario.mechanics?.events_deck ? [...scenario.mechanics.events_deck] : [];

    const initialLog: LogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      turnNumber: 1,
      phase: 'ranger',
      message: `Scenario Loaded: "${scenario.title}" on a ${widthFeet}x${lengthFeet} ft battlefield.`,
      type: 'system',
    };

    set({
      activeMissionIndex: missionIndex,
      activeScenarioIndex: scenarioIndex,
      activeScenario: scenario,
      boardConfig: {
        ...defaultBoardConfig,
        widthFeet,
        lengthFeet,
      },
      tokens: newTokens,
      selectedTokenId: null,
      turnNumber: 1,
      currentPhase: 'ranger',
      activeTokenId: null,
      eventDeck,
      drawnEvents: [],
      logs: [initialLog],
    });
  },

  setBoardConfig: (partial) => {
    set((state) => ({ boardConfig: { ...state.boardConfig, ...partial } }));
  },

  setActiveTool: (tool) => {
    set({ activeTool: tool });
  },

  setRulerMeasurement: (ruler) => {
    set({ rulerMeasurement: ruler });
  },

  addToken: (tokenData) => {
    const id = `token-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newToken: Token = { ...tokenData, id };
    set((state) => ({ tokens: [...state.tokens, newToken] }));
    return id;
  },

  updateToken: (id, partial) => {
    set((state) => ({
      tokens: state.tokens.map((t) => {
        if (t.id !== id) return t;
        const patch = typeof partial === 'function' ? partial(t) : partial;
        return {
          ...t,
          ...patch,
          status: { ...t.status, ...(patch.status || {}) },
        };
      }),
    }));
  },

  moveToken: (id, x, y) => {
    const { boardConfig } = get();
    const maxX = boardConfig.widthFeet * 12;
    const maxY = boardConfig.lengthFeet * 12;

    const clampedX = Math.max(0.2, Math.min(maxX - 0.2, x));
    const clampedY = Math.max(0.2, Math.min(maxY - 0.2, y));

    set((state) => ({
      tokens: state.tokens.map((t) => (t.id === id ? { ...t, x: clampedX, y: clampedY } : t)),
    }));
  },

  removeToken: (id) => {
    set((state) => ({
      tokens: state.tokens.filter((t) => t.id !== id),
      selectedTokenId: state.selectedTokenId === id ? null : state.selectedTokenId,
      activeTokenId: state.activeTokenId === id ? null : state.activeTokenId,
    }));
  },

  selectToken: (id) => {
    set({ selectedTokenId: id });
  },

  advancePhase: () => {
    const { currentPhase, turnNumber } = get();

    if (currentPhase === 'ranger') {
      get().addLog('--- Phase Transition: Creature Phase (AI Activation) ---', 'system');
      set({ currentPhase: 'creature' });
      get().executeAllCreaturesAI();
    } else if (currentPhase === 'creature') {
      get().addLog('--- Phase Transition: Companion Phase ---', 'system');
      set({ currentPhase: 'companion' });
    } else if (currentPhase === 'companion') {
      get().addLog('--- Phase Transition: Event Phase ---', 'system');
      set({ currentPhase: 'event' });
      get().triggerEventPhase();
    } else if (currentPhase === 'event') {
      const nextTurn = turnNumber + 1;
      get().addLog(`=== Turn ${turnNumber} Ended. Beginning Turn ${nextTurn} (Ranger Phase) ===`, 'system');

      set((state) => ({
        turnNumber: nextTurn,
        currentPhase: 'ranger',
        tokens: state.tokens.map((t) => ({
          ...t,
          status: {
            ...t.status,
            isActivated: false,
            actionsLeft: 2,
          },
        })),
      }));
    }
  },

  executeSingleCreatureAI: (monsterId: string) => {
    const { tokens, activeScenario, boardConfig } = get();
    const monster = tokens.find((t) => t.id === monsterId);
    if (!monster || monster.category !== 'monster' || (monster.currentHp ?? 0) <= 0) return;

    const boardDimensions = {
      widthInches: boardConfig.widthFeet * 12,
      heightInches: boardConfig.lengthFeet * 12,
    };

    const aiResult = executeCreatureAI(monster, tokens, activeScenario, boardDimensions);
    get().addLog(aiResult.log, 'ai');

    if (aiResult.actionType === 'attack' && aiResult.targetTokenId) {
      get().performMeleeAttack(monster.id, aiResult.targetTokenId);
    } else if (aiResult.actionType === 'shoot' && aiResult.targetTokenId) {
      get().performRangedAttack(monster.id, aiResult.targetTokenId);
    } else {
      get().moveToken(monster.id, aiResult.destination.x, aiResult.destination.y);
    }

    get().updateToken(monster.id, { status: { isActivated: true, actionsLeft: 0 } });
  },

  executeAllCreaturesAI: () => {
    const { tokens } = get();
    const monsters = tokens
      .filter((t) => t.category === 'monster' && (t.currentHp ?? 0) > 0)
      .sort((a, b) => (b.currentHp ?? 0) - (a.currentHp ?? 0));

    monsters.forEach((m) => {
      get().executeSingleCreatureAI(m.id);
    });
  },

  triggerEventPhase: () => {
    const { eventDeck, drawnEvents, boardConfig } = get();
    const drawn = drawEventCard(eventDeck);

    if (!drawn) {
      get().addLog('Event Phase: Event deck is empty. No event drawn.', 'event');
      return;
    }

    const { card, remainingDeck } = drawn;
    get().addLog(`Event Drawn [${card.card}]: ${card.description}`, 'event', card);

    if (card.spawn_enemies && card.spawn_enemies.length > 0) {
      const widthInches = boardConfig.widthFeet * 12;
      const heightInches = boardConfig.lengthFeet * 12;

      card.spawn_enemies.forEach((se) => {
        const bestiaryData = getBestiaryEntry(se.type);
        const stats = bestiaryData?.stats || { Move: 6, Fight: 1, Shoot: 0, Armour: 10, Will: 0, Health: 6 };

        for (let i = 0; i < se.quantity; i++) {
          let spawnX = widthInches / 2;
          let spawnY = 2;
          if (se.location.includes('east')) spawnX = widthInches - 2;
          else if (se.location.includes('west')) spawnX = 2;
          else if (se.location.includes('south')) spawnY = heightInches - 2;

          get().addToken({
            name: `${se.type} (Spawn)`,
            category: 'monster',
            x: spawnX,
            y: spawnY,
            radiusInches: 0.5,
            currentHp: stats.Health,
            maxHp: stats.Health,
            armor: stats.Armour,
            fight: stats.Fight,
            shoot: stats.Shoot,
            move: stats.Move,
            will: stats.Will,
            traits: bestiaryData?.traits || [],
            status: { isActivated: false, actionsLeft: 2, maxActions: 2 },
            color: '#ef4444',
            sourceData: bestiaryData,
          });
          get().addLog(`Spawned ${se.type} at ${se.location}`, 'event');
        }
      });
    }

    set({
      eventDeck: remainingDeck,
      drawnEvents: [card, ...drawnEvents],
    });
  },

  performMeleeAttack: (attackerId, defenderId) => {
    const { tokens } = get();
    const attacker = tokens.find((t) => t.id === attackerId);
    const defender = tokens.find((t) => t.id === defenderId);

    if (!attacker || !defender) return;

    const result = resolveMeleeCombat(attacker, defender);
    get().addLog(result.message, 'combat', result);

    if (result.winner === 'attacker' && result.damageDealt > 0) {
      const newHp = Math.max(0, (defender.currentHp ?? 1) - result.damageDealt);
      get().updateToken(defenderId, { currentHp: newHp });
      if (newHp === 0) {
        get().addLog(`${defender.name} was defeated!`, 'combat');
        if (defender.category === 'monster') {
          get().removeToken(defenderId);
        }
      }
    } else if (result.winner === 'defender' && result.damageDealt > 0) {
      const newHp = Math.max(0, (attacker.currentHp ?? 1) - result.damageDealt);
      get().updateToken(attackerId, { currentHp: newHp });
      if (newHp === 0) {
        get().addLog(`${attacker.name} was defeated!`, 'combat');
        if (attacker.category === 'monster') {
          get().removeToken(attackerId);
        }
      }
    }
  },

  performRangedAttack: (shooterId, targetId, coverMod = 0) => {
    const { tokens } = get();
    const shooter = tokens.find((t) => t.id === shooterId);
    const target = tokens.find((t) => t.id === targetId);

    if (!shooter || !target) return;

    const result = resolveRangedAttack(shooter, target, coverMod);
    get().addLog(result.message, 'combat', result);

    if (result.winner === 'attacker' && result.damageDealt > 0) {
      const newHp = Math.max(0, (target.currentHp ?? 1) - result.damageDealt);
      get().updateToken(targetId, { currentHp: newHp });
      if (newHp === 0) {
        get().addLog(`${target.name} was defeated by ranged shot!`, 'combat');
        if (target.category === 'monster') {
          get().removeToken(targetId);
        }
      }
    }
  },

  performSkillTest: (tokenId, skillName, bonus, tn) => {
    const { tokens } = get();
    const token = tokens.find((t) => t.id === tokenId);
    if (!token) return;

    const result = resolveSkillTest(token.name, skillName, bonus, tn);
    get().addLog(result.message, 'dice', result);
  },

  performSearchClue: (tokenId, clueTokenId) => {
    const { tokens, activeScenario } = get();
    const figure = tokens.find((t) => t.id === tokenId);
    const clueToken = tokens.find((t) => t.id === clueTokenId);

    if (!figure || !clueToken || clueToken.category !== 'clue') return;

    const clueTable = activeScenario?.mechanics?.clue_table;
    const result = resolveClueInteraction(clueToken, clueTable, activeScenario);

    get().addLog(`${figure.name} searched Clue Marker ${clueToken.clueId || ''}: ${result.resultText}`, 'clue', result);
    get().updateToken(clueTokenId, { status: { isSearched: true } });

    if (result.spawnEnemy) {
      const bestiaryData = getBestiaryEntry(result.spawnEnemy.type);
      const stats = bestiaryData?.stats || { Move: 6, Fight: 1, Shoot: 0, Armour: 10, Will: 0, Health: 6 };

      for (let i = 0; i < result.spawnEnemy.quantity; i++) {
        get().addToken({
          name: `${result.spawnEnemy.type} (Ambush)`,
          category: 'monster',
          x: clueToken.x + (i + 1) * 1.0,
          y: clueToken.y + (i + 1) * 1.0,
          radiusInches: 0.5,
          currentHp: stats.Health,
          maxHp: stats.Health,
          armor: stats.Armour,
          fight: stats.Fight,
          shoot: stats.Shoot,
          move: stats.Move,
          will: stats.Will,
          traits: bestiaryData?.traits || [],
          status: { isActivated: false, actionsLeft: 2, maxActions: 2 },
          color: '#ef4444',
          sourceData: bestiaryData,
        });
        get().addLog(`Ambush! ${result.spawnEnemy.type} spawned near searched clue marker!`, 'event');
      }
    }
  },

  calibrateScale: (startPx, endPx, realInches) => {
    const dx = endPx.x - startPx.x;
    const dy = endPx.y - startPx.y;
    const pxDistance = Math.sqrt(dx * dx + dy * dy);
    if (pxDistance > 0 && realInches > 0) {
      const ppi = pxDistance / realInches;
      set((state) => ({
        boardConfig: {
          ...state.boardConfig,
          pixelsPerInch: Math.round(ppi * 100) / 100,
          calibrationMode: false,
          calibrationStep: 'none',
          calibrationStartPoint: null,
          calibrationEndPoint: null,
        },
      }));
      get().addLog(`Scale calibrated: ${Math.round(ppi * 100) / 100} pixels = 1 inch (${Math.round(pxDistance)}px = ${realInches}")`, 'system');
    }
  },

  addLog: (message, type = 'system', details) => {
    const { turnNumber, currentPhase } = get();
    const newEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString(),
      turnNumber,
      phase: currentPhase,
      message,
      type,
      details,
    };
    set((state) => ({ logs: [newEntry, ...state.logs] }));
  },

  clearLogs: () => {
    set({ logs: [] });
  },

  resetGame: () => {
    set({
      activeScenario: null,
      boardConfig: defaultBoardConfig,
      tokens: [],
      selectedTokenId: null,
      turnNumber: 1,
      currentPhase: 'ranger',
      activeTokenId: null,
      eventDeck: [],
      drawnEvents: [],
      logs: [],
    });
  },
}));
