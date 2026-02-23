'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '../../../hooks/useSocket';
import Lobby from '../../../components/Lobby';
import NightPhase from '../../../components/NightPhase';
import DayPhase from '../../../components/DayPhase';
import GameOver from '../../../components/GameOver';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.gameId as string;
  const {
    connected,
    gameState,
    error,
    startGame,
    nightAction,
    castVote,
    skipVote,
    joinGame,
    detectiveResult,
    mafiaVotes,
    setDetectiveResult,
  } = useSocket();

  const [joining, setJoining] = useState(false);
  const [name, setName] = useState('');

  // If we navigated here directly (not from lobby), show join form
  const needsJoin = connected && !gameState && !joining;

  // Clear detective result when phase changes
  useEffect(() => {
    if (gameState?.phase !== 'night') {
      setDetectiveResult(null);
    }
  }, [gameState?.phase, setDetectiveResult]);

  const handleJoinFromLink = () => {
    if (name.trim()) {
      joinGame(gameId, name.trim());
      setJoining(true);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Connecting...</p>
      </div>
    );
  }

  if (needsJoin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Join Game</h1>
            <p className="text-gray-400">Game: <span className="font-mono">{gameId}</span></p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleJoinFromLink()}
          />
          <button
            onClick={handleJoinFromLink}
            disabled={!name.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-lg font-bold transition-colors"
          >
            Join
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading game...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-lg mx-auto">
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm text-center mb-4">
            {error}
          </div>
        )}

        {gameState.phase === 'lobby' && (
          <Lobby gameState={gameState} onStart={startGame} />
        )}

        {gameState.phase === 'night' && (
          <NightPhase
            gameState={gameState}
            onNightAction={nightAction}
            detectiveResult={detectiveResult}
            mafiaVotes={mafiaVotes}
          />
        )}

        {(gameState.phase === 'day_results' || gameState.phase === 'day_voting') && (
          <DayPhase
            gameState={gameState}
            onVote={castVote}
            onSkip={skipVote}
          />
        )}

        {gameState.phase === 'game_over' && (
          <GameOver gameState={gameState} />
        )}
      </div>
    </div>
  );
}
