const express = require('express');
const User = require('../models/user.model');
const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const user = await User.create(req.body);
    const tokens = await tokenService.generateAuthTokens(user);
    // Exclude password from the user object response
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).send({ user: userResponse, tokens });
  } catch (error) {
    res.status(400).send({ code: 400, message: "User registration failed. Username might already exist." });
  }
});

router.post('/login', async (req, res) => {
  try {
    const user = await authService.loginUserWithUsernameAndPassword(req.body.username, req.body.password);
    const tokens = await tokenService.generateAuthTokens(user);
    const userResponse = user.toObject();
    delete userResponse.password;
    res.send({ user: userResponse, tokens });
  } catch (error) {
    res.status(401).send({ code: 401, message: "Login failed: Incorrect username or password" });
  }
});

router.post('/refresh-token', async (req, res) => {
    try {
        const tokens = await authService.refreshAuth(req.body.refreshToken);
        res.send(tokens);
    } catch (error) {
        res.status(401).send({ code: 401, message: 'Please authenticate' });
    }
});

module.exports = router;