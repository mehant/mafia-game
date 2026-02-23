import { Server, Socket } from 'socket.io';
import { GameState, Phase, Player, NightActions, NightResult } from './types';
import { Events } from './events';
import { assignRoles } from './roles';
import { ClientGameState, ClientPlayer, ClientVoteState, DetectiveResult, MafiaVoteUpdate } from '../src/lib/types';

const NIGHT_TIMEOUT_MS = 60_000;
const DAY_VOTING_MS = 5 * 60_000;

export class Game {
  private state: GameState;
  private io: Server;
  private nightTimer: NodeJS.Timeout | null = null;
  private dayTimer: NodeJS.Timeout | null = null;
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(io: Server, gameId: string, hostId: string, hostName: string) {
    this.io = io;
    this.state = {
      id: gameId,
      phase: 'lobby',
      players: new Map(),
      hostId,
      round: 0,
      nightActions: this.freshNightActions(),
      voteState: { votes: new Map() },
      nightResult: null,
      winner: null,
      dayTimerEnd: null,
      nightTimerEnd: null,
      lastHealerTarget: null,
    };
    this.addPlayer(hostId, hostName);
  }

  private freshNightActions(): NightActions {
    return {
      mafiaTarget: null,
      healerTarget: null,
      detectiveTarget: null,
      mafiaVotes: new Map(),
    };
  }

  // --- Player Management ---

  addPlayer(socketId: string, name: string): Player | null {
    if (this.state.phase !== 'lobby') return null;
    if (this.state.players.has(socketId)) return null;

    const player: Player = {
      id: socketId,
      name,
      role: null,
      alive: true,
      connected: true,
    };
    this.state.players.set(socketId, player);
    this.broadcastState();
    return player;
  }

  removePlayer(socketId: string): void {
    if (this.state.phase === 'lobby') {
      this.state.players.delete(socketId);
      // If host left, assign new host
      if (socketId === this.state.hostId && this.state.players.size > 0) {
        this.state.hostId = this.state.players.keys().next().value!;
      }
      this.broadcastState();
    } else {
      // During game, mark as disconnected with reconnect window
      const player = this.state.players.get(socketId);
      if (player) {
        player.connected = false;
        this.broadcastState();

        // 30s reconnect window
        const timer = setTimeout(() => {
          this.handlePlayerAbandon(socketId);
        }, 30_000);
        this.disconnectTimers.set(socketId, timer);
      }
    }
  }

  reconnectPlayer(oldSocketId: string, newSocketId: string): boolean {
    const player = this.state.players.get(oldSocketId);
    if (!player) return false;

    // Clear disconnect timer
    const timer = this.disconnectTimers.get(oldSocketId);
    if (timer) {
      clearTimeout(timer);
      this.disconnectTimers.delete(oldSocketId);
    }

    // Move to new socket ID
    this.state.players.delete(oldSocketId);
    player.id = newSocketId;
    player.connected = true;
    this.state.players.set(newSocketId, player);

    if (this.state.hostId === oldSocketId) {
      this.state.hostId = newSocketId;
    }

    this.broadcastState();
    return true;
  }

  private handlePlayerAbandon(socketId: string): void {
    const player = this.state.players.get(socketId);
    if (!player) return;
    player.alive = false;
    player.connected = false;
    this.disconnectTimers.delete(socketId);

    // Check if this triggers end of night/vote/game
    this.checkNightComplete();
    this.checkVotesComplete();
    if (this.checkWinCondition()) return;
    this.broadcastState();
  }

  hasPlayer(socketId: string): boolean {
    return this.state.players.has(socketId);
  }

  getPlayerByName(name: string): Player | undefined {
    for (const p of this.state.players.values()) {
      if (p.name === name) return p;
    }
    return undefined;
  }

  get playerCount(): number {
    return this.state.players.size;
  }

  get phase(): Phase {
    return this.state.phase;
  }

  get gameId(): string {
    return this.state.id;
  }

  // --- Game Flow ---

  startGame(requesterId: string): string | null {
    if (requesterId !== this.state.hostId) return 'Only the host can start the game';
    if (this.state.phase !== 'lobby') return 'Game already started';
    if (this.state.players.size < 4) return 'Need at least 4 players';

    const playerIds = Array.from(this.state.players.keys());
    const roles = assignRoles(playerIds.length);

    playerIds.forEach((id, i) => {
      const player = this.state.players.get(id)!;
      player.role = roles[i];
    });

    this.transitionToNight();
    return null;
  }

  private transitionToNight(): void {
    this.state.phase = 'night';
    this.state.round++;
    this.state.nightActions = this.freshNightActions();
    this.state.nightResult = null;

    const nightEnd = Date.now() + NIGHT_TIMEOUT_MS;
    this.state.nightTimerEnd = nightEnd;

    this.nightTimer = setTimeout(() => {
      this.resolveNight();
    }, NIGHT_TIMEOUT_MS);

    this.broadcastState();
  }

  handleNightAction(playerId: string, targetId: string): string | null {
    if (this.state.phase !== 'night') return 'Not night phase';

    const player = this.state.players.get(playerId);
    if (!player || !player.alive) return 'Invalid player';

    const target = this.state.players.get(targetId);
    if (!target || !target.alive) return 'Invalid target';

    switch (player.role) {
      case 'mafia': {
        if (targetId === playerId) return 'Cannot target yourself';
        this.state.nightActions.mafiaVotes.set(playerId, targetId);
        // Resolve mafia target by majority
        this.resolveMafiaTarget();
        // Notify all mafia of the vote update
        this.broadcastMafiaVoteUpdate();
        break;
      }
      case 'healer': {
        if (targetId === this.state.lastHealerTarget) {
          return 'Cannot heal the same player twice in a row';
        }
        this.state.nightActions.healerTarget = targetId;
        break;
      }
      case 'detective': {
        if (targetId === playerId) return 'Cannot investigate yourself';
        this.state.nightActions.detectiveTarget = targetId;
        // Send result immediately
        const isMafia = target.role === 'mafia';
        const result: DetectiveResult = {
          targetId: target.id,
          targetName: target.name,
          isMafia,
        };
        this.io.to(playerId).emit(Events.DETECTIVE_RESULT, result);
        break;
      }
      case 'villager':
        return 'Villagers have no night action';
      default:
        return 'Invalid role';
    }

    this.broadcastState();
    this.checkNightComplete();
    return null;
  }

  private resolveMafiaTarget(): void {
    const votes = this.state.nightActions.mafiaVotes;
    if (votes.size === 0) return;

    // Count votes per target
    const targetCounts = new Map<string, number>();
    for (const targetId of votes.values()) {
      targetCounts.set(targetId, (targetCounts.get(targetId) || 0) + 1);
    }

    // Pick target with most votes (first one wins ties)
    let maxVotes = 0;
    let chosenTarget: string | null = null;
    for (const [targetId, count] of targetCounts) {
      if (count > maxVotes) {
        maxVotes = count;
        chosenTarget = targetId;
      }
    }

    this.state.nightActions.mafiaTarget = chosenTarget;
  }

  private broadcastMafiaVoteUpdate(): void {
    const mafiaPlayers = this.getPlayersByRole('mafia');
    const votesObj: Record<string, string> = {};
    for (const [voterId, targetId] of this.state.nightActions.mafiaVotes) {
      votesObj[voterId] = targetId;
    }
    const update: MafiaVoteUpdate = { votes: votesObj };
    for (const mp of mafiaPlayers) {
      this.io.to(mp.id).emit(Events.MAFIA_VOTE_UPDATE, update);
    }
  }

  private checkNightComplete(): void {
    if (this.state.phase !== 'night') return;

    const alivePlayers = this.getAlivePlayers();
    let allActed = true;

    for (const p of alivePlayers) {
      switch (p.role) {
        case 'mafia':
          if (!this.state.nightActions.mafiaVotes.has(p.id)) allActed = false;
          break;
        case 'healer':
          if (this.state.nightActions.healerTarget === null) allActed = false;
          break;
        case 'detective':
          if (this.state.nightActions.detectiveTarget === null) allActed = false;
          break;
        // Villagers don't act
      }
    }

    if (allActed) {
      this.resolveNight();
    }
  }

  private resolveNight(): void {
    if (this.state.phase !== 'night') return;

    if (this.nightTimer) {
      clearTimeout(this.nightTimer);
      this.nightTimer = null;
    }

    this.resolveMafiaTarget(); // finalize

    const mafiaTarget = this.state.nightActions.mafiaTarget;
    const healerTarget = this.state.nightActions.healerTarget;

    // Track healer target for next round constraint
    this.state.lastHealerTarget = healerTarget;

    let killed: string | null = null;
    let killedName: string | null = null;
    let saved = false;

    if (mafiaTarget) {
      if (mafiaTarget === healerTarget) {
        saved = true;
      } else {
        const victim = this.state.players.get(mafiaTarget);
        if (victim) {
          victim.alive = false;
          killed = victim.id;
          killedName = victim.name;
        }
      }
    }

    this.state.nightResult = { killed, killedName, saved };
    this.state.nightTimerEnd = null;

    // Check win condition after kill
    if (this.checkWinCondition()) return;

    this.transitionToDayResults();
  }

  private transitionToDayResults(): void {
    this.state.phase = 'day_results';
    this.broadcastState();

    // Auto-advance to voting after 10 seconds
    setTimeout(() => {
      if (this.state.phase === 'day_results') {
        this.transitionToDayVoting();
      }
    }, 10_000);
  }

  private transitionToDayVoting(): void {
    this.state.phase = 'day_voting';
    this.state.voteState = { votes: new Map() };

    const dayEnd = Date.now() + DAY_VOTING_MS;
    this.state.dayTimerEnd = dayEnd;

    this.dayTimer = setTimeout(() => {
      this.resolveVotes();
    }, DAY_VOTING_MS);

    this.broadcastState();
  }

  handleVote(voterId: string, targetId: string | null): string | null {
    if (this.state.phase !== 'day_voting') return 'Not voting phase';

    const voter = this.state.players.get(voterId);
    if (!voter || !voter.alive) return 'Invalid voter';

    if (targetId !== null) {
      const target = this.state.players.get(targetId);
      if (!target || !target.alive) return 'Invalid target';
      if (targetId === voterId) return 'Cannot vote for yourself';
    }

    this.state.voteState.votes.set(voterId, targetId);
    this.broadcastState();
    this.checkVotesComplete();
    return null;
  }

  private checkVotesComplete(): void {
    if (this.state.phase !== 'day_voting') return;

    const alivePlayers = this.getAlivePlayers();
    const voteCount = this.state.voteState.votes.size;

    if (voteCount >= alivePlayers.length) {
      this.resolveVotes();
    }
  }

  private resolveVotes(): void {
    if (this.state.phase !== 'day_voting') return;

    if (this.dayTimer) {
      clearTimeout(this.dayTimer);
      this.dayTimer = null;
    }

    const votes = this.state.voteState.votes;
    const targetCounts = new Map<string, number>();
    let skipCount = 0;

    for (const targetId of votes.values()) {
      if (targetId === null) {
        skipCount++;
      } else {
        targetCounts.set(targetId, (targetCounts.get(targetId) || 0) + 1);
      }
    }

    // Find the player with the most votes
    let maxVotes = 0;
    let eliminated: string | null = null;
    let tie = false;

    for (const [targetId, count] of targetCounts) {
      if (count > maxVotes) {
        maxVotes = count;
        eliminated = targetId;
        tie = false;
      } else if (count === maxVotes) {
        tie = true;
      }
    }

    // Ties or skips >= max votes => no elimination
    if (tie || skipCount >= maxVotes) {
      eliminated = null;
    }

    if (eliminated) {
      const player = this.state.players.get(eliminated);
      if (player) {
        player.alive = false;
      }
    }

    this.state.dayTimerEnd = null;

    if (this.checkWinCondition()) return;

    this.transitionToNight();
  }

  private checkWinCondition(): boolean {
    const alive = this.getAlivePlayers();
    const mafiaAlive = alive.filter(p => p.role === 'mafia').length;
    const nonMafiaAlive = alive.length - mafiaAlive;

    if (mafiaAlive === 0) {
      this.state.winner = 'villagers';
      this.endGame();
      return true;
    }

    if (mafiaAlive >= nonMafiaAlive) {
      this.state.winner = 'mafia';
      this.endGame();
      return true;
    }

    return false;
  }

  private endGame(): void {
    this.state.phase = 'game_over';
    if (this.nightTimer) clearTimeout(this.nightTimer);
    if (this.dayTimer) clearTimeout(this.dayTimer);
    this.nightTimer = null;
    this.dayTimer = null;
    this.broadcastState();
  }

  // --- State Broadcasting ---

  broadcastState(): void {
    for (const player of this.state.players.values()) {
      if (player.connected) {
        const clientState = this.getClientState(player.id);
        this.io.to(player.id).emit(Events.GAME_STATE_UPDATE, clientState);
      }
    }
  }

  getClientState(forPlayerId: string): ClientGameState {
    const me = this.state.players.get(forPlayerId);
    const isGameOver = this.state.phase === 'game_over';

    const players: ClientPlayer[] = Array.from(this.state.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      role: (p.id === forPlayerId || isGameOver || !p.alive) ? p.role : null,
      alive: p.alive,
      connected: p.connected,
    }));

    const alivePlayers = Array.from(this.state.players.values()).filter(p => p.alive);
    const mafiaAlive = alivePlayers.filter(p => p.role === 'mafia').length;

    // Vote state: during voting, only show who has voted (not targets) until resolved
    let voteState: ClientVoteState | null = null;
    if (this.state.phase === 'day_voting') {
      const votedPlayerIds = Array.from(this.state.voteState.votes.keys());
      // Only show full votes to allow transparency after you've voted
      const hasVoted = this.state.voteState.votes.has(forPlayerId);
      const votes: Record<string, string | null> = {};
      if (hasVoted) {
        for (const [voterId, targetId] of this.state.voteState.votes) {
          votes[voterId] = targetId;
        }
      }
      voteState = { votes, votedPlayerIds };
    }

    // Night action submitted check
    let nightActionSubmitted = false;
    if (this.state.phase === 'night' && me) {
      switch (me.role) {
        case 'mafia':
          nightActionSubmitted = this.state.nightActions.mafiaVotes.has(forPlayerId);
          break;
        case 'healer':
          nightActionSubmitted = this.state.nightActions.healerTarget !== null;
          break;
        case 'detective':
          nightActionSubmitted = this.state.nightActions.detectiveTarget !== null;
          break;
        case 'villager':
          nightActionSubmitted = true; // villagers have nothing to do
          break;
      }
    }

    // Mafia teammates (only for mafia players)
    let mafiaTeammates: string[] | null = null;
    if (me?.role === 'mafia') {
      mafiaTeammates = Array.from(this.state.players.values())
        .filter(p => p.role === 'mafia' && p.id !== forPlayerId)
        .map(p => p.name);
    }

    return {
      id: this.state.id,
      phase: this.state.phase,
      players,
      hostId: this.state.hostId,
      myId: forPlayerId,
      round: this.state.round,
      nightResult: this.state.nightResult,
      voteState,
      winner: this.state.winner,
      dayTimerEnd: this.state.dayTimerEnd,
      nightTimerEnd: this.state.nightTimerEnd,
      nightActionSubmitted,
      mafiaTeammates,
      aliveMafiaCount: mafiaAlive,
      alivePlayerCount: alivePlayers.length,
    };
  }

  // --- Helpers ---

  private getAlivePlayers(): Player[] {
    return Array.from(this.state.players.values()).filter(p => p.alive);
  }

  private getPlayersByRole(role: string): Player[] {
    return Array.from(this.state.players.values()).filter(p => p.role === role && p.alive);
  }

  cleanup(): void {
    if (this.nightTimer) clearTimeout(this.nightTimer);
    if (this.dayTimer) clearTimeout(this.dayTimer);
    for (const timer of this.disconnectTimers.values()) {
      clearTimeout(timer);
    }
  }
}
