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
    expect(loginPageRes.headers.location).toBe('/search');
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

describe('Auth - Registration', () => {
  beforeEach(() => {
    User.findOne.mockReset();
  });


  test('should prevent duplicate email registration', async () => {
    const existingUser = {
      userId: 'u-123',
      username: 'existinguser',
      email: 'test@example.com',
      userrole: 'user'
    };

    User.findOne.mockResolvedValue(existingUser);

    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'newuser',
        email: 'test@example.com',
        password: 'password123'
      })
      .set('Content-Type', 'application/json')
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('User with this email or username already exists');
  });

  test('should prevent duplicate username registration', async () => {
    // The route uses $or query to check both email and username
    User.findOne.mockResolvedValue({ username: 'testuser', email: 'other@example.com' });

    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'testuser',
        email: 'newemail@example.com',
        password: 'password123'
      })
      .set('Content-Type', 'application/json')
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('User with this email or username already exists');
  });

  test('should validate required fields', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: '',
        email: 'test@example.com'
        // password missing
      })
      .set('Content-Type', 'application/json')
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('provide name, email, and password');
  });

  test('should validate email format', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      })
      .set('Content-Type', 'application/json')
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('valid email address');
  });
});

describe('Auth - Session Management', () => {
  beforeEach(() => {
    User.findOne.mockReset();
  });

  test('should maintain user session after login', async () => {
    const agent = request.agent(app);
    const mockUser = {
      userId: 'u-123',
      username: 'testuser',
      email: 'test@example.com',
      userrole: 'user',
      comparePassword: jest.fn().mockResolvedValue(true)
    };

    User.findOne.mockResolvedValue(mockUser);

    // Login
    await agent
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'correct-password'
      })
      .set('Content-Type', 'application/json')
      .expect(200);

    // Check session is maintained
    const res = await agent
      .get('/auth/me')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('testuser');
  });

  test('should return 401 for unauthenticated session check', async () => {
    const res = await request(app)
      .get('/auth/me')
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Not authenticated');
  });

  test('should clear session on logout', async () => {
    const agent = request.agent(app);
    const mockUser = {
      userId: 'u-123',
      username: 'testuser',
      email: 'test@example.com',
      userrole: 'user',
      comparePassword: jest.fn().mockResolvedValue(true)
    };

    User.findOne.mockResolvedValue(mockUser);

    // Login first
    await agent
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'correct-password'
      })
      .set('Content-Type', 'application/json')
      .expect(200);

    // Logout
    await agent
      .post('/auth/logout')
      .expect(200);

    // Check session is cleared
    await agent
      .get('/auth/me')
      .expect(401);
  });
});

describe('Auth - Security Features', () => {
  beforeEach(() => {
    User.findOne.mockReset();
  });

  test('should not leak user existence information', async () => {
    User.findOne.mockResolvedValue(null); // User doesn't exist

    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'any-password'
      })
      .set('Content-Type', 'application/json')
      .expect(401);

    // Same error message for non-existent user and wrong password
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('should validate input data properly', async () => {
    // Test various invalid inputs
    const invalidInputs = [
      { name: '', email: 'test@example.com', password: 'password123' }, // Empty name
      { name: 'test', email: 'not-an-email', password: 'password123' }, // Invalid email
      { name: 'test', email: 'test@example.com', password: '' }, // Empty password
      { name: 'test', email: 'test@example.com', password: '123' } // Short password
    ];

    for (const input of invalidInputs) {
      const res = await request(app)
        .post('/auth/register')
        .send(input)
        .set('Content-Type', 'application/json');

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    }
  });
});
