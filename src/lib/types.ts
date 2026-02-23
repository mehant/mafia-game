// Client-safe types (no secret information)

export type Role = 'villager' | 'mafia' | 'healer' | 'detective';

export type Phase =
  | 'lobby'
  | 'night'
  | 'day_results'
  | 'day_voting'
  | 'game_over';

export interface ClientPlayer {
  id: string;
  name: string;
  role: Role | null;  // only visible for self, dead players, or game_over
  alive: boolean;
  connected: boolean;
}

export interface ClientNightResult {
  killed: string | null;
  killedName: string | null;
  saved: boolean;
}

export interface ClientVoteState {
  votes: Record<string, string | null>; // voterId -> targetId
  votedPlayerIds: string[];             // who has voted (without revealing targets until done)
}

export interface ClientGameState {
  id: string;
  phase: Phase;
  players: ClientPlayer[];
  hostId: string;
  myId: string;
  round: number;
  nightResult: ClientNightResult | null;
  voteState: ClientVoteState | null;
  winner: 'villagers' | 'mafia' | null;
  dayTimerEnd: number | null;
  nightTimerEnd: number | null;
  nightActionSubmitted: boolean;     // has this player submitted their night action?
  mafiaTeammates: string[] | null;   // only for mafia players
  aliveMafiaCount: number;
  alivePlayerCount: number;
}

// Socket event payloads
export interface DetectiveResult {
  targetId: string;
  targetName: string;
  isMafia: boolean;
}

export interface MafiaVoteUpdate {
  votes: Record<string, string>; // mafiaPlayerId -> targetId
}
