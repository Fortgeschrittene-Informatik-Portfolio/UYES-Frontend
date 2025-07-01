import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLobby } from './logic/lobbyHandling.js';

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

    res.json({
        code: req.session.gameId,
        name: req.session.playerName,
        players: req.session.settings?.players || 5, // fallback
        role: req.session.role
    });
});



router.post("/api/createGame", (req, res) => {
    const lobby = createLobby(req.body); // erstellt neue Lobby mit Host

    req.session.gameId = lobby.gameId;
    req.session.playerName = lobby.playerName;
    req.session.role = "host";
    req.session.settings = lobby.settings;

    res.redirect("/lobby");
});

router.post("/api/joinGame", (req, res) => {
    const code = String(req.body.code || "").trim();
    const name = (req.body.name || "").trim();

    if (!/^[0-9]{9}$/.test(code)) {
        return res.status(400).json({ error: "Ungültiger Game-Code" });
    }

    const funnyNames = ["Cardy B", "Drawzilla", "Reverso", "Captain Uno", "Skipz"];
    const getRandomName = () => funnyNames[Math.floor(Math.random() * funnyNames.length)];

    req.session = {
        gameId: code,
        playerName: name || getRandomName(),
        role: "joiner",
    };

    res.redirect("/lobby");
});

export default router;



