require('dotenv').config({ path: `.env.test` });
const request = require('supertest');
const mongoose = require('../../../../../lib/connectMongoose');
const app = require('../../../../../app.js');
const {
  serviceOffline,
} = require('../../../../../lib/microServiceEmailConfig');
const { User } = require('../../../../../models');

describe('POST /api/auth/login endpoint', () => {
  let generatedKey, existingUser;
  beforeAll(async () => {
    await User.deleteMany();
    // create the user
    generatedKey = Math.random();
    // Add a user
    const hashedPassword = await User.hashPassword(
      `${generatedKey}-${generatedKey}`,
    );
    existingUser = {
      email: `user${generatedKey}@test.com`,
      password: hashedPassword,
      username: `user${generatedKey}`,
      resetpassword: '',
    };
    await User.create(existingUser);
  });

  it('Happy case - Successfully log user and get a JWT', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: existingUser.username,
        password: `${generatedKey}-${generatedKey}`,
      });

    // Check the response
    // console.log(response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('jwt');
  });

  it('Unhappy case - Log with a wrong username', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: `wrongUser`,
        password: `${generatedKey}-${generatedKey}`,
      });

    // Check the response
    // console.log(response.body);
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('invalid credentials');
  });

  it('Unhappy case - Log with a wrong password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: `user${generatedKey}`,
        password: `wrongPassword`,
      });

    // Check the response
    // console.log(response.body);
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('invalid credentials');
  });

  // Closing database connection after each test.
  afterAll(async () => {
    await mongoose.close();
    serviceOffline();
  });
});
