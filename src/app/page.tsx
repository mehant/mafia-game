'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSocket } from '../hooks/useSocket';

export default function Home() {
  const [name, setName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const { connected, createGame, joinGame, gameState, error } = useSocket();
  const router = useRouter();

  // Navigate when we get a game state
  useEffect(() => {
    if (gameState) {
      router.push(`/game/${gameState.id}`);
    }
  }, [gameState, router]);

  const handleCreate = () => {
    if (name.trim()) {
      createGame(name.trim());
    }
  };

  const handleJoin = () => {
    if (name.trim() && gameCode.trim()) {
      joinGame(gameCode.trim(), name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-2">Mafia</h1>
          <p className="text-gray-400">The classic party game, online</p>
          <div className={`mt-2 text-xs ${connected ? 'text-green-500' : 'text-red-500'}`}>
            {connected ? 'Connected' : 'Connecting...'}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {mode === 'menu' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              disabled={!connected}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-4 rounded-xl font-bold text-lg transition-colors"
            >
              Create Game
            </button>
            <button
              onClick={() => setMode('join')}
              disabled={!connected}
              className="w-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white py-4 rounded-xl font-bold text-lg border border-gray-700 transition-colors"
            >
              Join Game
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-lg font-bold transition-colors"
            >
              Create Game
            </button>
            <button
              onClick={() => setMode('menu')}
              className="w-full text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <input
              type="text"
              placeholder="Game code"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value)}
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <button
              onClick={handleJoin}
              disabled={!name.trim() || !gameCode.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-lg font-bold transition-colors"
            >
              Join Game
            </button>
            <button
              onClick={() => setMode('menu')}
              className="w-full text-gray-500 hover:text-gray-300 text-sm transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {/* Game Rules */}
        <div className="text-center text-xs text-gray-600 space-y-1">
          <p>4+ players needed. No account required.</p>
          <p>Create a game, share the link, and play!</p>
          <p><Link href="/about" className="inline-block mt-2 text-gray-500 hover:text-gray-300 transition-colors">
            About the game
          </Link> </p>
          <Link href="/profile" className="inline-block mt-2 text-gray-500 hover:text-gray-300 transition-colors">
            About me
          </Link>
        </div>
      </div>
    </div>
  );
}
