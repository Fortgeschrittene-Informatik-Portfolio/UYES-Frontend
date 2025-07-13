import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLobby } from './logic/lobbyHandling.js';
import { getLobbyMeta } from './logic/socketHandler.js';
import { setSession } from './jwtSession.js';

/** Express router serving the main HTML pages and API endpoints. */




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Router exported by the server.
 * Handles navigation routes and small API endpoints.
 */

// Landing page
router.get('/start', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/startSite.html'));
});

// Information about the project
router.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/aboutPage.html'));
});

// Help and volume settings
router.get('/help', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/helpPage.html'));
});

// Display game rules
router.get('/rules', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/rulesPage.html'));
});

// Choose between creating or joining a lobby
router.get('/start/game', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/chooseLobby.html'));
});

// Create lobby page
router.get('/start/game/create', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/createGame.html'));
});

// Lobby settings page
router.get('/change-settings', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/changeSettings.html'));
});

// Join existing lobby page
router.get('/start/game/join', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/joinLobby.html'));
});

// Waiting lobby after creation or join
router.get('/lobby', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/lobby.html'));
});

// Main gameplay view
router.get('/gameplay', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/gameplay.html'));
});

// Current lobby data for client side pages
router.get("/api/lobbyData", (req, res) => {
    if (!req.session) {
        return res.status(400).json({ error: "Keine Session aktiv" });
    }

    const lobbyMeta = getLobbyMeta(req.session.gameId);

    res.json({
        code: req.session.gameId,
        name: req.session.playerName,
        players: lobbyMeta?.maxPlayers || req.session.settings?.players || 5,
        role: req.session.role,
        playerList: lobbyMeta?.players || [],
        avatars: lobbyMeta?.avatars || {},
        host: lobbyMeta?.host || null,
        settings: lobbyMeta?.settings || req.session.settings || {}
    });
});

// Update lobby settings via host
router.post('/api/updateSettings', (req, res) => {
    if (!req.session) {
        return res.status(400).json({ error: 'Keine Session aktiv' });
    }

    const lobby = getLobbyMeta(req.session.gameId);
    if (!lobby) {
        return res.status(404).json({ error: 'Lobby nicht gefunden' });
    }

    const incoming = req.body.settings || {};
    const { players, ...other } = incoming;
    lobby.settings = { ...lobby.settings, ...other };
    req.session.settings = lobby.settings;
    setSession(res, req.session);

    res.json({ success: true });
});

// Create a new lobby and session
router.post("/api/createGame", (req, res) => {
    const lobby = createLobby(req.body);

    req.session.gameId = lobby.gameId;
    req.session.playerName = lobby.playerName;
    req.session.role = "host";
    req.session.settings = lobby.settings;
    setSession(res, req.session);

    res.redirect("/lobby");
});

// Join an existing lobby
router.post("/api/joinGame", (req, res) => {
    const code = String(req.body.code || "").trim();
    const name = (req.body.playerName || "").trim();

    if (!/^[0-9]{9}$/.test(code)) {
        return res.status(400).json({ error: "Ungültiger Game-Code" });
    }

    const lobbyMeta = getLobbyMeta(code);
    if (!lobbyMeta) {
        return res.status(404).json({ error: "Lobby nicht gefunden" });
    }

    const funnyNames = ["Cardy B", "Drawzilla", "Reverso", "Captain Uno", "Skipz"];
    const getRandomName = () => funnyNames[Math.floor(Math.random() * funnyNames.length)];

    req.session.gameId = code;
    setSession(res, req.session);
    req.session.playerName = name?.trim() !== "" ? name : getRandomName();
    req.session.role = "joiner";
    setSession(res, req.session);

    res.redirect("/lobby");
});

// Store new lobby code in the session
router.put("/api/gameCode", (req, res) => {
    if (!req.session) {
        return res.status(400).json({ error: "Keine Session aktiv" });
    }

    const code = String(req.body.code || "").trim();

    if (!/^[0-9]{9}$/.test(code)) {
        return res.status(400).json({ error: "Ungültiger Game-Code" });
    }

    req.session.gameId = code;
    setSession(res, req.session);

    res.json({ success: true });
});

export default router;
