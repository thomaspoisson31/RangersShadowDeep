import type { Token } from '../types/gameState';
import type { Scenario, ClueTableEntry, EventCardEntry } from '../types/gameData';

export interface CombatResult {
  attackerRoll: number;
  defenderRoll: number;
  attackerTotal: number;
  defenderTotal: number;
  attackerCrit: boolean;
  defenderCrit: boolean;
  winner: 'attacker' | 'defender' | 'tie';
  damageDealt: number;
  message: string;
}

export function calculateDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isBaseContact(a: { x: number; y: number }, b: { x: number; y: number }, contactThresholdInches: number = 1.0): boolean {
  return calculateDistance(a, b) <= contactThresholdInches;
}

// Opposed Melee Combat Resolution (D20 + Fight vs D20 + Fight)
export function resolveMeleeCombat(
  attacker: Token,
  defender: Token,
  attackerFightMod: number = 0,
  defenderFightMod: number = 0
): CombatResult {
  const attackerRoll = Math.floor(Math.random() * 20) + 1;
  const defenderRoll = Math.floor(Math.random() * 20) + 1;

  const isAttackerHero = attacker.category === 'ranger' || attacker.category === 'companion';
  const isDefenderHero = defender.category === 'ranger' || defender.category === 'companion';

  const attackerCrit = isAttackerHero && attackerRoll === 20;
  const defenderCrit = isDefenderHero && defenderRoll === 20;

  const attackerFight = attacker.fight || attacker.stats?.Fight || 0;
  const defenderFight = defender.fight || defender.stats?.Fight || 0;

  let attackerTotal = attackerRoll + attackerFight + attackerFightMod;
  let defenderTotal = defenderRoll + defenderFight + defenderFightMod;

  if (attackerCrit) attackerTotal += 5;
  if (defenderCrit) defenderTotal += 5;

  let winner: 'attacker' | 'defender' | 'tie' = 'tie';
  let damageDealt = 0;
  let message = '';

  if (attackerTotal > defenderTotal) {
    winner = 'attacker';
    const targetArmor = defender.armor || defender.stats?.Armour || 10;
    damageDealt = Math.max(0, attackerTotal - targetArmor);
    message = `${attacker.name} wins melee (${attackerTotal} vs ${defenderTotal}) and deals ${damageDealt} damage to ${defender.name}.`;
    if (attackerCrit) message += ' [CRITICAL HIT!]';
  } else if (defenderTotal > attackerTotal) {
    winner = 'defender';
    const attackerArmor = attacker.armor || attacker.stats?.Armour || 10;
    damageDealt = Math.max(0, defenderTotal - attackerArmor);
    message = `${defender.name} counter-attacks and wins (${defenderTotal} vs ${attackerTotal}), dealing ${damageDealt} damage to ${attacker.name}.`;
    if (defenderCrit) message += ' [CRITICAL HIT!]';
  } else {
    message = `Melee combat tied (${attackerTotal} vs ${defenderTotal}). Neither figure suffers damage.`;
  }

  return {
    attackerRoll,
    defenderRoll,
    attackerTotal,
    defenderTotal,
    attackerCrit,
    defenderCrit,
    winner,
    damageDealt,
    message,
  };
}

// Ranged Shooting Attack Resolution (D20 + Shoot vs D20 + Fight/Armour)
export function resolveRangedAttack(
  shooter: Token,
  target: Token,
  coverModifier: number = 0 // Light cover: +2, Heavy cover: +4
): CombatResult {
  const shooterRoll = Math.floor(Math.random() * 20) + 1;
  const targetRoll = Math.floor(Math.random() * 20) + 1;

  const isShooterHero = shooter.category === 'ranger' || shooter.category === 'companion';
  const shooterCrit = isShooterHero && shooterRoll === 20;

  const shooterShoot = shooter.shoot || shooter.stats?.Shoot || 0;
  const targetDefense = (target.fight || target.stats?.Fight || 0) + coverModifier;

  let shooterTotal = shooterRoll + shooterShoot;
  let targetTotal = targetRoll + targetDefense;

  if (shooterCrit) shooterTotal += 5;

  let winner: 'attacker' | 'defender' | 'tie' = 'tie';
  let damageDealt = 0;
  let message = '';

  if (shooterTotal > targetTotal) {
    winner = 'attacker';
    const targetArmor = target.armor || target.stats?.Armour || 10;
    damageDealt = Math.max(0, shooterTotal - targetArmor);
    message = `${shooter.name} hits ${target.name} with ranged attack (${shooterTotal} vs ${targetTotal}) for ${damageDealt} damage!`;
    if (shooterCrit) message += ' [CRITICAL SHOT!]';
  } else {
    winner = 'defender';
    message = `${shooter.name}'s shot misses ${target.name} (${shooterTotal} vs ${targetTotal}).`;
  }

  return {
    attackerRoll: shooterRoll,
    defenderRoll: targetRoll,
    attackerTotal: shooterTotal,
    defenderTotal: targetTotal,
    attackerCrit: shooterCrit,
    defenderCrit: false,
    winner,
    damageDealt,
    message,
  };
}

// Skill Test Resolution (D20 + Skill Bonus vs TN)
export function resolveSkillTest(
  figureName: string,
  skillName: string,
  skillBonus: number,
  tn: number
): { roll: number; total: number; success: boolean; message: string } {
  const roll = Math.floor(Math.random() * 20) + 1;
  const total = roll + skillBonus;
  const success = total >= tn;
  const message = `${figureName} tests ${skillName} (TN ${tn}): rolled ${roll} + ${skillBonus} = ${total}. ${
    success ? 'SUCCESS!' : 'FAILED.'
  }`;

  return { roll, total, success, message };
}

// Creature AI Decision Tree step executor for single monster
export function executeCreatureAI(
  monster: Token,
  allTokens: Token[],
  _scenario: Scenario | null,
  _boardDimensions: { widthInches: number; heightInches: number }
): { actionType: 'attack' | 'shoot' | 'move' | 'random_move'; targetTokenId?: string; destination: { x: number; y: number }; log: string } {
  const heroes = allTokens.filter(
    (t) => (t.category === 'ranger' || t.category === 'companion') && (t.currentHp ?? 1) > 0
  );

  // Step 1: Check if in hand-to-hand combat (base contact <= 1 inch)
  const engagedHero = heroes.find((h) => isBaseContact(monster, h, 1.0));
  if (engagedHero) {
    return {
      actionType: 'attack',
      targetTokenId: engagedHero.id,
      destination: { x: monster.x, y: monster.y },
      log: `${monster.name} is in contact with ${engagedHero.name} and attacks in melee!`,
    };
  }

  // Step 2: Check if Hero in Line of Sight / Range
  if (heroes.length > 0) {
    let closestHero: Token | null = null;
    let minDist = Infinity;

    heroes.forEach((h) => {
      const dist = calculateDistance(monster, h);
      if (dist < minDist) {
        minDist = dist;
        closestHero = h;
      }
    });

    if (closestHero) {
      const hasRangedWeapon = (monster.shoot || monster.stats?.Shoot || 0) > 0;
      if (hasRangedWeapon && minDist <= 18.0) {
        return {
          actionType: 'shoot',
          targetTokenId: (closestHero as Token).id,
          destination: { x: monster.x, y: monster.y },
          log: `${monster.name} shoots at closest hero ${(closestHero as Token).name} (distance ${minDist.toFixed(1)}")!`,
        };
      }

      // Move toward closest hero
      const moveDist = monster.move || monster.stats?.Move || 6;
      const dx = (closestHero as Token).x - monster.x;
      const dy = (closestHero as Token).y - monster.y;
      const ratio = Math.min(1.0, moveDist / Math.max(0.1, minDist));

      const destX = monster.x + dx * ratio;
      const destY = monster.y + dy * ratio;

      return {
        actionType: 'move',
        targetTokenId: (closestHero as Token).id,
        destination: { x: destX, y: destY },
        log: `${monster.name} moves ${moveDist}" toward closest hero ${(closestHero as Token).name}.`,
      };
    }
  }

  // Step 3: Check if Target Point or Clue Marker exists
  const clueMarkers = allTokens.filter((t) => t.category === 'clue' && !t.status.isSearched);
  const targetPointToken = allTokens.find((t) => t.category === 'target_point');

  const destTarget = targetPointToken || clueMarkers[0];
  if (destTarget) {
    const moveDist = monster.move || monster.stats?.Move || 6;
    const dist = calculateDistance(monster, destTarget);
    const dx = destTarget.x - monster.x;
    const dy = destTarget.y - monster.y;
    const ratio = Math.min(1.0, moveDist / Math.max(0.1, dist));

    return {
      actionType: 'move',
      destination: { x: monster.x + dx * ratio, y: monster.y + dy * ratio },
      log: `${monster.name} advances towards ${destTarget.name}.`,
    };
  }

  // Step 4: Random movement (1D20 / 2) inches in random direction
  const roll = Math.floor(Math.random() * 20) + 1;
  const distInches = Math.max(1, Math.floor(roll / 2));
  const angle = Math.random() * 2 * Math.PI;

  const newX = Math.max(1, Math.min(_boardDimensions.widthInches - 1, monster.x + Math.cos(angle) * distInches));
  const newY = Math.max(1, Math.min(_boardDimensions.heightInches - 1, monster.y + Math.sin(angle) * distInches));

  return {
    actionType: 'random_move',
    destination: { x: newX, y: newY },
    log: `${monster.name} wanders randomly ${distInches}" in a random direction.`,
  };
}

// Clue Marker D20 roll resolution
export function resolveClueInteraction(
  clueToken: Token,
  clueTable: ClueTableEntry[] | undefined,
  _scenario: Scenario | null
): { roll: number; resultText: string; spawnEnemy?: { type: string; quantity: number }; xpReward?: number } {
  const roll = Math.floor(Math.random() * 20) + 1;

  if (!clueTable || clueTable.length === 0) {
    return {
      roll,
      resultText: `Searched Clue ${clueToken.clueId || ''}: Found hidden footprints and local supplies. (+5 XP)`,
      xpReward: 5,
    };
  }

  const entry = clueTable.find((e) => {
    if (typeof e.roll === 'number') return e.roll === roll;
    if (typeof e.roll === 'string' && e.roll.includes('-')) {
      const [min, max] = e.roll.split('-').map(Number);
      return roll >= min && roll <= max;
    }
    return false;
  }) || clueTable[0];

  return {
    roll,
    resultText: `Clue Roll ${roll}: ${entry.result} ${entry.effect || ''}`,
    spawnEnemy: entry.spawn_enemy,
    xpReward: entry.xp_reward || 5,
  };
}

// Event Deck Card resolution
export function drawEventCard(
  eventDeck: EventCardEntry[]
): { card: EventCardEntry; remainingDeck: EventCardEntry[] } | null {
  if (eventDeck.length === 0) return null;
  const drawnIndex = Math.floor(Math.random() * eventDeck.length);
  const card = eventDeck[drawnIndex];
  const remainingDeck = eventDeck.filter((_, idx) => idx !== drawnIndex);

  return { card, remainingDeck };
}
