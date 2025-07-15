import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pidFile = path.join(__dirname, 'server.pid');

if (!fs.existsSync(pidFile)) {
  console.error('server.pid nicht gefunden. Läuft der Server?');
  process.exit(1);
}

const pid = Number(fs.readFileSync(pidFile, 'utf8'));

try {
  process.kill(pid, 'SIGUSR2');
} catch (err) {
  console.error('Konnte Signal nicht senden:', err.message);
  process.exit(1);
}
