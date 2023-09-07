const request = require('supertest');
require('dotenv').config({ path: `.env.test` });
const mongoose = require('../../../../lib/connectMongoose');
const app = require('../../../../app');
const {
  serviceOffline,
} = require('../../../../lib/microServiceEmailConfig.js');
const { Adverts } = require('../../../../../models');
const { prepareTestData } = require('../../../../utils/TestUtils');

describe('GET /api/users/:user/ads endpoint', () => {
  beforeAll(async () => {
    await prepareTestData();
  });

  it('Happy case - Successfully fetch ads list', async () => {
    const response = await request(app).get(`/api/users/${'testUser'}/ads`);

    // Check the response
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('results');
  });

  it('Happy case - Empty list', async () => {});

  it('Unhappy case - mising parameter', async () => {});

  it('Unhappy case - user does not exist', async () => {});

  /* Closing database connection after each test. */
  afterAll(async () => {
    await mongoose.close();
    serviceOffline();
  });
});
