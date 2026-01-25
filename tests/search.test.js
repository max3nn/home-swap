const request = require('supertest');
const mongoose = require('mongoose');

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
    find: jest.fn(() => ({
      sort: jest.fn(() => ({
        limit: jest.fn(() => ({
          lean: jest.fn().mockResolvedValue([]),
        })),
      })),
    })),
  };
});

const Item = require('../src/models/Item');
const User = require('../src/models/User');
const app = require('../src/app');

describe('Search Page', () => {
  beforeEach(() => {
    User.findOne.mockReset();
    Item.find.mockClear();
  });

  test('redirects to login when not authenticated', async () => {
    const res = await request(app).get('/search').expect(302);
    expect(res.headers.location).toBe('/auth/login');
  });

  test('renders search page when authenticated', async () => {
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

    // Return a non-empty result set
    Item.find.mockImplementationOnce(() => ({
      sort: () => ({
        limit: () => ({
          lean: async () => [
            {
              itemId: 'i-1',
              title: 'Makita Batteries',
              description: '18V batteries',
              ownerId: 'u-1',
              itemType: 'tools',
              wantedCategories: ['electronics'],
            },
          ],
        }),
      }),
    }));

    const res = await agent.get('/search').expect(200);
    expect(res.text).toContain('Search Items');
    // Sidebar filters
    expect(res.text).toContain('Search & Filters');
    // Standard category list appears in the selects
    expect(res.text).toContain('Tools');
    expect(res.text).toContain('Electronics');
    // Item card content
    expect(res.text).toContain('Makita Batteries');
  });
});
