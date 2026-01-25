const request = require('supertest');

jest.mock('../src/config/database', () => {
  return jest.fn().mockResolvedValue(true);
});

jest.mock('../src/models/User', () => {
  return {
    findOne: jest.fn(),
  };
});

jest.mock('../src/models/Item', () => {
  return {
    create: jest.fn().mockResolvedValue(true),
  };
});

const User = require('../src/models/User');
const Item = require('../src/models/Item');
const app = require('../src/app');

describe('Item Posting', () => {
  beforeEach(() => {
    User.findOne.mockReset();
    Item.create.mockClear();
  });

  test('GET /items/new redirects to login when not authenticated', async () => {
    const res = await request(app).get('/items/new').expect(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  test('GET /items/new renders form when authenticated', async () => {
    const agent = request.agent(app);

    User.findOne.mockResolvedValue({
      userId: 'u-1',
      username: 'Poster',
      email: 'poster@example.com',
      userrole: 'user',
      comparePassword: jest.fn().mockResolvedValue(true),
    });

    await agent
      .post('/auth/login')
      .send({ email: 'poster@example.com', password: 'correct-password' })
      .set('Content-Type', 'application/json')
      .expect(200);

    const res = await agent.get('/items/new').expect(200);
    expect(res.text).toContain('Post an Item');
    expect(res.text).toContain('Title');
    expect(res.text).toContain('Description');
  });

  test('POST /items/new saves item and redirects to /search', async () => {
    const agent = request.agent(app);

    User.findOne.mockResolvedValue({
      userId: 'u-1',
      username: 'Poster',
      email: 'poster@example.com',
      userrole: 'user',
      comparePassword: jest.fn().mockResolvedValue(true),
    });

    await agent
      .post('/auth/login')
      .send({ email: 'poster@example.com', password: 'correct-password' })
      .set('Content-Type', 'application/json')
      .expect(200);

    const res = await agent
      .post('/items/new')
      .type('form')
      .send({ title: 'Bike Helmet', description: 'Lightly used, size M' })
      .expect(302);

    expect(res.headers.location).toBe('/search');
    expect(Item.create).toHaveBeenCalledTimes(1);
    const payload = Item.create.mock.calls[0][0];
    expect(payload.title).toBe('Bike Helmet');
    expect(payload.description).toBe('Lightly used, size M');
    expect(payload.ownerId).toBe('u-1');
  });
});
