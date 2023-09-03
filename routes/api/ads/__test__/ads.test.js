const request = require('supertest');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const mongoose = require('../../../../lib/connectMongoose');
const app = require('../../../../app.js');
const {
  serviceOffline,
} = require('../../../../lib/microServiceEmailConfig.js');

describe('GET /api/ads/adverts endpoint', () => {
  it('Happy case - Successfully fetch ads list', async () => {
    const response = await request(app).get('/api/ads/adverts');

    // Check the response
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('results');
  });

  /* Closing database connection after each test. */
  afterAll(async () => {
    await mongoose.close();
    serviceOffline();
  });
});
