import { describe, it, expect } from 'vitest';
import { serializeGameStateForLLM } from '../utils/llmClient';
import type { Token, LogEntry } from '../types/gameState';

describe('LLM Integration & State Serializer', () => {
  it('serializes game state into structured prompt string', () => {
    const mockTokens: Token[] = [
      {
        id: 'r1',
        name: 'Eldrin',
        category: 'ranger',
        x: 18,
        y: 18,
        radiusInches: 0.5,
        fight: 2,
        armor: 11,
        currentHp: 18,
        maxHp: 18,
        status: {},
      },
      {
        id: 'm1',
        name: 'Giant Rat 1',
        category: 'monster',
        x: 18.5,
        y: 18,
        radiusInches: 0.5,
        fight: 1,
        armor: 10,
        currentHp: 4,
        maxHp: 4,
        status: {},
      },
    ];

    const mockLogs: LogEntry[] = [
      {
        id: 'l1',
        timestamp: '12:00:00',
        turnNumber: 1,
        phase: 'ranger',
        message: 'Eldrin moves into contact with Giant Rat 1.',
        type: 'combat',
      },
    ];

    const serialized = serializeGameStateForLLM(null, mockTokens, mockLogs, 1, 'ranger');

    expect(serialized).toContain('Game Master AI');
    expect(serialized).toContain('Eldrin');
    expect(serialized).toContain('Giant Rat 1');
    expect(serialized).toContain('Eldrin moves into contact');
  });
});
