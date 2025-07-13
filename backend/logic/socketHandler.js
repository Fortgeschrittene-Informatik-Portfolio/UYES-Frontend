import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSession } from '../jwtSession.js';
import {
  registerLobbyHandlers,
  broadcastHandCounts,
  notifyHost,
  getLobbyMeta,
  lobbies,
} from './lobbyManagement.js';
import { registerGameHandlers } from './gameFlow.js';
import { registerAvatarHandlers } from './avatarHandling.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const avatarFiles = fs
  .readdirSync(path.join(__dirname, '../../public/images/avatars'))
  .filter((f) => /\.(?:png|jpe?g|gif)$/i.test(f));

function getSessionFromSocket(socket) {
  const cookieStr = socket.handshake.headers.cookie || '';
  const cookies = {};
  for (const part of cookieStr.split(';')) {
    const [key, ...val] = part.trim().split('=');
    if (!key) continue;
    cookies[key] = decodeURIComponent(val.join('='));
  }
  return getSession({ cookies });
}

export function setupSocket(io) {
  io.on('connection', (socket) => {
    socket.data.session = getSessionFromSocket(socket);
    registerLobbyHandlers(io, socket, avatarFiles);
    registerGameHandlers(io, socket);
    registerAvatarHandlers(io, socket, avatarFiles);
  });
}

export {
  getLobbyMeta,
  lobbies,
  broadcastHandCounts,
  notifyHost,
} from './lobbyManagement.js';
