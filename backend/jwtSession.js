import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'your-secret';

export function getSession(req) {
    const token = req.cookies?.session;
    if (!token) return {};
    try {
        return jwt.verify(token, SECRET);
    } catch {
        return {};
    }
}

export function setSession(res, data) {
    const token = jwt.sign(data, SECRET);
    res.cookie('session', token, { httpOnly: true });
}

export function jwtSessionMiddleware(req, _res, next) {
    req.session = getSession(req);
    next();
}
