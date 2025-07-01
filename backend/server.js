import express from 'express';
import routes from './routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

app.use(
    session({
        secret: 'your-secret',
        resave: false,
        saveUninitialized: true
    })
);

// Serve only the public directories to avoid exposing server-side code
app.use(express.static(path.join(__dirname, '../html')));
app.use(express.static(path.join(__dirname, '../scripts')));
app.use(express.static(path.join(__dirname, '../styles')));
app.use(express.static(path.join(__dirname, '../images')));

app.use("/", routes);

app.listen(5000, () => {
    console.log("Server läuft auf: http://localhost:5000");
});
