
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const avatarFiles = fs
  .readdirSync(path.join(__dirname, "../../public/images/avatars"))
  // include all common image files instead of only those containing "avatar" in the name
  .filter(f => /\.(?:png|jpe?g|gif)$/i.test(f));

import { getSession } from '../jwtSession.js';

const HAND_LIMIT = 40;


const lobbies = {};
// Format: { [gameCode]: { players: [], avatars: {}, maxPlayers: 5, host: string, game?: GameState } }


function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function createDeck(settings = {}) {
    const colors = ['red', 'yellow', 'green', 'blue'];
    const deck = [];
    for (const color of colors) {
        deck.push({ color, value: 0 });
        for (let i = 1; i <= 9; i++) {
            deck.push({ color, value: i });
            deck.push({ color, value: i });
        }
        if (settings.draw2) {
            deck.push({ color, value: 'draw2' });
            deck.push({ color, value: 'draw2' });
        }
        if (settings.reverse) {
            deck.push({ color, value: 'reverse' });
            deck.push({ color, value: 'reverse' });
        }
        if (settings.skip) {
            deck.push({ color, value: 'skip' });
            deck.push({ color, value: 'skip' });
        }
    }
    if (settings.wild) {
        for (let i = 0; i < 4; i++) deck.push({ color: 'wild', value: 'wild' });
    }
    if (settings.wild4) {
        for (let i = 0; i < 4; i++) deck.push({ color: 'wild', value: 'wild4' });
    }
    return shuffle(deck);
}

function dealInitialCards(game, count = 5, deckSettings = {}) {
    const minDeck = HAND_LIMIT * game.turnOrder.length + 1;
    while (game.deck.length < minDeck) {
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
            game.deck = shuffle(game.discard);
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

function notifyHost(io, gameCode, hostName) {
    if (!hostName) return;
    for (const [_id, s] of io.sockets.sockets) {
        if (s.data.playerName === hostName && s.rooms.has(gameCode)) {
            s.emit('host-assigned');
            break;
        }
    }
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
        io.to(gameCode).emit('cards-drawn', { player, count: 1 });
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
                    console.log(`\u{1F195} Lobby ${gameCode} erstellt von ${playerName}`);
                } else {
                    socket.emit("lobby-not-found");
                    return;
                }
            }

            const lobby = lobbies[gameCode];

            if (lobby.game && !lobby.players.includes(playerName)) {
                socket.emit('game-in-progress');
                return;
            }

            if (lobby.players.length >= lobby.maxPlayers && !lobby.players.includes(playerName)) {
                socket.emit("lobby-full");
                return;
            }

            socket.join(gameCode);
            socket.data.playerName = playerName; // 🔑 wichtig!
            console.log(`➡️ ${playerName} betritt Lobby ${gameCode}`);


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
                socket.emit('game-started');
                const hand = runningGame.hands[playerName] || [];
                socket.emit('deal-cards', hand);
                const topCard = runningGame.discard[runningGame.discard.length - 1];
                socket.emit('card-played', { player: null, card: topCard });
                broadcastHandCounts(io, gameCode, runningGame);
                socket.emit('player-turn', {
                    player: runningGame.turnOrder[runningGame.current],
                    startedAt: runningGame.turnStartedAt,
                    drawStack: runningGame.drawStack || 0
                });
            }


        });
        socket.on("kick-player", (gameCode, playerNameToKick) => {
            if (!lobbies[gameCode]) return;

            lobbies[gameCode].players = lobbies[gameCode].players.filter(p => p !== playerNameToKick);
            delete lobbies[gameCode].avatars[playerNameToKick];
            if (lobbies[gameCode].host === playerNameToKick) {
                lobbies[gameCode].host = lobbies[gameCode].players[0] || null;
                notifyHost(io, gameCode, lobbies[gameCode].host);
            }
            if (lobbies[gameCode].game) {
                lobbies[gameCode].maxPlayers = lobbies[gameCode].players.length;
            }
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

        socket.on("close-lobby", (gameCode) => {
            const lobby = lobbies[gameCode];
            if (!lobby) return;
            if (lobby.host && socket.data.playerName !== lobby.host) return;

            for (const player of lobby.players) {
                if (player === socket.data.playerName) continue;
                for (const [_id, s] of io.sockets.sockets) {
                    if (s.data?.playerName === player && s.rooms.has(gameCode)) {
                        s.emit("kicked");
                        s.leave(gameCode);
                    }
                }
            }
            socket.leave(gameCode);
            delete lobbies[gameCode];
            console.log(`\u{1F512} Lobby ${gameCode} geschlossen von ${socket.data.playerName}`);
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
            if (lobbies[gameCode].host === playerName) {
                lobbies[gameCode].host = lobbies[gameCode].players[0] || null;
                notifyHost(io, gameCode, lobbies[gameCode].host);
            }

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
                settings: lobby.settings,
                turnStartedAt: Date.now(),
                drawStack: 0
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

            game.turnStartedAt = Date.now();
            io.to(gameCode).emit('player-turn', {
                player: game.turnOrder[game.current],
                startedAt: game.turnStartedAt,
                drawStack: game.drawStack
            });
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
            if (game.drawStack > 0 && candidate.value !== 'draw2') return;

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

                game.drawStack = (game.drawStack || 0) + 2;

            } else if (played.value === 'wild4') {
                const affected = next;
                drawCards(game, affected, 4);
                for (const [_id, s] of io.sockets.sockets) {
                    if (s.data.playerName === affected && s.rooms.has(gameCode)) {
                        s.emit('deal-cards', game.hands[affected]);
                    }
                }
                io.to(gameCode).emit('cards-drawn', { player: affected, count: 4 });
                broadcastHandCounts(io, gameCode, game);
                io.to(gameCode).emit('player-skipped', affected);
                next = nextTurn(game);
            }

            if (hand.length === 0) {
                io.to(gameCode).emit('game-end', player);
                delete lobby.game;
                return;
            }

            handleUyesEnd(io, gameCode, game, player);

            game.turnStartedAt = Date.now();
            io.to(gameCode).emit('player-turn', { player: next, startedAt: game.turnStartedAt, drawStack: game.drawStack });
        });

        socket.on('draw-card', (gameCode) => {
            const lobby = lobbies[gameCode];
            const game = lobby?.game;
            if (!game) return;
            const player = socket.data.playerName;
            if (game.turnOrder[game.current] !== player) return;

            const limit = HAND_LIMIT;
            const count = game.drawStack > 0 ? game.drawStack : 1;
            if (game.hands[player].length + count > limit) {
                socket.emit('hand-limit-reached');
                if (game.drawStack > 0) {
                    io.to(gameCode).emit('player-skipped', player);
                    game.drawStack = 0;
                }
                const next = nextTurn(game);
                handleUyesEnd(io, gameCode, game, player);
                game.turnStartedAt = Date.now();
                io.to(gameCode).emit('player-turn', { player: next, startedAt: game.turnStartedAt, drawStack: game.drawStack });
                return;
            }

            drawCards(game, player, count);
            socket.emit('deal-cards', game.hands[player]);
            io.to(gameCode).emit('cards-drawn', { player, count });
            if (game.drawStack > 0) {
                io.to(gameCode).emit('player-skipped', player);
                game.drawStack = 0;
            }
            broadcastHandCounts(io, gameCode, game);

            const next = nextTurn(game);
            handleUyesEnd(io, gameCode, game, player);
            game.turnStartedAt = Date.now();
            io.to(gameCode).emit('player-turn', { player: next, startedAt: game.turnStartedAt, drawStack: game.drawStack });
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

        socket.on('change-avatar', (gameCode) => {
            const lobby = lobbies[gameCode];
            if (!lobby) return;
            const player = socket.data.playerName;
            const avatars = lobby.avatars;
            if (!player || !avatars) return;
            const file = avatarFiles[Math.floor(Math.random() * avatarFiles.length)];
            avatars[player] = file;
            io.to(gameCode).emit('avatar-changed', { player, file });
        });

        socket.on('leave-game', (gameCode, playerName) => {
            const lobby = lobbies[gameCode];
            const game = lobby?.game;
            const name = playerName || socket.data.playerName;
            if (!lobby) return;

            // remove from lobby
            lobby.players = lobby.players.filter(p => p !== name);
            delete lobby.avatars[name];
            if (lobby.host === name) {
                lobby.host = lobby.players[0] || null;
                notifyHost(io, gameCode, lobby.host);
            }
            if (lobby.game) {
                lobby.maxPlayers = lobby.players.length;
            }
            io.to(gameCode).emit(
                'update-lobby',
                lobby.players,
                lobby.maxPlayers,
                lobby.avatars,
                lobby.host
            );

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
                game.turnStartedAt = Date.now();
                io.to(gameCode).emit('player-turn', { player: game.turnOrder[game.current], startedAt: game.turnStartedAt, drawStack: game.drawStack });
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
