import express from 'express';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import compression from 'compression';

import { jwtSessionMiddleware } from './jwtSession.js';
import { PORT, PUBLIC_DIR } from './config.js';

import routes from './routes.js';
import { setupSocket } from './logic/socketHandler.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(jwtSessionMiddleware);

app.use(compression());
const staticOptions = process.env.NODE_ENV === 'production' ? { maxAge: '1d' } : { maxAge: 0 };
app.use(express.static(PUBLIC_DIR, staticOptions));
app.use('/', routes);

const server = createServer(app);
const io = new Server(server);

setupSocket(io);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🟢 Server läuft auf http://0.0.0.0:${PORT}/start`);
});

function shutdown() {
    server.close(() => {
        console.log('🔴 Server gestoppt');
        process.exit(0);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);
