import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Mafia Game — Mafia Game Party',
  description: 'Learn what Mafia is and how to play the online social deduction party game at Mafia Game Party — rules, roles, and how it works.',
  robots: 'index, follow',
};

export default function About() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-2">Mafia</h1>
          <p className="text-gray-400">About the game</p>
        </div>

        {/* What is Mafia */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
          <h2 className="text-lg font-bold text-white">What is Mafia?</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            Mafia is a social deduction party game. The town must figure out who
            the Mafia members are and vote them out before the Mafia eliminates
            everyone else. Bluff, deduce, and survive.
          </p>
        </div>

        {/* Roles */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
          <h2 className="text-lg font-bold text-white">Roles</h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-blue-400">Villager</h3>
              <p className="text-gray-400 text-sm">Town-aligned. Votes during the day to eliminate suspected Mafia.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-400">Mafia</h3>
              <p className="text-gray-400 text-sm">Kills a player each night and tries to blend in during the day.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-green-400">Healer</h3>
              <p className="text-gray-400 text-sm">Protects one player each night from being killed.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-yellow-400">Detective</h3>
              <p className="text-gray-400 text-sm">Investigates one player each night to learn if they&apos;re Mafia.</p>
            </div>
          </div>
        </div>

        {/* How to Play */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
          <h2 className="text-lg font-bold text-white">How to Play</h2>
          <ol className="text-gray-300 text-sm leading-relaxed space-y-2 list-decimal list-inside">
            <li>Create a game and share the code with friends (4+ players).</li>
            <li>Roles are assigned randomly when the host starts the game.</li>
            <li><span className="text-gray-100 font-medium">Night:</span> Mafia picks a target, Healer protects, Detective investigates.</li>
            <li><span className="text-gray-100 font-medium">Day:</span> Discuss and vote to eliminate a suspect.</li>
            <li>Town wins by eliminating all Mafia. Mafia wins by outnumbering the town.</li>
          </ol>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
