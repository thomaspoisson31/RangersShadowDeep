import rawGameData from '../../data/rangers-of-shadow-deep-complete-data.json';
import type { GameData, BestiaryEntry, CompanionEntry, Mission, Scenario } from '../types/gameData';

export const gameData: GameData = rawGameData as unknown as GameData;

export function getBestiaryEntry(name: string): BestiaryEntry | undefined {
  return gameData.bestiary.find(
    (b) => b.name.toLowerCase() === name.toLowerCase()
  );
}

export function getCompanionEntry(name: string): CompanionEntry | undefined {
  return gameData.companions_roster.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
}

export function getAllMissions(): Mission[] {
  return gameData.missions || [];
}

export function getScenario(missionIndex: number, scenarioIndex: number): Scenario | undefined {
  const mission = gameData.missions[missionIndex];
  if (!mission) return undefined;
  return mission.scenarios.find((s) => s.scenario_index === scenarioIndex);
}

export function getRandomTable(tableName: keyof typeof gameData.random_tables) {
  return gameData.random_tables[tableName] || [];
}
