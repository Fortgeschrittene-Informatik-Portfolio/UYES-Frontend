import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { jwtSessionMiddleware } from './jwtSession.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

import routes from './routes.js';
import { setupSocket } from './logic/socketHandler.js'; // gleich erstellen

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(jwtSessionMiddleware);

app.use(express.static(path.join(__dirname, '../public')));
app.use('/', routes);

const server = createServer(app);
const io = new Server(server);

// 🧠 Socket-Handler starten
setupSocket(io);

server.listen(5000, () => {
    console.log('🟢 Server läuft auf http://localhost:5000');
});
