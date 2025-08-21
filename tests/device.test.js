const request = require('supertest');
const app = require('../src/app');
const Device = require('../src/models/device.model'); // CORRECTED PATH

describe('Device Endpoints', () => {
  let token;
  const testUser = {
    username: 'deviceuser@example.com',
    password: 'password123',
    organization: 'DeviceOrg',
  };

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    token = res.body.tokens.access.token;
  });

  it('should not allow access to /api/devices without a token', async () => {
    const res = await request(app).get('/api/devices');
    expect(res.statusCode).toEqual(401);
  });

  it('should fetch an empty list of devices for an authenticated user', async () => {
    const res = await request(app)
      .get('/api/devices')
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual([]);
  });

  it('should implement caching for the device list endpoint', async () => {
    const res1 = await request(app)
      .get('/api/devices')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res1.statusCode).toEqual(200);
    expect(res1.headers['x-cache']).toBe('MISS');

    const res2 = await request(app)
      .get('/api/devices')
      .set('Authorization', `Bearer ${token}`);
    expect(res2.statusCode).toEqual(200);
    expect(res2.headers['x-cache']).toBe('HIT');
  });

  it('should invalidate the cache when a device is updated', async () => {
    // Manually create a device to avoid API calls that might cache things
    const device = await Device.create({ name: 'Device to Update', organization: testUser.organization });

    await request(app).get('/api/devices').set('Authorization', `Bearer ${token}`); // Primes the cache (MISS)
    const hitRes = await request(app).get('/api/devices').set('Authorization', `Bearer ${token}`);
    expect(hitRes.headers['x-cache']).toBe('HIT');

    await request(app)
      .patch(`/api/devices/${device._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'online' });

    const missRes = await request(app).get('/api/devices').set('Authorization', `Bearer ${token}`);
    expect(missRes.headers['x-cache']).toBe('MISS');
  });
});