const request = require('supertest');

// Mock the database connection for testing
jest.mock('../src/config/database', () => {
  return jest.fn().mockResolvedValue(true);
});

jest.mock('../src/models/Item', () => {
  return {
    find: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    sort: jest.fn().mockResolvedValue([]),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  };
});

const Item = require('../src/models/Item');
const app = require('../src/app');

describe('App Setup', () => {
  beforeEach(() => {
    Item.find.mockClear();
  });

  test('should respond to GET /', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.text).toContain('Home Swap Platform');
  });

  test('should handle 404 errors', async () => {
    const response = await request(app)
      .get('/nonexistent-route')
      .expect(404);

    expect(response.text).toContain('Page Not Found');
  });

  test('should load sample items on home page', async () => {
    const mockItems = [
      {
        itemId: '1',
        title: 'Test Item',
        description: 'A test item',
        imageUrl: 'https://example.com/image.jpg',
        hasImage: true,
        itemType: 'tools'
      }
    ];

    Item.find.mockReturnThis();
    Item.select.mockReturnThis();
    Item.limit.mockReturnThis();
    Item.sort.mockResolvedValue(mockItems);

    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.text).toContain('Available Items');
    expect(Item.find).toHaveBeenCalledWith({ status: 'available' });
  });
});