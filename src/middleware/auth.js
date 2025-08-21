const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ code: 401, message: 'Please authenticate.' });
    }

    const token = authHeader.substring(7, authHeader.length);
    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findById(decoded.sub);
        if (!user) {
            throw new Error();
        }
        req.user = user;
        req.ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log(`[Request Log] User ${user.username} from IP ${req.ipAddress} accessed ${req.method} ${req.originalUrl}`);
        next();
    } catch (error) {
        res.status(401).send({ code: 401, message: 'Invalid or expired token.' });
    }
};

module.exports = auth;