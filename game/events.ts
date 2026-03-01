// Socket event name constants

export const Events = {
  // Client → Server
  CREATE_GAME: 'create_game',
  JOIN_GAME: 'join_game',
  START_GAME: 'start_game',
  NIGHT_ACTION: 'night_action',
  CAST_VOTE: 'cast_vote',
  SKIP_VOTE: 'skip_vote',
  REQUEST_STATE: 'request_state',

  // Server → Client
  GAME_STATE_UPDATE: 'game_state_update',
  DETECTIVE_RESULT: 'detective_result',
  MAFIA_VOTE_UPDATE: 'mafia_vote_update',
  ERROR: 'error',
} as const;
