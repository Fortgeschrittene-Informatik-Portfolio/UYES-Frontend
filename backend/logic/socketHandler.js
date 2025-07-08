import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const avatarFiles = fs.readdirSync(path.join(__dirname, '../../images'))
    .filter(f => /avatar/i.test(f));

const lobbies = {};
// Format: { [gameCode]: { players: [], avatars: {}, maxPlayers: 5, game?: GameState } }

function createDeck() {
    const colors = ['red', 'yellow', 'green', 'blue'];
    const deck = [];
    for (const color of colors) {
        for (let i = 1; i <= 9; i++) {
            deck.push({ color, value: i });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}

function dealInitialCards(game) {
    for (const player of game.turnOrder) {
        game.hands[player] = game.deck.splice(0, 5);
    }
    game.discard.push(game.deck.pop());
}

function nextTurn(game) {
    game.current = (game.current + 1) % game.turnOrder.length;
    return game.turnOrder[game.current];
}

export function setupSocket(io) {
    io.on("connection", (socket) => {
        socket.on("join-lobby", (gameCode, playerName, maxPlayersFromHost) => {
            if (!lobbies[gameCode]) {
                if (maxPlayersFromHost) {
                    lobbies[gameCode] = {
                        players: [],
                        avatars: {},
                        maxPlayers: maxPlayersFromHost || 5
                    };
                } else {
                    socket.emit("lobby-not-found");
                    return;
                }
            }

            socket.join(gameCode);
            socket.data.playerName = playerName; // 🔑 wichtig!

            if (!lobbies[gameCode].players.includes(playerName)) {
                lobbies[gameCode].players.push(playerName);
                const avatars = lobbies[gameCode].avatars;
                if (!avatars[playerName]) {
                    avatars[playerName] = avatarFiles[Math.floor(Math.random() * avatarFiles.length)];
                }
            }

            io.to(gameCode).emit("update-lobby", lobbies[gameCode].players, lobbies[gameCode].maxPlayers, lobbies[gameCode].avatars);

        });
        socket.on("kick-player", (gameCode, playerNameToKick) => {
            if (!lobbies[gameCode]) return;

            lobbies[gameCode].players = lobbies[gameCode].players.filter(p => p !== playerNameToKick);
            delete lobbies[gameCode].avatars[playerNameToKick];
            io.to(gameCode).emit("update-lobby", lobbies[gameCode].players, lobbies[gameCode].maxPlayers, lobbies[gameCode].avatars);

            // Dem gekickten Spieler Bescheid geben & rausschmeißen
            for (const [id, s] of io.sockets.sockets) {
                if (s.data?.playerName === playerNameToKick && s.rooms.has(gameCode)) {
                    s.emit("kicked");
                    s.leave(gameCode);
                }
            }
        });
        socket.on("change-code", (oldCode, newCode) => {
            if (!lobbies[oldCode]) return;

            lobbies[newCode] = lobbies[oldCode];
            delete lobbies[oldCode];

            for (const [_id, s] of io.sockets.sockets) {
                if (s.rooms.has(oldCode)) {
                    s.join(newCode);
                    s.leave(oldCode);
                }
            }

            io.to(newCode).emit("update-code", newCode);
        });
        socket.on("leave-lobby", (gameCode, playerName) => {
            console.log(`🚪 ${playerName} verlässt Lobby ${gameCode}`);

            if (!lobbies[gameCode]) return;

            // Spieler aus der Lobby entfernen
            lobbies[gameCode].players = lobbies[gameCode].players.filter(p => p !== playerName);
            delete lobbies[gameCode].avatars[playerName];

            // Raum verlassen
            socket.leave(gameCode);

            // Wenn leer, löschen
            if (lobbies[gameCode].players.length === 0) {
                delete lobbies[gameCode];
                return;
            }

            // An alle: aktualisierte Spieler
            io.to(gameCode).emit("update-lobby", lobbies[gameCode].players, lobbies[gameCode].maxPlayers, lobbies[gameCode].avatars);
        });

        socket.on('start-game', (gameCode) => {
            const lobby = lobbies[gameCode];
            if (!lobby) return;
            if (lobby.game) return; // already running

            const game = {
                deck: createDeck(),
                discard: [],
                hands: {},
                turnOrder: [...lobby.players],
                current: 0
            };
            dealInitialCards(game);
            lobby.game = game;

            for (const [id, s] of io.sockets.sockets) {
                if (s.rooms.has(gameCode)) {
                    const hand = game.hands[s.data.playerName] || [];
                    s.emit('deal-cards', hand);
                }
            }

            io.to(gameCode).emit('game-started');

            io.to(gameCode).emit('player-turn', game.turnOrder[game.current]);
        });

        socket.on('play-card', (gameCode, card) => {
            const lobby = lobbies[gameCode];
            const game = lobby?.game;
            if (!game) return;
            const player = socket.data.playerName;
            if (game.turnOrder[game.current] !== player) return;

            const hand = game.hands[player];
            const idx = hand.findIndex(c => c.color === card.color && c.value === card.value);
            if (idx === -1) return;
            const played = hand.splice(idx, 1)[0];
            game.discard.push(played);

            io.to(gameCode).emit('card-played', { player, card: played });

            if (hand.length === 0) {
                io.to(gameCode).emit('game-end', player);
                delete lobby.game;
                return;
            }

            const next = nextTurn(game);
            io.to(gameCode).emit('player-turn', next);
        });

        socket.on('draw-card', (gameCode) => {
            const lobby = lobbies[gameCode];
            const game = lobby?.game;
            if (!game) return;
            const player = socket.data.playerName;
            if (game.turnOrder[game.current] !== player) return;

            if (game.deck.length === 0) {
                const top = game.discard.pop();
                game.deck = game.discard.sort(() => Math.random() - 0.5);
                game.discard = [top];
            }
            const card = game.deck.pop();
            game.hands[player].push(card);
            socket.emit('deal-cards', game.hands[player]);

            const next = nextTurn(game);
            io.to(gameCode).emit('player-turn', next);
        });


        socket.on("disconnect", () => {
            console.log(`🛑 Socket getrennt: ${socket.id}`);
            // Optional: du kannst hier aus der Lobby per socket-to-player Map löschen
        });
    });
}

export function getLobbyMeta(code) {
    return lobbies[code] || null;
}