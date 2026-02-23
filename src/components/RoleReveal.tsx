'use client';

import { Role } from '../lib/types';

interface RoleRevealProps {
  role: Role;
  mafiaTeammates: string[] | null;
}

const roleDescriptions: Record<Role, string> = {
  villager: 'Find and eliminate the Mafia during the day. You have no special abilities at night.',
  mafia: 'Eliminate villagers at night. Blend in during the day to avoid being voted out.',
  healer: 'Choose one player to protect each night. If the Mafia targets them, they survive.',
  detective: 'Investigate one player each night to learn if they are Mafia.',
};

const roleEmojis: Record<Role, string> = {
  villager: '🏘️',
  mafia: '🔫',
  healer: '💉',
  detective: '🔍',
};

const roleColors: Record<Role, string> = {
  villager: 'from-gray-600 to-gray-800',
  mafia: 'from-red-700 to-red-900',
  healer: 'from-green-700 to-green-900',
  detective: 'from-blue-700 to-blue-900',
};

export default function RoleReveal({ role, mafiaTeammates }: RoleRevealProps) {
  return (
    <div className={`bg-gradient-to-br ${roleColors[role]} rounded-xl p-6 text-center shadow-lg border border-white/10`}>
      <div className="text-4xl mb-2">{roleEmojis[role]}</div>
      <h3 className="text-xl font-bold text-white capitalize mb-2">
        You are a {role}
      </h3>
      <p className="text-sm text-gray-200">
        {roleDescriptions[role]}
      </p>
      {role === 'mafia' && mafiaTeammates && mafiaTeammates.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/20">
          <p className="text-sm text-red-200">
            Fellow Mafia: {mafiaTeammates.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
