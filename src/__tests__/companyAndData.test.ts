import { describe, it, expect, beforeEach } from 'vitest';
import { gameData, getBestiaryEntry, getCompanionEntry, getAllMissions, getScenario } from '../utils/gameDataLoader';
import { useCompanyStore } from '../store/useCompanyStore';

describe('Game Data Loader', () => {
  it('loads game data JSON properly', () => {
    expect(gameData.title).toBeDefined();
    expect(gameData.bestiary.length).toBeGreaterThan(0);
    expect(gameData.companions_roster.length).toBeGreaterThan(0);
    expect(gameData.missions.length).toBeGreaterThan(0);
  });

  it('retrieves bestiary entries correctly', () => {
    const bat = getBestiaryEntry('Blood Bat');
    expect(bat).toBeDefined();
    expect(bat?.stats.Move).toBe(8);
    expect(bat?.stats.Health).toBe(1);

    const zombie = getBestiaryEntry('Zombie');
    expect(zombie).toBeDefined();
    expect(zombie?.stats.Fight).toBe(0);
  });

  it('retrieves companion entries correctly', () => {
    const arcanist = getCompanionEntry('Arcanist');
    expect(arcanist).toBeDefined();
    expect(arcanist?.rp).toBe(15);
  });

  it('retrieves missions and scenarios', () => {
    const missions = getAllMissions();
    expect(missions.length).toBe(4);

    const scenario1 = getScenario(0, 1);
    expect(scenario1).toBeDefined();
    expect(scenario1?.title).toContain('Deserted Village');
  });
});

describe('Company Store', () => {
  beforeEach(() => {
    useCompanyStore.getState().resetCompany();
  });

  it('manages ranger XP and level progression', () => {
    const store = useCompanyStore.getState();
    expect(store.ranger.xp).toBe(0);
    expect(store.ranger.level).toBe(1);

    store.addRangerXp(120);
    const updated = useCompanyStore.getState().ranger;
    expect(updated.xp).toBe(120);
    expect(updated.level).toBe(2);
    expect(updated.buildPoints).toBe(1);
  });

  it('manages 5-slot inventory and stash', () => {
    const store = useCompanyStore.getState();
    expect(store.ranger.inventory.length).toBe(5);

    // Adding a 6th item should go to stash
    const addedToRanger = store.addItemToInventory('Magic Ring');
    expect(addedToRanger).toBe(false);
    expect(useCompanyStore.getState().stash).toContain('Magic Ring');

    // Remove an item from ranger inventory then move item from stash
    store.removeItemFromInventory(0);
    expect(useCompanyStore.getState().ranger.inventory.length).toBe(4);

    const moved = store.moveItemStashToRanger(useCompanyStore.getState().stash.indexOf('Magic Ring'));
    expect(moved).toBe(true);
    expect(useCompanyStore.getState().ranger.inventory).toContain('Magic Ring');
  });

  it('performs survival checks and treasure rolls', () => {
    const store = useCompanyStore.getState();
    const survival = store.rollSurvivalCheck('Eldrin');
    expect(survival.roll).toBeGreaterThanOrEqual(1);
    expect(survival.roll).toBeLessThanOrEqual(20);
    expect(survival.result).toBeDefined();

    const treasure = store.rollTreasure();
    expect(treasure.roll).toBeGreaterThanOrEqual(1);
    expect(treasure.roll).toBeLessThanOrEqual(20);
    expect(treasure.result).toBeDefined();
  });
});
