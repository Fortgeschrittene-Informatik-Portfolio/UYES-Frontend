import express from 'express';
import routes from './routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, '../')));

app.use("/", routes);

app.listen(5000, () => {
    console.log("Server läuft auf: http://localhost:5000");
});
