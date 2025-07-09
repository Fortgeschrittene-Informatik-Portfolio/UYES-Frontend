
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const avatarFiles = fs
  .readdirSync(path.join(__dirname, "../../public/images/avatars"))
  .filter(f => /avatar/i.test(f));

import { getSession } from '../jwtSession.js';


const lobbies = {};
// Format: { [gameCode]: { players: [], avatars: {}, maxPlayers: 5, host: string, game?: GameState } }


function createDeck(settings = {}) {
    const colors = ['red', 'yellow', 'green', 'blue'];
    const deck = [];
    for (const color of colors) {
        for (let i = 1; i <= 9; i++) {
            deck.push({ color, value: i });
        }
        if (settings.draw2) deck.push({ color, value: 'draw2' });
        if (settings.reverse) deck.push({ color, value: 'reverse' });
        if (settings.skip) deck.push({ color, value: 'skip' });
    }
    if (settings.wild) {
        for (let i = 0; i < 4; i++) deck.push({ color: 'wild', value: 'wild' });
    }
    if (settings.wild4) {
        for (let i = 0; i < 4; i++) deck.push({ color: 'wild', value: 'wild4' });
    }
    return deck.sort(() => Math.random() - 0.5);
}

function dealInitialCards(game, count = 5, deckSettings = {}) {
    const required = count * game.turnOrder.length + 1;
    // If there are not enough cards, generate additional decks
    while (game.deck.length < required) {
        game.deck = game.deck.concat(createDeck(deckSettings));
    }
    for (const player of game.turnOrder) {
        game.hands[player] = game.deck.splice(0, count);
    }
    game.discard.push(game.deck.pop());
}

function nextTurn(game) {
    game.current = (game.current + 1) % game.turnOrder.length;
    return game.turnOrder[game.current];
}

function drawCards(game, player, count) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
        if (game.deck.length === 0) {
            const top = game.discard.pop();
            game.deck = game.discard.sort(() => Math.random() - 0.5);
            game.discard = [top];
        }
        const card = game.deck.pop();
        game.hands[player].push(card);
        drawn.push(card);
    }
    return drawn;
}

function getSessionFromSocket(socket) {
    const cookieStr = socket.handshake.headers.cookie || '';
    const cookies = {};
    for (const part of cookieStr.split(';')) {
        const [key, ...val] = part.trim().split('=');
        if (!key) continue;
        cookies[key] = decodeURIComponent(val.join('='));
    }
    return getSession({ cookies });
}

function broadcastHandCounts(io, gameCode, game) {
    const g = game || lobbies[gameCode]?.game;
    if (!g) return;
    const counts = g.turnOrder.map(name => ({ name, count: g.hands[name]?.length || 0 }));
    io.to(gameCode).emit('update-hand-counts', counts);

}

function handleUyesEnd(io, gameCode, game, player) {
    const pressed = !!game.uyesPressed[player];
    delete game.uyesPressed[player];

    const hasOne = game.hands[player]?.length === 1;

    if (pressed && hasOne) {
        io.to(gameCode).emit('player-uyes', { player, active: true });
        return;
    }

    io.to(gameCode).emit('player-uyes', { player, active: false });
    if (pressed || hasOne) {
        drawCards(game, player, 1);
        for (const [_id, s] of io.sockets.sockets) {
            if (s.data.playerName === player && s.rooms.has(gameCode)) {
                s.emit('deal-cards', game.hands[player]);
            }
        }
        broadcastHandCounts(io, gameCode, game);
    }
}

export function setupSocket(io) {
    io.on("connection", (socket) => {
        socket.data.session = getSessionFromSocket(socket);
        socket.on("join-lobby", (gameCode, playerName, maxPlayersFromHost) => {
            if (!lobbies[gameCode]) {
                if (maxPlayersFromHost) {
                    lobbies[gameCode] = {
                        host: playerName,
                        players: [],
                        avatars: {},
                        maxPlayers: maxPlayersFromHost || 5,
                        settings: socket.data.session?.settings || {}
                    };
                } else {
                    socket.emit("lobby-not-found");
                    return;
                }
            }

            const lobby = lobbies[gameCode];

            if (lobby.players.length >= lobby.maxPlayers && !lobby.players.includes(playerName)) {
                socket.emit("lobby-full");
                return;
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

            io.to(gameCode).emit(
                "update-lobby",
                lobbies[gameCode].players,
                lobbies[gameCode].maxPlayers,
                lobbies[gameCode].avatars,
                lobbies[gameCode].host
            );

            // Wenn das Spiel bereits läuft, neuen/verbindenden Spielern den aktuellen
            // Spielzustand senden, damit sie ihre Hand, den Ablagestapel und
            // die anstehende Runde sehen können.
            const runningGame = lobbies[gameCode].game;
            if (runningGame) {
                const hand = runningGame.hands[playerName] || [];
                socket.emit('deal-cards', hand);
                const topCard = runningGame.discard[runningGame.discard.length - 1];
                socket.emit('card-played', { player: null, card: topCard });
                broadcastHandCounts(io, gameCode, runningGame);
                socket.emit('player-turn', runningGame.turnOrder[runningGame.current]);
            }


        });
        socket.on("kick-player", (gameCode, playerNameToKick) => {
            if (!lobbies[gameCode]) return;

            lobbies[gameCode].players = lobbies[gameCode].players.filter(p => p !== playerNameToKick);
            delete lobbies[gameCode].avatars[playerNameToKick];
            io.to(gameCode).emit(
                "update-lobby",
                lobbies[gameCode].players,
                lobbies[gameCode].maxPlayers,
                lobbies[gameCode].avatars,
                lobbies[gameCode].host
            );

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
            io.to(gameCode).emit(
                "update-lobby",
                lobbies[gameCode].players,
                lobbies[gameCode].maxPlayers,
                lobbies[gameCode].avatars,
                lobbies[gameCode].host
            );
        });

        socket.on('start-game', (gameCode) => {
            const lobby = lobbies[gameCode];
            if (!lobby) return;
            if (lobby.host && socket.data.playerName !== lobby.host) return;
            if (lobby.game) return; // already running

            const game = {
                deck: createDeck(lobby.settings),
                discard: [],
                hands: {},
                turnOrder: [...lobby.players],
                current: 0,
                uyesPressed: {},
                settings: lobby.settings
            };

            io.to(gameCode).emit('game-started');

            const startingCards = parseInt(lobby.settings?.cards, 10) || 5;
            try {
                dealInitialCards(game, startingCards, lobby.settings);
            } catch (err) {
                socket.emit('start-game-error', err.message);
                return;
            }
            // Zufällig bestimmen, welcher Spieler beginnt
            game.current = Math.floor(Math.random() * game.turnOrder.length);
            lobby.game = game;

            const topCard = game.discard[game.discard.length - 1];
            io.to(gameCode).emit('card-played', { player: null, card: topCard });

            for (const [id, s] of io.sockets.sockets) {
                if (s.rooms.has(gameCode)) {
                    const hand = game.hands[s.data.playerName] || [];
                    s.emit('deal-cards', hand);
                }
            }

            broadcastHandCounts(io, gameCode, game);

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

            const candidate = hand[idx];
            const top = game.discard[game.discard.length - 1];
            let isValid = false;
            if (candidate.color === 'wild') {
                isValid = ['red', 'yellow', 'green', 'blue'].includes(card.chosenColor);
            } else if (top.color === 'wild') {
                const chosen = top.chosenColor || top.color;
                isValid = candidate.color === chosen;
            } else {
                isValid = candidate.color === top.color || candidate.value === top.value;
            }
            if (!isValid) return;

            const played = hand.splice(idx, 1)[0];
            if (played.color === 'wild') {
                played.chosenColor = card.chosenColor;
            }
            game.discard.push(played);

            socket.emit('deal-cards', hand);

            io.to(gameCode).emit('card-played', { player, card: played });
            broadcastHandCounts(io, gameCode, game);

            let next;
            if (played.value === 'reverse') {
                game.turnOrder.reverse();
                game.current = game.turnOrder.indexOf(player);
                io.to(gameCode).emit('order-reversed', game.turnOrder);
                if (game.turnOrder.length === 2) {
                    const skipped = game.turnOrder[(game.current + 1) % game.turnOrder.length];
                    io.to(gameCode).emit('player-skipped', skipped);
                    next = player;
                } else {
                    next = nextTurn(game);
                }
            } else {
                next = nextTurn(game);
            }

            if (played.value === 'skip') {
                const skipped = next;
                next = nextTurn(game);
                io.to(gameCode).emit('player-skipped', skipped);
            } else if (played.value === 'draw2') {
                const affected = next;
                drawCards(game, affected, 2);
                for (const [_id, s] of io.sockets.sockets) {
                    if (s.data.playerName === affected && s.rooms.has(gameCode)) {
                        s.emit('deal-cards', game.hands[affected]);
                    }
                }
                io.to(gameCode).emit('cards-drawn', { player: affected, count: 2 });
                io.to(gameCode).emit('player-skipped', affected);
                next = nextTurn(game);
            } else if (played.value === 'wild4') {
                const affected = next;
                drawCards(game, affected, 4);
                for (const [_id, s] of io.sockets.sockets) {
                    if (s.data.playerName === affected && s.rooms.has(gameCode)) {
                        s.emit('deal-cards', game.hands[affected]);
                    }
                }
                io.to(gameCode).emit('cards-drawn', { player: affected, count: 4 });
                io.to(gameCode).emit('player-skipped', affected);
                next = nextTurn(game);
            }

            if (hand.length === 0) {
                io.to(gameCode).emit('game-end', player);
                delete lobby.game;
                return;
            }

            handleUyesEnd(io, gameCode, game, player);

            io.to(gameCode).emit('player-turn', next);
        });

        socket.on('draw-card', (gameCode) => {
            const lobby = lobbies[gameCode];
            const game = lobby?.game;
            if (!game) return;
            const player = socket.data.playerName;
            if (game.turnOrder[game.current] !== player) return;

            const limit = parseInt(game.settings?.handLimit, 10);
            if (limit && game.hands[player].length >= limit) {
                socket.emit('hand-limit-reached');
                return;
            }

            drawCards(game, player, 1);
            socket.emit('deal-cards', game.hands[player]);
            broadcastHandCounts(io, gameCode, game);

            const next = nextTurn(game);
            handleUyesEnd(io, gameCode, game, player);
            io.to(gameCode).emit('player-turn', next);
        });

        socket.on('uyes', (gameCode) => {
            const lobby = lobbies[gameCode];
            const game = lobby?.game;
            if (!game) return;
            const player = socket.data.playerName;
            if (game.turnOrder[game.current] !== player) return;
            game.uyesPressed[player] = true;
            io.to(gameCode).emit('player-uyes', { player, active: true });
        });

        socket.on('leave-game', (gameCode, playerName) => {
            const lobby = lobbies[gameCode];
            const game = lobby?.game;
            const name = playerName || socket.data.playerName;
            if (!lobby) return;

            // remove from lobby
            lobby.players = lobby.players.filter(p => p !== name);
            delete lobby.avatars[name];

            // remove from game state
            if (game) {
                const idx = game.turnOrder.indexOf(name);
                if (idx !== -1) {
                    game.turnOrder.splice(idx, 1);
                    delete game.hands[name];
                    delete game.uyesPressed[name];
                    if (idx < game.current) {
                        game.current--;
                    } else if (idx === game.current && game.current >= game.turnOrder.length) {
                        game.current = 0;
                    }
                }

                const counts = game.turnOrder.map(n => ({ name: n, count: game.hands[n]?.length || 0 }));
                io.to(gameCode).emit('player-left', { players: lobby.players, counts, player: name });
                io.to(gameCode).emit('player-turn', game.turnOrder[game.current]);
            }

            socket.leave(gameCode);

            if (lobby.players.length === 0) {
                delete lobbies[gameCode];
            } else if (lobby.players.length === 1) {
                const last = lobby.players[0];
                for (const [_id, s] of io.sockets.sockets) {
                    if (s.data.playerName === last && s.rooms.has(gameCode)) {
                        s.emit('kicked');
                        s.leave(gameCode);
                    }
                }
                delete lobbies[gameCode];
            }
        });


        socket.on("disconnect", () => {
            console.log(`🛑 Socket getrennt: ${socket.id}`);
            // Optional: du kannst hier aus der Lobby per socket-to-player Map löschen
        });
    });
}

export function getLobbyMeta(code) {    return lobbies[code] || null;}
