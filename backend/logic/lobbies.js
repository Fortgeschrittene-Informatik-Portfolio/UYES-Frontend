import { generateGameCode } from './lobbyHandling.js';

const lobbies = new Map();

export function createLobby({ name, settings }) {
    const gameId = generateGameCode();
    const playerName = (name || '').trim() || `Player${lobbies.size + 1}`;
    const lobby = {
        gameId,
        settings: settings || {},
        players: [{ name: playerName, role: 'host' }]
    };
    lobbies.set(gameId, lobby);
    return lobby;
}

export function getLobby(gameId) {
    return lobbies.get(String(gameId));
}

export function addPlayer(gameId, name) {
    const lobby = getLobby(gameId);
    if (!lobby) return null;
    const playerName = (name || '').trim() || `Player${lobby.players.length + 1}`;
    const player = { name: playerName, role: 'joiner' };
    lobby.players.push(player);
    return player;
}

