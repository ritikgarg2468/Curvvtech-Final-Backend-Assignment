const jwt = require('jsonwebtoken');
const moment = require('moment');
const config = require('../config/config');
const Token = require('../models/token.model');

const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
};

const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpiration.slice(0, -1), config.jwt.accessExpiration.slice(-1));
  const accessToken = generateToken(user.id, accessTokenExpires, 'access', config.jwt.secret);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpiration.slice(0, -1), config.jwt.refreshExpiration.slice(-1));
  const refreshToken = generateToken(user.id, refreshTokenExpires, 'refresh', config.jwt.refreshSecret);
  await saveToken(refreshToken, user.id, refreshTokenExpires, 'refresh');

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

const verifyToken = async (token, type) => {
    const secret = type === 'refresh' ? config.jwt.refreshSecret : config.jwt.secret;
    const payload = jwt.verify(token, secret);
    const tokenDoc = await Token.findOne({ token, type, user: payload.sub, blacklisted: false });
    if (!tokenDoc) {
        throw new Error('Token not found or blacklisted');
    }
    return tokenDoc;
};

module.exports = {
  generateToken,
  saveToken,
  generateAuthTokens,
  verifyToken,
};