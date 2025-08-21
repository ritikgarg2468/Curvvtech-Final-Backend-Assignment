const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Token = require('../src/models/token.model');

describe('Auth Endpoints', () => {
  const testUser = {
    username: 'testuser@example.com',
    password: 'password123',
    organization: 'TestOrg',
  };

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('tokens');
    expect(res.body.user.username).toBe(testUser.username);

    const dbUser = await User.findById(res.body.user._id);
    expect(dbUser).not.toBeNull();
  });

  it('should not allow registration with a username that already exists', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.statusCode).toEqual(400);
  });

  it('should log in a registered user and return tokens', async () => {
    await User.create(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: testUser.password });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('tokens');
    expect(res.body.tokens).toHaveProperty('access');
    expect(res.body.tokens).toHaveProperty('refresh');
  });

  it('should fail login with incorrect password', async () => {
    await User.create(testUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: 'wrongpassword' });
    expect(res.statusCode).toEqual(401);
  });
  
  it('should refresh tokens successfully with a valid refresh token', async () => {
    const loginRes = await request(app).post('/api/auth/register').send(testUser);
    const refreshToken = loginRes.body.tokens.refresh.token;

    // Wait a second to ensure new tokens have different timestamps if needed
    await new Promise(r => setTimeout(r, 1000));

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .send({ refreshToken });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('access');
    expect(res.body.access.token).not.toBe(loginRes.body.tokens.access.token);

    const oldTokenDoc = await Token.findOne({ token: refreshToken });
    expect(oldTokenDoc.blacklisted).toBe(true);
  });

});