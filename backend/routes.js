import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLobby, getLobby, addPlayer } from './logic/lobbies.js';

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
    res.sendFile(path.join(__dirname, '../html/lobbyHost.html'));
});

router.get("/api/lobbyData", (req, res) => {
    if (!req.session) {
        return res.status(400).json({ error: "Keine Session aktiv" });
    }

    const lobby = getLobby(req.session.gameId);
    if (!lobby) {
        return res.status(400).json({ error: "Lobby nicht gefunden" });
    }

    res.json({
        code: lobby.gameId,
        name: req.session.playerName,
        role: req.session.role,
        players: lobby.players,
        settings: lobby.settings
    });
});



router.post("/api/createGame", (req, res) => {
    const lobby = createLobby(req.body);

    req.session.gameId = lobby.gameId;
    req.session.playerName = lobby.players[0].name;
    req.session.role = "host";

    res.redirect("/lobby");
});

router.post("/api/joinGame", (req, res) => {
    const code = String(req.body.code || "").trim();
    const name = (req.body.name || "").trim();

    if (!/^[0-9]{9}$/.test(code)) {
        return res.status(400).json({ error: "Ungültiger Game-Code" });
    }

    const player = addPlayer(code, name);
    if (!player) {
        return res.status(404).json({ error: "Lobby nicht gefunden" });
    }

    req.session.gameId = code;
    req.session.playerName = player.name;
    req.session.role = player.role;

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

    res.json({ success: true });
});

export default router;



