import express from 'express';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { jwtSessionMiddleware } from './jwtSession.js';
import { PORT, PUBLIC_DIR } from './config.js';

import routes from './routes.js';
import { setupSocket } from './logic/socketHandler.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(jwtSessionMiddleware);

app.use(express.static(PUBLIC_DIR));
app.use('/', routes);

const server = createServer(app);
const io = new Server(server);

// 🧠 Socket-Handler starten
setupSocket(io);

server.listen(PORT, () => {
    console.log(`🟢 Server läuft auf http://localhost:${PORT}`);
});
