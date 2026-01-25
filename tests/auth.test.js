const request = require('supertest');
const mongoose = require('mongoose');

// Mock the database connector (app.js calls connectDB on boot)
jest.mock('../src/config/database', () => {
  return jest.fn().mockResolvedValue(true);
});

// Mock User model so tests don't require a real MongoDB
jest.mock('../src/models/User', () => {
  return {
    findOne: jest.fn(),
  };
});

const User = require('../src/models/User');
const app = require('../src/app');

describe('Auth - Login', () => {
  beforeEach(() => {
    // Ensure auth route passes its DB ready check even when Mongo isn't running.
    // We mock the model methods, so no real DB calls occur.
    try {
      mongoose.connection.readyState = 1;
    } catch (e) {
      // Ignore if read-only in this environment
    }

    User.findOne.mockReset();
  });

  test('logs in with valid credentials and creates a session', async () => {
    const mockUser = {
      userId: 'u-123',
      username: 'Test User',
      email: 'test@example.com',
      userrole: 'user',
      comparePassword: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue(mockUser);

    const agent = request.agent(app);

    const loginRes = await agent
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'correct-password' })
      .set('Content-Type', 'application/json')
      .expect(200);

    expect(loginRes.body).toMatchObject({
      success: true,
      message: expect.any(String),
      data: {
        userId: 'u-123',
        username: 'Test User',
        email: 'test@example.com',
        userrole: 'user',
      },
    });

    // Session cookie should be set
    expect(loginRes.headers['set-cookie']).toBeDefined();

    // Session should now exist for subsequent requests
    const meRes = await agent.get('/auth/me').expect(200);
    expect(meRes.body).toMatchObject({
      success: true,
      data: {
        userId: 'u-123',
        username: 'Test User',
        email: 'test@example.com',
        userrole: 'user',
      },
    });

    // And GET /auth/login should redirect because session user exists
    const loginPageRes = await agent.get('/auth/login').expect(302);
    expect(loginPageRes.headers.location).toBe('/');
  });

  test('invalid credentials return an error and do not create a session', async () => {
    const mockUser = {
      userId: 'u-123',
      username: 'Test User',
      email: 'test@example.com',
      userrole: 'user',
      comparePassword: jest.fn().mockResolvedValue(false),
    };

    User.findOne.mockResolvedValue(mockUser);

    const agent = request.agent(app);

    const res = await agent
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'wrong-password' })
      .set('Content-Type', 'application/json')
      .expect(401);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Invalid email or password',
    });

    // saveUninitialized=false -> should not set a session cookie on failed login
    expect(res.headers['set-cookie']).toBeUndefined();

    // /auth/me should still be unauthenticated
    const meRes = await agent.get('/auth/me').expect(401);
    expect(meRes.body).toMatchObject({
      success: false,
      message: 'Not authenticated',
    });
  });

  test('missing email/password returns 400', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: '', password: '' })
      .set('Content-Type', 'application/json')
      .expect(400);

    expect(res.body).toMatchObject({
      success: false,
      message: 'Please provide email and password',
    });
  });
});
