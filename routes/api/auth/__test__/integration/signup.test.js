require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const mongoose = require('../../../../../lib/connectMongoose');
const request = require('supertest');
const app = require('../../../../../app.js');
const {
  serviceOffline,
} = require('../../../../../lib/microServiceEmailConfig');
const { User } = require('../../../../../models');

describe('POST /api/auth/signup endpoint', () => {
  let generatedKey, userData;

  beforeEach(() => {
    generatedKey = Math.random();
    userData = {
      email: `user${generatedKey}@test.com`,
      username: `user${generatedKey}`,
      pasword: `${generatedKey}-${generatedKey}`,
    };
  });

  it('Happy case - Successfully create new user and return a JWT', async () => {
    //post.send.expect.then
    //expect.assertions(2);
    console.log(userData);
    const response = await request(app).post('/api/auth/signup').send(userData);

    // Check the response
    //console.log(response);
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('jwt');

    // Check the data in the database
    const newUser = await User.findOne({ username: userData.username });
    expect(newUser).toBeDefined();
  });

  it('Unhappy case - Throws error when trying to register an existing username', async () => {
    let data = {
      username: `userXYZ`,
      email: `user${generatedKey}@test.com`,
      pasword: `${generatedKey}-${generatedKey}`,
    };
    // create user
    await request(app).post('/api/auth/signup').send(userData);
    // create a second user with the same email
    const response = await request(app).post('/api/auth/signup').send(data);
    expect(response.body).toHaveProperty('error');
  });

  it('Unhappy case - Throws error when trying to register an existing email', async () => {
    let data = {
      username: `user${generatedKey}`,
      email: `userXYZ@test.com`,
      pasword: `${generatedKey}-${generatedKey}`,
    };
    // create user
    await request(app).post('/api/auth/signup').send(data);

    // create a second user with the same username
    const response = await request(app).post('/api/auth/signup').send(data);
    expect(response.body).toHaveProperty('error');
  });

  /* Closing database connection after each test. */
  afterAll(async () => {
    await mongoose.close();
    serviceOffline();
  });
});
