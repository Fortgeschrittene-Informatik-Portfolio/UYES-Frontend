export const lobbies = {};

export function getLobbyMeta(code) {
  return lobbies[code] || null;
}

export function notifyHost(io, gameCode, hostName) {
  if (!hostName) return;
  for (const [_id, s] of io.sockets.sockets) {
    if (s.data.playerName === hostName && s.rooms.has(gameCode)) {
      s.emit('host-assigned');
      break;
    }
  }
}

export function broadcastHandCounts(io, gameCode, game) {
  const g = game || lobbies[gameCode]?.game;
  if (!g) return;
  const counts = g.turnOrder.map((name) => ({
    name,
    count: g.hands[name]?.length || 0,
  }));
  io.to(gameCode).emit('update-hand-counts', counts);
}

export function registerLobbyHandlers(io, socket, avatarFiles) {
  socket.on('join-lobby', (gameCode, playerName, maxPlayersFromHost) => {
    if (!lobbies[gameCode]) {
      if (maxPlayersFromHost) {
        lobbies[gameCode] = {
          host: playerName,
          players: [],
          avatars: {},
          maxPlayers: maxPlayersFromHost || 5,
          settings: socket.data.session?.settings || {},
        };
        console.log(`\u{1F195} Lobby ${gameCode} erstellt von ${playerName}`);
      } else {
        socket.emit('lobby-not-found');
        return;
      }
    }

    const lobby = lobbies[gameCode];

    if (lobby.game && !lobby.players.includes(playerName)) {
      socket.emit('game-in-progress');
      return;
    }

    if (
      lobby.players.length >= lobby.maxPlayers &&
      !lobby.players.includes(playerName)
    ) {
      socket.emit('lobby-full');
      return;
    }

    socket.join(gameCode);
    socket.data.playerName = playerName;

    if (!lobbies[gameCode].players.includes(playerName)) {
      lobbies[gameCode].players.push(playerName);
      const avatars = lobbies[gameCode].avatars;
      if (!avatars[playerName]) {
        avatars[playerName] =
          avatarFiles[Math.floor(Math.random() * avatarFiles.length)];
      }
    }

    io.to(gameCode).emit(
      'update-lobby',
      lobbies[gameCode].players,
      lobbies[gameCode].maxPlayers,
      lobbies[gameCode].avatars,
      lobbies[gameCode].host,
    );

    const runningGame = lobbies[gameCode].game;
    if (runningGame) {
      socket.emit('game-started');
      const hand = runningGame.hands[playerName] || [];
      socket.emit('deal-cards', hand);
      const topCard = runningGame.discard[runningGame.discard.length - 1];
      socket.emit('card-played', { player: null, card: topCard });
      broadcastHandCounts(io, gameCode, runningGame);
      socket.emit('player-turn', {
        player: runningGame.turnOrder[runningGame.current],
        startedAt: runningGame.turnStartedAt,
        drawStack: runningGame.drawStack || 0,
      });
    }
  });

  socket.on('kick-player', (gameCode, playerNameToKick) => {
    if (!lobbies[gameCode]) return;

    lobbies[gameCode].players = lobbies[gameCode].players.filter(
      (p) => p !== playerNameToKick,
    );
    delete lobbies[gameCode].avatars[playerNameToKick];
    if (lobbies[gameCode].host === playerNameToKick) {
      lobbies[gameCode].host = lobbies[gameCode].players[0] || null;
      notifyHost(io, gameCode, lobbies[gameCode].host);
    }
    if (lobbies[gameCode].game) {
      lobbies[gameCode].maxPlayers = lobbies[gameCode].players.length;
    }
    io.to(gameCode).emit(
      'update-lobby',
      lobbies[gameCode].players,
      lobbies[gameCode].maxPlayers,
      lobbies[gameCode].avatars,
      lobbies[gameCode].host,
    );

    for (const [id, s] of io.sockets.sockets) {
      if (s.data?.playerName === playerNameToKick && s.rooms.has(gameCode)) {
        s.emit('kicked');
        s.leave(gameCode);
      }
    }
  });

  socket.on('close-lobby', (gameCode) => {
    const lobby = lobbies[gameCode];
    if (!lobby) return;
    if (lobby.host && socket.data.playerName !== lobby.host) return;

    for (const player of lobby.players) {
      if (player === socket.data.playerName) continue;
      for (const [_id, s] of io.sockets.sockets) {
        if (s.data?.playerName === player && s.rooms.has(gameCode)) {
          s.emit('kicked');
          s.leave(gameCode);
        }
      }
    }
    socket.leave(gameCode);
    delete lobbies[gameCode];
    console.log(
      `\u{1F512} Lobby ${gameCode} geschlossen von ${socket.data.playerName}`,
    );
  });

  socket.on('change-code', (oldCode, newCode) => {
    if (!lobbies[oldCode]) return;

    lobbies[newCode] = lobbies[oldCode];
    delete lobbies[oldCode];

    for (const [_id, s] of io.sockets.sockets) {
      if (s.rooms.has(oldCode)) {
        s.join(newCode);
        s.leave(oldCode);
      }
    }

    io.to(newCode).emit('update-code', newCode);
  });

  socket.on('leave-lobby', (gameCode, playerName) => {
    if (!lobbies[gameCode]) return;

    lobbies[gameCode].players = lobbies[gameCode].players.filter(
      (p) => p !== playerName,
    );
    delete lobbies[gameCode].avatars[playerName];
    if (lobbies[gameCode].host === playerName) {
      lobbies[gameCode].host = lobbies[gameCode].players[0] || null;
      notifyHost(io, gameCode, lobbies[gameCode].host);
    }

    socket.leave(gameCode);

    if (lobbies[gameCode].players.length === 0) {
      delete lobbies[gameCode];
      return;
    }

    io.to(gameCode).emit(
      'update-lobby',
      lobbies[gameCode].players,
      lobbies[gameCode].maxPlayers,
      lobbies[gameCode].avatars,
      lobbies[gameCode].host,
    );
  });
}
