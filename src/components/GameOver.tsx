'use client';

import { ClientGameState } from '../lib/types';
import PlayerList from './PlayerList';

interface GameOverProps {
  gameState: ClientGameState;
}

export default function GameOver({ gameState }: GameOverProps) {
  const isMafiaWin = gameState.winner === 'mafia';

  return (
    <div className="space-y-6">
      <div className={`text-center rounded-xl p-8 ${
        isMafiaWin
          ? 'bg-gradient-to-br from-red-900/60 to-red-950/60 border border-red-800'
          : 'bg-gradient-to-br from-green-900/60 to-green-950/60 border border-green-800'
      }`}>
        <div className="text-5xl mb-3">{isMafiaWin ? '🔫' : '🎉'}</div>
        <h2 className="text-3xl font-bold text-white mb-2">
          {isMafiaWin ? 'Mafia Wins!' : 'Villagers Win!'}
        </h2>
        <p className="text-gray-300">
          {isMafiaWin
            ? 'The Mafia has taken control of the town.'
            : 'All Mafia members have been eliminated!'}
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Final Roles:</h3>
        <PlayerList players={gameState.players} myId={gameState.myId} showRoles />
      </div>

      <div className="text-center">
        <a
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
        >
          Play Again
        </a>
      </div>
    </div>
  );
}
