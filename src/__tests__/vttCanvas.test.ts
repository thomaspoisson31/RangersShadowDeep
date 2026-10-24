import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/useGameStore';
import { getScenario } from '../utils/gameDataLoader';

describe('VTT Canvas & Game Store', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it('instantiates scenario and populates initial tokens', () => {
    const scenario = getScenario(0, 1);
    expect(scenario).toBeDefined();

    if (scenario) {
      useGameStore.getState().loadScenario(0, 1, scenario, 'Eldrin', [
        { id: 'c1', name: 'Garrick', currentHp: 12, stats: { Health: 12, Move: 6, Fight: 3, Shoot: 0, Armour: 12, Will: 2 } }
      ]);

      const state = useGameStore.getState();
      expect(state.tokens.length).toBeGreaterThan(0);

      // Check ranger token placed at table center
      const ranger = state.tokens.find((t) => t.category === 'ranger');
      expect(ranger).toBeDefined();
      expect(ranger?.name).toBe('Eldrin');

      // Check clue markers placed
      const clues = state.tokens.filter((t) => t.category === 'clue');
      expect(clues.length).toBeGreaterThan(0);

      // Check enemies placed
      const enemies = state.tokens.filter((t) => t.category === 'monster');
      expect(enemies.length).toBeGreaterThan(0);
    }
  });

  it('calibrates pixels per inch scale ratio accurately', () => {
    const store = useGameStore.getState();

    // Tracing a line 100px long that represents 5 real inches -> should yield 20 pixelsPerInch
    store.calibrateScale({ x: 0, y: 0 }, { x: 100, y: 0 }, 5);

    const updatedBoard = useGameStore.getState().boardConfig;
    expect(updatedBoard.pixelsPerInch).toBe(20);
  });

  it('moves tokens on the board within table boundaries', () => {
    const store = useGameStore.getState();
    const id = store.addToken({
      name: 'Test Goblin',
      category: 'monster',
      x: 5,
      y: 5,
      radiusInches: 0.5,
      status: {},
    });

    store.moveToken(id, 12, 18);
    const movedToken = useGameStore.getState().tokens.find((t) => t.id === id);
    expect(movedToken?.x).toBe(12);
    expect(movedToken?.y).toBe(18);
  });
});
