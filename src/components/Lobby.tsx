'use client';

import { ClientGameState } from '../lib/types';
import PlayerList from './PlayerList';

interface LobbyProps {
  gameState: ClientGameState;
  onStart: () => void;
}

export default function Lobby({ gameState, onStart }: LobbyProps) {
  const isHost = gameState.myId === gameState.hostId;
  const canStart = isHost && gameState.players.length >= 4;
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/game/${gameState.id}`
    : '';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Waiting for Players</h2>
        <p className="text-gray-400">
          {gameState.players.length} player{gameState.players.length !== 1 ? 's' : ''} in lobby
          {gameState.players.length < 4 && (
            <span className="text-yellow-400"> (need at least 4)</span>
          )}
        </p>
      </div>

      {/* Share Link */}
      <div className="bg-gray-800 rounded-lg p-4">
        <label className="text-sm text-gray-400 block mb-2">Share this link with friends:</label>
        <div className="flex gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 bg-gray-900 text-white px-3 py-2 rounded border border-gray-700 text-sm"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
          >
            Copy
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Game code: <span className="font-mono text-white">{gameState.id}</span>
        </p>
      </div>

      {/* Player List */}
      <PlayerList players={gameState.players} myId={gameState.myId} />

      {/* Start Button */}
      {isHost && (
        <button
          onClick={onStart}
          disabled={!canStart}
          className={`w-full py-3 rounded-lg font-bold text-lg transition-colors ${
            canStart
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canStart ? 'Start Game' : `Need ${4 - gameState.players.length} more player${4 - gameState.players.length !== 1 ? 's' : ''}`}
        </button>
      )}
      {!isHost && (
        <p className="text-center text-gray-400 text-sm">
          Waiting for the host to start the game...
        </p>
      )}
    </div>
  );
}
