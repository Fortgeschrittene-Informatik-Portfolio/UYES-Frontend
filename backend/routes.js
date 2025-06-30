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


// router.post("/api/createGame", (req, res) => {
//     const gameData = req.body;
//
//     // Beispiel: speichern in einer Session oder In-Memory-Datenbank
//     req.session = req.session || {};
//     req.session.gameConfig = gameData;
//
//     // Weiterleiten auf Lobbypage
//     res.redirect("/lobby");
// });


router.post("/api/createGame", (req, res) => {
    const lobby = createLobby(req.body); // erstellt neue Lobby mit Host

    req.session = {
        gameId: lobby.gameId,
        playerName: lobby.playerName,
        role: "host",
        settings: lobby.settings
    };

    res.redirect("/lobby");
});

export default router;



