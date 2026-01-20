const request = require('supertest');

// Mock the database connection for testing
jest.mock('../src/config/database', () => {
  return jest.fn().mockResolvedValue(true);
});

const app = require('../src/app');

describe('App Setup', () => {
  test('should respond to GET /', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.text).toContain('Home Swap Platform');
  });

  test('should serve static files', async () => {
    const response = await request(app)
      .get('/css/style.css')
      .expect(200);
    
    expect(response.headers['content-type']).toMatch(/css/);
  });

  test('should handle 404 errors', async () => {
    const response = await request(app)
      .get('/nonexistent-route')
      .expect(404);
    
    expect(response.text).toContain('Page Not Found');
  });
});