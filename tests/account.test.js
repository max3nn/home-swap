const request = require('supertest');

jest.mock('../src/config/database', () => {
  return jest.fn().mockResolvedValue(true);
});

jest.mock('../src/models/User', () => {
  return {
    findOne: jest.fn(),
  };
});

const User = require('../src/models/User');
const app = require('../src/app');

describe('Account Page', () => {
  beforeEach(() => {
    User.findOne.mockReset();
  });

  test('redirects to login when not authenticated', async () => {
    const res = await request(app).get('/account').expect(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  test('renders profile (no listings) and edit button when authenticated', async () => {
    const agent = request.agent(app);

    const mockUser = {
      userId: 'u-123',
      username: 'Test User',
      email: 'test@example.com',
      userrole: 'user',
      comparePassword: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue(mockUser);

    await agent
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'correct-password' })
      .set('Content-Type', 'application/json')
      .expect(200);

    const res = await agent.get('/account').expect(200);

    expect(res.text).toContain('My Account');
    expect(res.text).toContain('Test User');
    expect(res.text).toContain('test@example.com');

    expect(res.text).toContain('Edit Account');
    expect(res.text).not.toContain('My Listings');
  });

  test('renders edit form when authenticated', async () => {
    const agent = request.agent(app);

    const mockUser = {
      userId: 'u-123',
      username: 'Test User',
      email: 'test@example.com',
      userrole: 'user',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(true),
    };

    User.findOne.mockResolvedValue(mockUser);

    await agent
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'correct-password' })
      .set('Content-Type', 'application/json')
      .expect(200);

    const res = await agent.get('/account/edit').expect(200);
    expect(res.text).toContain('Edit Account');
    expect(res.text).toContain('Save Changes');
  });

  test('updates account and redirects back to /account', async () => {
    const agent = request.agent(app);

    const mockUserForLogin = {
      userId: 'u-123',
      username: 'Test User',
      email: 'test@example.com',
      userrole: 'user',
      comparePassword: jest.fn().mockResolvedValue(true),
    };

    // First findOne is for /auth/login
    User.findOne.mockResolvedValueOnce(mockUserForLogin);

    await agent
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'correct-password' })
      .set('Content-Type', 'application/json')
      .expect(200);

    // Second findOne is for /account/edit (load document to save)
    const mockUserDoc = {
      userId: 'u-123',
      username: 'Test User',
      email: 'test@example.com',
      password: 'hashed',
      save: jest.fn().mockImplementation(async function () {
        return this;
      }),
    };

    User.findOne.mockResolvedValueOnce(mockUserDoc);

    const res = await agent
      .post('/account/edit')
      .type('form')
      .send({ username: 'New Name', password: '', confirmPassword: '' })
      .expect(302);

    expect(res.headers.location).toBe('/account');

    const accountRes = await agent.get('/account').expect(200);
    expect(accountRes.text).toContain('New Name');
    expect(accountRes.text).toContain('test@example.com');
  });
});
