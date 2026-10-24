import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../store/useGameStore';
import {
  resolveMeleeCombat,
  resolveRangedAttack,
  resolveSkillTest,
  executeCreatureAI,
  calculateDistance,
} from '../utils/rulesEngine';
import type { Token } from '../types/gameState';

describe('Rules Resolution Engine', () => {
  const mockHero: Token = {
    id: 'hero-1',
    name: 'Eldrin',
    category: 'ranger',
    x: 10,
    y: 10,
    radiusInches: 0.5,
    fight: 3,
    shoot: 2,
    armor: 11,
    currentHp: 18,
    maxHp: 18,
    status: {},
  };

  const mockMonster: Token = {
    id: 'monster-1',
    name: 'Zombie 1',
    category: 'monster',
    x: 10.5, // Contact distance = 0.5 inch (base contact)
    y: 10,
    radiusInches: 0.5,
    fight: 0,
    shoot: 0,
    armor: 10,
    currentHp: 6,
    maxHp: 6,
    status: {},
  };

  it('calculates distance and base contact correctly', () => {
    const dist = calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
    expect(dist).toBe(5);
  });

  it('resolves melee combat calculations properly', () => {
    const result = resolveMeleeCombat(mockHero, mockMonster);
    expect(result.attackerRoll).toBeGreaterThanOrEqual(1);
    expect(result.attackerRoll).toBeLessThanOrEqual(20);
    expect(result.message).toBeDefined();
  });

  it('resolves ranged shooting attacks with cover modifiers', () => {
    const result = resolveRangedAttack(mockHero, mockMonster, 2); // 2 = light cover
    expect(result.attackerRoll).toBeGreaterThanOrEqual(1);
    expect(result.defenderTotal).toBeGreaterThanOrEqual(mockMonster.fight! + 2 + 1);
  });

  it('resolves skill tests against target numbers', () => {
    const successTest = resolveSkillTest('Eldrin', 'Perception', 10, 8);
    expect(successTest.success).toBe(true);

    const failTest = resolveSkillTest('Eldrin', 'Lockpicking', -10, 15);
    expect(failTest.success).toBe(false);
  });

  it('executes creature AI decision tree for engaged combat', () => {
    const boardDim = { widthInches: 36, heightInches: 36 };
    const aiDecision = executeCreatureAI(mockMonster, [mockHero, mockMonster], null, boardDim);

    // Because monster is at x=10.5 and hero is at x=10, distance is 0.5" (hand-to-hand)
    expect(aiDecision.actionType).toBe('attack');
    expect(aiDecision.targetTokenId).toBe(mockHero.id);
  });

  it('executes creature AI decision tree for movement towards closest hero', () => {
    const distantMonster: Token = {
      ...mockMonster,
      id: 'm-distant',
      x: 25,
      y: 25,
    };
    const boardDim = { widthInches: 36, heightInches: 36 };
    const aiDecision = executeCreatureAI(distantMonster, [mockHero, distantMonster], null, boardDim);

    expect(aiDecision.actionType).toBe('move');
    expect(aiDecision.targetTokenId).toBe(mockHero.id);
  });
});

describe('Turn Machine Store', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it('advances through turn phases in canonical order', () => {
    const store = useGameStore.getState();
    expect(store.currentPhase).toBe('ranger');
    expect(store.turnNumber).toBe(1);

    // 1. Advance to Creature Phase
    store.advancePhase();
    expect(useGameStore.getState().currentPhase).toBe('creature');

    // 2. Advance to Companion Phase
    store.advancePhase();
    expect(useGameStore.getState().currentPhase).toBe('companion');

    // 3. Advance to Event Phase
    store.advancePhase();
    expect(useGameStore.getState().currentPhase).toBe('event');

    // 4. Advance to Next Turn (Ranger Phase, Turn 2)
    store.advancePhase();
    expect(useGameStore.getState().currentPhase).toBe('ranger');
    expect(useGameStore.getState().turnNumber).toBe(2);
  });
});
