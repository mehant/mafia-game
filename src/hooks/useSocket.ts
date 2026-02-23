'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket } from '../lib/socket';
import { ClientGameState, DetectiveResult, MafiaVoteUpdate } from '../lib/types';

export function useSocket() {
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectiveResult, setDetectiveResult] = useState<DetectiveResult | null>(null);
  const [mafiaVotes, setMafiaVotes] = useState<MafiaVoteUpdate | null>(null);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    function onConnect() {
      setConnected(true);
    }

    function onDisconnect() {
      setConnected(false);
    }

    function onGameState(state: ClientGameState) {
      setGameState(state);
      setError(null);
    }

    function onError(msg: string) {
      setError(msg);
      // Clear error after 5s
      setTimeout(() => setError(null), 5000);
    }

    function onDetectiveResult(result: DetectiveResult) {
      setDetectiveResult(result);
    }

    function onMafiaVoteUpdate(update: MafiaVoteUpdate) {
      setMafiaVotes(update);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('game_state_update', onGameState);
    socket.on('error', onError);
    socket.on('detective_result', onDetectiveResult);
    socket.on('mafia_vote_update', onMafiaVoteUpdate);

    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('game_state_update', onGameState);
      socket.off('error', onError);
      socket.off('detective_result', onDetectiveResult);
      socket.off('mafia_vote_update', onMafiaVoteUpdate);
    };
  }, []);

  const createGame = useCallback((playerName: string) => {
    socketRef.current.emit('create_game', playerName);
  }, []);

  const joinGame = useCallback((gameId: string, playerName: string) => {
    socketRef.current.emit('join_game', { gameId, playerName });
  }, []);

  const startGame = useCallback(() => {
    socketRef.current.emit('start_game');
  }, []);

  const nightAction = useCallback((targetId: string) => {
    socketRef.current.emit('night_action', { targetId });
  }, []);

  const castVote = useCallback((targetId: string) => {
    socketRef.current.emit('cast_vote', { targetId });
  }, []);

  const skipVote = useCallback(() => {
    socketRef.current.emit('skip_vote');
  }, []);

  return {
    socket: socketRef.current,
    connected,
    gameState,
    error,
    detectiveResult,
    mafiaVotes,
    createGame,
    joinGame,
    startGame,
    nightAction,
    castVote,
    skipVote,
    setDetectiveResult,
  };
}
