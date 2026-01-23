const request = require('supertest');
const app = require('../src/app');

describe('Messaging routes', () => {
  test('should block unauthenticated access to conversations', async () => {
    const res = await request(app).get('/messages/conversation/testUser');
    expect([401, 403]).toContain(res.statusCode);
  });
});
