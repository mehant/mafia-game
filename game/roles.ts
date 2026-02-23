import { Role } from './types';

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Assign roles based on player count:
 * - ~1 Mafia per 4 players
 * - Healer at 5+ players
 * - Detective at 6+ players
 * - Rest are Villagers
 */
export function assignRoles(playerCount: number): Role[] {
  const mafiaCount = Math.max(1, Math.floor(playerCount / 4));
  const hasHealer = playerCount >= 5;
  const hasDetective = playerCount >= 6;

  const roles: Role[] = [];

  for (let i = 0; i < mafiaCount; i++) {
    roles.push('mafia');
  }
  if (hasHealer) roles.push('healer');
  if (hasDetective) roles.push('detective');

  while (roles.length < playerCount) {
    roles.push('villager');
  }

  return shuffle(roles);
}
