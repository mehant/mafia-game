'use client';

import { ClientPlayer } from '../lib/types';

interface PlayerListProps {
  players: ClientPlayer[];
  myId: string;
  showRoles?: boolean;
  onSelect?: (playerId: string) => void;
  selectedId?: string | null;
  selectableFilter?: (player: ClientPlayer) => boolean;
}

export default function PlayerList({
  players,
  myId,
  showRoles = false,
  onSelect,
  selectedId,
  selectableFilter,
}: PlayerListProps) {
  return (
    <div className="space-y-2">
      {players.map((player) => {
        const isMe = player.id === myId;
        const selectable = onSelect && player.alive && selectableFilter?.(player);
        const isSelected = selectedId === player.id;

        return (
          <div
            key={player.id}
            onClick={() => selectable && onSelect?.(player.id)}
            className={`
              flex items-center justify-between p-3 rounded-lg border transition-all
              ${!player.alive ? 'opacity-50 bg-gray-800 border-gray-700' : 'bg-gray-900 border-gray-700'}
              ${selectable ? 'cursor-pointer hover:border-blue-500 hover:bg-gray-800' : ''}
              ${isSelected ? 'border-blue-500 bg-blue-900/30' : ''}
              ${isMe ? 'ring-1 ring-blue-400/50' : ''}
            `}
          >
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${!player.alive ? 'line-through text-gray-500' : 'text-white'}`}>
                {player.name}
                {isMe && <span className="text-blue-400 ml-1">(you)</span>}
              </span>
              {!player.connected && (
                <span className="text-xs text-yellow-500 bg-yellow-900/30 px-1.5 py-0.5 rounded">
                  disconnected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!player.alive && (
                <span className="text-xs text-red-400">dead</span>
              )}
              {showRoles && player.role && (
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${getRoleBadgeColor(player.role)}`}>
                  {player.role}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'mafia': return 'bg-red-900/50 text-red-300';
    case 'healer': return 'bg-green-900/50 text-green-300';
    case 'detective': return 'bg-blue-900/50 text-blue-300';
    case 'villager': return 'bg-gray-700 text-gray-300';
    default: return 'bg-gray-700 text-gray-300';
  }
}
