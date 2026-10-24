import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/useGameStore';
import { useSettingsStore } from '../store/useSettingsStore';

describe('Game Persistence and Features', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it('exports and imports game state correctly', () => {
    const store = useGameStore.getState();
    store.addLog('Test log entry', 'system');
    store.addToken({
      name: 'Test Monster',
      category: 'monster',
      x: 10,
      y: 10,
      radiusInches: 0.5,
      currentHp: 12,
      maxHp: 12,
      armor: 11,
      fight: 2,
      shoot: 0,
      move: 6,
      will: 1,
      status: { isActivated: false, actionsLeft: 2, maxActions: 2 },
      color: '#ef4444',
    });

    const exportedJson = store.exportGameState();
    expect(exportedJson).toContain('Test Monster');
    expect(exportedJson).toContain('Test log entry');

    // Reset store
    store.resetGame();
    expect(useGameStore.getState().tokens.length).toBe(0);

    // Import state back
    const success = useGameStore.getState().importGameState(exportedJson);
    expect(success).toBe(true);
    expect(useGameStore.getState().tokens.length).toBe(1);
    expect(useGameStore.getState().tokens[0].name).toBe('Test Monster');
  });

  it('allows customizing 3D view angle setting', () => {
    const { view3dAngle, setView3dAngle } = useSettingsStore.getState();
    expect(view3dAngle).toBe(30);

    setView3dAngle(40);
    expect(useSettingsStore.getState().view3dAngle).toBe(40);
  });
});
