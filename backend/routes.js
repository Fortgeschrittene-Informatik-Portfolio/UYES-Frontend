import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, '../UYES-Frontend');


const router = express.Router();

// router.use(express.static(frontendPath)); // Wichtig: macht CSS, JS & Bilder zugänglich

router.get('/start', (req, res) => {
    res.sendFile(path.join(__dirname, '../UYES-Frontend/html/startSite.html'));
});

router.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../UYES-Frontend/html/aboutPage.html'));
});
router.get('/help', (req, res) => {
    res.sendFile(path.join(__dirname, '../UYES-Frontend/html/helpPage.html'));
});
router.get('/start/game', (req, res) => {
    res.sendFile(path.join(__dirname, '../UYES-Frontend/html/chooseLobby.html'));
});
router.get('/create', (req, res) => {
    res.sendFile(path.join(__dirname, '../UYES-Frontend/html/createGame.html'));
});
router.get('/start/game/join', (req, res) => {
    res.sendFile(path.join(__dirname, '../UYES-Frontend/html/joinLobby.html'));
});

export default router;