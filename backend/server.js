/**
 * Entry point for the Express web server.
 * Sets up middleware stack and binds the Socket.IO handlers.
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

// Parse JSON and URL encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Read the signed session cookie and attach `req.session`
app.use(cookieParser());
app.use(jwtSessionMiddleware);

// Enable gzip compression for static assets
app.use(compression());
// Serve static assets from the public directory
const staticOptions = process.env.NODE_ENV === 'production' ? { maxAge: '1d' } : { maxAge: 0 };
app.use(express.static(PUBLIC_DIR, staticOptions));
// HTML routes are defined in backend/routes.js
app.use('/', routes);

// Create HTTP server and attach Socket.IO for real-time features
const server = createServer(app);
const io = new Server(server);

// Register event handlers defined in socketHandler.js
setupSocket(io);

// Start listening for incoming connections
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🟢 Server läuft auf http://0.0.0.0:${PORT}/start`);
});

function shutdown() {
    // Gracefully stop accepting new connections
    server.close(() => {
        console.log('🔴 Server gestoppt');
        process.exit(0);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);
