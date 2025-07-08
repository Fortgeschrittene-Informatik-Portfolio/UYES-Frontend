import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLobby } from './logic/lobbyHandling.js';
import { getLobbyMeta } from './logic/socketHandler.js';
import { setSession } from './jwtSession.js';




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.get('/start', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/startSite.html'));
});

router.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/aboutPage.html'));
});

router.get('/help', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/helpPage.html'));
});

router.get('/start/game', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/chooseLobby.html'));
});

router.get('/start/game/create', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/createGame.html'));
});

router.get('/start/game/join', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/joinLobby.html'));
});

router.get('/lobby', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/lobby.html'));
});

router.get('/gameplay', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/gameplay.html'));
});

router.get("/api/lobbyData", (req, res) => {
    if (!req.session) {
        return res.status(400).json({ error: "Keine Session aktiv" });
    }

    const lobbyMeta = getLobbyMeta(req.session.gameId);

    res.json({
        code: req.session.gameId,
        name: req.session.playerName,
        players: lobbyMeta?.maxPlayers || req.session.settings?.players || 5,
        role: req.session.role
    });
});

router.post("/api/createGame", (req, res) => {
    const lobby = createLobby(req.body); // erstellt neue Lobby mit Host

    req.session.gameId = lobby.gameId;
    req.session.playerName = lobby.playerName;
    req.session.role = "host";
    req.session.settings = lobby.settings;
    setSession(res, req.session);

    res.redirect("/lobby");
});

router.post("/api/joinGame", (req, res) => {
    const code = String(req.body.code || "").trim();
    const name = (req.body.playerName || "").trim(); // ⚠️ Hier angepasst: "playerName" statt "name"

    if (!/^[0-9]{9}$/.test(code)) {
        return res.status(400).json({ error: "Ungültiger Game-Code" });
    }

    const lobbyMeta = getLobbyMeta(code);
    if (!lobbyMeta) {
        return res.status(404).json({ error: "Lobby nicht gefunden" });
    }

    const funnyNames = ["Cardy B", "Drawzilla", "Reverso", "Captain Uno", "Skipz"];
    const getRandomName = () => funnyNames[Math.floor(Math.random() * funnyNames.length)];

    // ❗️Hier: KEINE komplette Überschreibung der Session!

    req.session.gameId = code;
    setSession(res, req.session);
    req.session.playerName = name?.trim() !== "" ? name : getRandomName();
    req.session.role = "joiner";
    setSession(res, req.session);

    res.redirect("/lobby");
});

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
