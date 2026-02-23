'use client';

import { ClientGameState } from '../lib/types';
import PlayerList from './PlayerList';
import VotePanel from './VotePanel';
import Timer from './Timer';

interface DayPhaseProps {
  gameState: ClientGameState;
  onVote: (targetId: string) => void;
  onSkip: () => void;
}

export default function DayPhase({ gameState, onVote, onSkip }: DayPhaseProps) {
  const isResults = gameState.phase === 'day_results';
  const isVoting = gameState.phase === 'day_voting';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">
          {isResults ? 'Dawn Breaks' : 'Town Meeting'}
        </h2>
        <p className="text-gray-400 mt-1">Round {gameState.round}</p>
      </div>

      {/* Night Results */}
      {gameState.nightResult && (
        <div className={`rounded-lg p-4 text-center ${
          gameState.nightResult.killed
            ? 'bg-red-900/40 border border-red-800'
            : 'bg-green-900/40 border border-green-800'
        }`}>
          {gameState.nightResult.killed ? (
            <p className="text-red-200 text-lg">
              <span className="font-bold">{gameState.nightResult.killedName}</span> was eliminated by the Mafia last night.
            </p>
          ) : gameState.nightResult.saved ? (
            <p className="text-green-200 text-lg">
              Someone was attacked, but the Healer saved them!
            </p>
          ) : (
            <p className="text-green-200 text-lg">
              No one was killed last night.
            </p>
          )}
        </div>
      )}

      {/* Game Info */}
      <div className="flex justify-center gap-6 text-sm">
        <span className="text-gray-400">
          Alive: <span className="text-white font-medium">{gameState.alivePlayerCount}</span>
        </span>
        <span className="text-gray-400">
          Mafia remaining: <span className="text-red-400 font-medium">{gameState.aliveMafiaCount}</span>
        </span>
      </div>

      {/* Day Results - Show discuss prompt */}
      {isResults && (
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <p className="text-gray-300">
            Discuss with your fellow townspeople...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Voting begins shortly
          </p>
        </div>
      )}

      {/* Voting Phase */}
      {isVoting && (
        <>
          {gameState.dayTimerEnd && (
            <Timer endTime={gameState.dayTimerEnd} label="Voting ends in" />
          )}
          <VotePanel gameState={gameState} onVote={onVote} onSkip={onSkip} />
        </>
      )}

      {/* Player List */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Players:</h3>
        <PlayerList players={gameState.players} myId={gameState.myId} showRoles />
      </div>
    </div>
  );
}
