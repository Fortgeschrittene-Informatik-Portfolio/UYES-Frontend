import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config.js';

export function getSession(req) {
    const token = req.cookies?.session;
    if (!token) return {};
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return {};
    }
}

export function setSession(res, data) {
    const token = jwt.sign(data, JWT_SECRET);
    res.cookie('session', token, { httpOnly: true });
}

export function jwtSessionMiddleware(req, _res, next) {
    req.session = getSession(req);
    next();
}
