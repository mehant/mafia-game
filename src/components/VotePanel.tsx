'use client';

import { useState } from 'react';
import { ClientGameState } from '../lib/types';
import PlayerList from './PlayerList';

interface VotePanelProps {
  gameState: ClientGameState;
  onVote: (targetId: string) => void;
  onSkip: () => void;
}

export default function VotePanel({ gameState, onVote, onSkip }: VotePanelProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const me = gameState.players.find(p => p.id === gameState.myId);
  const hasVoted = gameState.voteState?.votedPlayerIds.includes(gameState.myId);

  if (!me || !me.alive) return null;

  const handleSubmitVote = () => {
    if (selectedTarget) {
      onVote(selectedTarget);
      setSelectedTarget(null);
    }
  };

  if (hasVoted) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-green-400">Vote submitted. Waiting for others...</p>
        <p className="text-sm text-gray-500 mt-1">
          {gameState.voteState?.votedPlayerIds.length} / {gameState.alivePlayerCount} votes in
        </p>

        {/* Show votes once you've voted */}
        {gameState.voteState && Object.keys(gameState.voteState.votes).length > 0 && (
          <div className="mt-4 text-left space-y-1">
            <h4 className="text-sm font-medium text-gray-400">Current votes:</h4>
            {Object.entries(gameState.voteState.votes).map(([voterId, targetId]) => {
              const voter = gameState.players.find(p => p.id === voterId);
              const target = targetId ? gameState.players.find(p => p.id === targetId) : null;
              return (
                <p key={voterId} className="text-sm text-gray-300">
                  {voter?.name}: {target ? target.name : 'Skip'}
                </p>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Vote to eliminate:</h3>

      <PlayerList
        players={gameState.players}
        myId={gameState.myId}
        onSelect={setSelectedTarget}
        selectedId={selectedTarget}
        selectableFilter={(p) => p.alive && p.id !== gameState.myId}
      />

      <div className="flex gap-3">
        <button
          onClick={handleSubmitVote}
          disabled={!selectedTarget}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
            selectedTarget
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Vote to Eliminate
        </button>
        <button
          onClick={onSkip}
          className="px-6 py-2.5 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
