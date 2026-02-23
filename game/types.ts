// Server-side types (full state with secrets)

export type Role = 'villager' | 'mafia' | 'healer' | 'detective';

export type Phase =
  | 'lobby'
  | 'night'
  | 'day_results'
  | 'day_voting'
  | 'game_over';

export interface Player {
  id: string;        // socket ID
  name: string;
  role: Role | null;
  alive: boolean;
  connected: boolean;
}

export interface NightActions {
  mafiaTarget: string | null;
  healerTarget: string | null;
  detectiveTarget: string | null;
  mafiaVotes: Map<string, string>; // mafiaPlayerId -> targetId
}

export interface VoteState {
  votes: Map<string, string | null>; // voterId -> targetId (null = skip)
}

export interface NightResult {
  killed: string | null;      // player ID who died, null if saved
  killedName: string | null;
  saved: boolean;             // was someone saved by healer?
}

export interface GameState {
  id: string;
  phase: Phase;
  players: Map<string, Player>;
  hostId: string;
  round: number;
  nightActions: NightActions;
  voteState: VoteState;
  nightResult: NightResult | null;
  winner: 'villagers' | 'mafia' | null;
  dayTimerEnd: number | null;     // timestamp when day voting ends
  nightTimerEnd: number | null;   // timestamp when night actions timeout
  lastHealerTarget: string | null; // healer can't heal same player twice in a row
}
