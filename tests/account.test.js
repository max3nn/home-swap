const request = require('supertest');

jest.mock('../src/config/database', () => {
  return jest.fn().mockResolvedValue(true);
});

jest.mock('../src/models/User');

const User = require('../src/models/User');
const app = require('../src/app');

describe('User Registration', () => {
  beforeEach(() => {
    User.findOne.mockReset();
    User.mockClear();
  });

  test('should create new account with valid data', async () => {
    User.findOne.mockResolvedValue(null); // No existing user

    const mockUser = {
      userId: 'u-123',
      username: 'testuser',
      email: 'test@example.com',
      userrole: 'user',
      save: jest.fn().mockResolvedValue(true)
    };

    User.mockImplementation(() => mockUser);

    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })
      .set('Content-Type', 'application/json')
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Account registered successfully');
    expect(res.body.data.username).toBe('testuser');
    expect(res.body.data.email).toBe('test@example.com');
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
    expect(res.body.message).toContain('already exists');
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

describe('User Authentication', () => {
  beforeEach(() => {
    User.findOne.mockReset();
  });

  test('should login with correct credentials', async () => {
    const mockUser = {
      userId: 'u-123',
      username: 'testuser',
      email: 'test@example.com',
      userrole: 'user',
      comparePassword: jest.fn().mockResolvedValue(true)
    };

    User.findOne.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'correct-password'
      })
      .set('Content-Type', 'application/json')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.data.username).toBe('testuser');
  });

  test('should fail login with incorrect password', async () => {
    const mockUser = {
      userId: 'u-123',
      username: 'testuser',
      email: 'test@example.com',
      userrole: 'user',
      comparePassword: jest.fn().mockResolvedValue(false)
    };

    User.findOne.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrong-password'
      })
      .set('Content-Type', 'application/json')
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('should fail login with non-existent email', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'password123'
      })
      .set('Content-Type', 'application/json')
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('should validate required login fields', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com'
        // password missing
      })
      .set('Content-Type', 'application/json')
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('provide email and password');
  });
});

describe('Session Management', () => {
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

  test('should validate profile update data', async () => {
    const agent = request.agent(app);
    const mockUser = {
      userId: 'u-123',
      username: 'testuser',
      email: 'test@example.com',
      userrole: 'user',
      comparePassword: jest.fn().mockResolvedValue(true)
    };

    User.findOne.mockResolvedValue(mockUser);

    await agent
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'correct-password' })
      .set('Content-Type', 'application/json')
      .expect(200);

    const res = await agent
      .post('/account/edit')
      .type('form')
      .send({ username: '', password: '123', confirmPassword: '456' })
      .expect(400);

    expect(res.text).toContain('Username is required');
    expect(res.text).toContain('Password must be at least 6 characters');
    expect(res.text).toContain('Passwords do not match');
  });

  test('should update password when provided', async () => {
    const agent = request.agent(app);
    const mockUserForLogin = {
      userId: 'u-123',
      username: 'testuser',
      email: 'test@example.com',
      userrole: 'user',
      comparePassword: jest.fn().mockResolvedValue(true)
    };

    User.findOne.mockResolvedValueOnce(mockUserForLogin);

    await agent
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'correct-password' })
      .set('Content-Type', 'application/json')
      .expect(200);

    const mockUserDoc = {
      userId: 'u-123',
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashed',
      save: jest.fn().mockResolvedValue(true)
    };

    User.findOne.mockResolvedValueOnce(mockUserDoc);

    const res = await agent
      .post('/account/edit')
      .type('form')
      .send({ username: 'testuser', password: 'newpassword123', confirmPassword: 'newpassword123' })
      .expect(302);

    expect(res.headers.location).toBe('/account');
    expect(mockUserDoc.save).toHaveBeenCalled();
  });

  test('should handle account not found during update', async () => {
    const agent = request.agent(app);
    const mockUser = {
      userId: 'u-123',
      username: 'testuser',
      email: 'test@example.com',
      userrole: 'user',
      comparePassword: jest.fn().mockResolvedValue(true)
    };

    User.findOne
      .mockResolvedValueOnce(mockUser) // For login
      .mockResolvedValueOnce(null); // For account edit - user not found

    await agent
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'correct-password' })
      .set('Content-Type', 'application/json')
      .expect(200);

    const res = await agent
      .post('/account/edit')
      .type('form')
      .send({ username: 'newname', password: '', confirmPassword: '' })
      .expect(404);

    expect(res.text).toContain('User account not found');
  });
});
