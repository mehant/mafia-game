import { Server, Socket } from 'socket.io';
import { nanoid } from 'nanoid';
import { Game } from './Game';
import { Events } from './events';

const MAX_PLAYERS = 15;

export class GameManager {
  private games: Map<string, Game> = new Map();
  private playerToGame: Map<string, string> = new Map(); // socketId -> gameId
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  setupSocket(socket: Socket): void {
    socket.on(Events.CREATE_GAME, (playerName: string) => {
      this.handleCreateGame(socket, playerName);
    });

    socket.on(Events.JOIN_GAME, (data: { gameId: string; playerName: string }) => {
      this.handleJoinGame(socket, data.gameId, data.playerName);
    });

    socket.on(Events.START_GAME, () => {
      this.handleStartGame(socket);
    });

    socket.on(Events.NIGHT_ACTION, (data: { targetId: string }) => {
      this.handleNightAction(socket, data.targetId);
    });

    socket.on(Events.CAST_VOTE, (data: { targetId: string }) => {
      this.handleCastVote(socket, data.targetId);
    });

    socket.on(Events.SKIP_VOTE, () => {
      this.handleSkipVote(socket);
    });

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  private handleCreateGame(socket: Socket, playerName: string): void {
    const name = playerName?.trim();
    if (!name || name.length > 20) {
      socket.emit(Events.ERROR, 'Name must be 1-20 characters');
      return;
    }

    const gameId = nanoid(6);
    const game = new Game(this.io, gameId, socket.id, name);
    this.games.set(gameId, game);
    this.playerToGame.set(socket.id, gameId);
    socket.join(gameId);

    game.broadcastState();
  }

  private handleJoinGame(socket: Socket, gameId: string, playerName: string): void {
    const name = playerName?.trim();
    if (!name || name.length > 20) {
      socket.emit(Events.ERROR, 'Name must be 1-20 characters');
      return;
    }

    const game = this.games.get(gameId);
    if (!game) {
      socket.emit(Events.ERROR, 'Game not found');
      return;
    }

    if (game.phase !== 'lobby') {
      // Try reconnect by name
      const existingPlayer = game.getPlayerByName(name);
      if (existingPlayer && !existingPlayer.connected) {
        const success = game.reconnectPlayer(existingPlayer.id, socket.id);
        if (success) {
          this.playerToGame.set(socket.id, gameId);
          socket.join(gameId);
          return;
        }
      }
      socket.emit(Events.ERROR, 'Game already in progress');
      return;
    }

    if (game.playerCount >= MAX_PLAYERS) {
      socket.emit(Events.ERROR, 'Game is full');
      return;
    }

    // Check duplicate names
    if (game.getPlayerByName(name)) {
      socket.emit(Events.ERROR, 'Name already taken');
      return;
    }

    const player = game.addPlayer(socket.id, name);
    if (!player) {
      socket.emit(Events.ERROR, 'Could not join game');
      return;
    }

    this.playerToGame.set(socket.id, gameId);
    socket.join(gameId);
  }

  private handleStartGame(socket: Socket): void {
    const game = this.getGameForSocket(socket);
    if (!game) return;

    const error = game.startGame(socket.id);
    if (error) {
      socket.emit(Events.ERROR, error);
    }
  }

  private handleNightAction(socket: Socket, targetId: string): void {
    const game = this.getGameForSocket(socket);
    if (!game) return;

    const error = game.handleNightAction(socket.id, targetId);
    if (error) {
      socket.emit(Events.ERROR, error);
    }
  }

  private handleCastVote(socket: Socket, targetId: string): void {
    const game = this.getGameForSocket(socket);
    if (!game) return;

    const error = game.handleVote(socket.id, targetId);
    if (error) {
      socket.emit(Events.ERROR, error);
    }
  }

  private handleSkipVote(socket: Socket): void {
    const game = this.getGameForSocket(socket);
    if (!game) return;

    const error = game.handleVote(socket.id, null);
    if (error) {
      socket.emit(Events.ERROR, error);
    }
  }

  private handleDisconnect(socket: Socket): void {
    const gameId = this.playerToGame.get(socket.id);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game) return;

    game.removePlayer(socket.id);
    this.playerToGame.delete(socket.id);

    // Clean up empty games
    if (game.playerCount === 0) {
      game.cleanup();
      this.games.delete(gameId);
    }
  }

  private getGameForSocket(socket: Socket): Game | null {
    const gameId = this.playerToGame.get(socket.id);
    if (!gameId) {
      socket.emit(Events.ERROR, 'Not in a game');
      return null;
    }
    const game = this.games.get(gameId);
    if (!game) {
      socket.emit(Events.ERROR, 'Game not found');
      return null;
    }
    return game;
  }
}
