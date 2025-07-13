import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config.js';

/** Secret used to sign the session JWT. Set via `JWT_SECRET` in config. */

/**
 * Extracts session data from the request cookies.
 * @param {import('express').Request} req Express request object
 * @returns {object} Decoded session payload or empty object if invalid
 */
export function getSession(req) {
    const token = req.cookies?.session;
    if (!token) return {};
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return {};
    }
}

/**
 * Stores session data in a httpOnly cookie.
 * @param {import('express').Response} res Express response object
 * @param {object} data Session payload to store
 */
export function setSession(res, data) {
    const token = jwt.sign(data, JWT_SECRET);
    res.cookie('session', token, { httpOnly: true });
}

/**
 * Middleware that attaches `req.session` from the signed cookie.
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {Function} next
 */
export function jwtSessionMiddleware(req, _res, next) {
    req.session = getSession(req);
    next();
}
