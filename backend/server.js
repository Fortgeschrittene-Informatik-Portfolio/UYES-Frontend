/**
 * Entry point for the backend HTTP server.
 * Sets up Express with JSON parsing, cookie handling and
 * compression before mounting the API routes and Socket.IO.
 */
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

// Parse incoming JSON and urlencoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Read JWT sessions from cookies
app.use(cookieParser());
app.use(jwtSessionMiddleware);

// Serve static files with optional caching in production
app.use(compression());
const staticOptions = process.env.NODE_ENV === 'production' ? { maxAge: '1d' } : { maxAge: 0 };
app.use(express.static(PUBLIC_DIR, staticOptions));
// Basic page routes
app.use('/', routes);

const server = createServer(app);
const io = new Server(server);
// WebSocket setup for realtime gameplay
setupSocket(io);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🟢 Server läuft auf http://0.0.0.0:${PORT}/start`);
});

function shutdown() {
    // Ensure the server closes all connections before exiting
    server.close(() => {
        console.log('🔴 Server gestoppt');
        process.exit(0);
    });
}

// Gracefully handle process termination signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);
