import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

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

export default router;



