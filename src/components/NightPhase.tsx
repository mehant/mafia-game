'use client';

import { useState } from 'react';
import { ClientGameState, DetectiveResult, MafiaVoteUpdate } from '../lib/types';
import PlayerList from './PlayerList';
import RoleReveal from './RoleReveal';
import Timer from './Timer';

interface NightPhaseProps {
  gameState: ClientGameState;
  onNightAction: (targetId: string) => void;
  detectiveResult: DetectiveResult | null;
  mafiaVotes: MafiaVoteUpdate | null;
}

export default function NightPhase({ gameState, onNightAction, detectiveResult, mafiaVotes }: NightPhaseProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const me = gameState.players.find(p => p.id === gameState.myId);
  if (!me) return null;

  const isAlive = me.alive;
  const hasSubmitted = gameState.nightActionSubmitted;

  const handleSubmit = () => {
    if (selectedTarget) {
      onNightAction(selectedTarget);
      setSelectedTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Night {gameState.round}</h2>
        <p className="text-gray-400 mt-1">The town sleeps...</p>
        {gameState.nightTimerEnd && (
          <div className="mt-2">
            <Timer endTime={gameState.nightTimerEnd} label="Time remaining" />
          </div>
        )}
      </div>

      {/* Role Card */}
      <RoleReveal role={me.role!} mafiaTeammates={gameState.mafiaTeammates} />

      {/* Action Panel */}
      {isAlive && !hasSubmitted && me.role !== 'villager' && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            {me.role === 'mafia' && 'Choose a player to eliminate'}
            {me.role === 'healer' && 'Choose a player to protect'}
            {me.role === 'detective' && 'Choose a player to investigate'}
          </h3>

          <PlayerList
            players={gameState.players}
            myId={gameState.myId}
            onSelect={setSelectedTarget}
            selectedId={selectedTarget}
            selectableFilter={(p) => {
              if (!p.alive) return false;
              if (me.role === 'mafia' && p.id === gameState.myId) return false;
              if (me.role === 'detective' && p.id === gameState.myId) return false;
              return true;
            }}
          />

          <button
            onClick={handleSubmit}
            disabled={!selectedTarget}
            className={`w-full py-2.5 rounded-lg font-medium transition-colors ${
              selectedTarget
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirm
          </button>
        </div>
      )}

      {/* Status messages */}
      {isAlive && hasSubmitted && me.role !== 'villager' && (
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-green-400">Action submitted. Waiting for others...</p>
        </div>
      )}

      {isAlive && me.role === 'villager' && (
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-400">You are a villager. Try to sleep peacefully...</p>
        </div>
      )}

      {!isAlive && (
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-500">You are dead. Watching from the afterlife...</p>
        </div>
      )}

      {/* Detective Result */}
      {detectiveResult && me.role === 'detective' && (
        <div className={`rounded-lg p-4 text-center ${
          detectiveResult.isMafia ? 'bg-red-900/50 border border-red-700' : 'bg-green-900/50 border border-green-700'
        }`}>
          <p className="text-white font-medium">
            {detectiveResult.targetName} is {detectiveResult.isMafia ? 'MAFIA!' : 'NOT Mafia.'}
          </p>
        </div>
      )}

      {/* Mafia Vote Coordination */}
      {me.role === 'mafia' && mafiaVotes && Object.keys(mafiaVotes.votes).length > 0 && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-300 mb-2">Mafia Votes:</h4>
          {Object.entries(mafiaVotes.votes).map(([voterId, targetId]) => {
            const voter = gameState.players.find(p => p.id === voterId);
            const target = gameState.players.find(p => p.id === targetId);
            return (
              <p key={voterId} className="text-sm text-red-200">
                {voter?.name} → {target?.name}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}
