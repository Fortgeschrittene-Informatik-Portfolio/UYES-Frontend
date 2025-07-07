const lobbies = {};
// Format: { [gameCode]: { players: [], maxPlayers: 5 } }

export function setupSocket(io) {
    io.on("connection", (socket) => {
        socket.on("join-lobby", (gameCode, playerName, maxPlayersFromHost) => {
            socket.join(gameCode);
            socket.data.playerName = playerName; // 🔑 wichtig!

            if (!lobbies[gameCode]) {
                lobbies[gameCode] = {
                    players: [],
                    maxPlayers: maxPlayersFromHost || 5
                };
            }

            if (!lobbies[gameCode].players.includes(playerName)) {
                lobbies[gameCode].players.push(playerName);
            }

            io.to(gameCode).emit("update-lobby", lobbies[gameCode].players, lobbies[gameCode].maxPlayers);

        });
        socket.on("kick-player", (gameCode, playerNameToKick) => {
            if (!lobbies[gameCode]) return;

            lobbies[gameCode].players = lobbies[gameCode].players.filter(p => p !== playerNameToKick);
            io.to(gameCode).emit("update-lobby", lobbies[gameCode].players);

            // Dem gekickten Spieler Bescheid geben & rausschmeißen
            for (const [id, s] of io.sockets.sockets) {
                if (s.data?.playerName === playerNameToKick && s.rooms.has(gameCode)) {
                    s.emit("kicked");
                    s.leave(gameCode);
                }
            }
        });
    });
}

export function getLobbyMeta(code) {
    return lobbies[code] || null;
}