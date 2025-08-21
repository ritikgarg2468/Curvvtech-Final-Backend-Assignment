const User = require('../models/user.model');
const Token = require('../models/token.model');
const tokenService = require('./token.service');

const loginUserWithUsernameAndPassword = async (username, password) => {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new Error('Incorrect username or password');
  }
  return user;
};

const refreshAuth = async (refreshToken) => {
    try {
        const refreshTokenDoc = await tokenService.verifyToken(refreshToken, 'refresh');
        const user = await User.findById(refreshTokenDoc.user);
        if (!user) {
            throw new Error();
        }
        // Token Rotation: Blacklist the old refresh token
        await Token.findByIdAndUpdate(refreshTokenDoc._id, { blacklisted: true });
        return tokenService.generateAuthTokens(user);
    } catch (error) {
        throw new Error('Please authenticate');
    }
};

module.exports = {
  loginUserWithUsernameAndPassword,
  refreshAuth,
};