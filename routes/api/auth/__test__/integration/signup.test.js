require('dotenv').config({ path: `.env.test` });
const request = require('supertest');
const mongoose = require('../../../../../lib/connectMongoose');
const app = require('../../../../../app.js');
const {
  serviceOffline,
} = require('../../../../../lib/microServiceEmailConfig');
const { User } = require('../../../../../models');

describe('POST /api/auth/signup endpoint', () => {
  let existingUser, generatedKey;

  beforeAll(async () => {
    await User.deleteMany();
    generatedKey = Math.random();
    // Add a user
    const hashedPassword = await User.hashPassword(
      `${generatedKey}-${generatedKey}`,
    );
    existingUser = {
      email: `user${generatedKey}@test.com`,
      username: `user${generatedKey}`,
      password: hashedPassword,
      resetpassword: '',
    };
    await User.create(existingUser);
  });

  it('Happy case - Successfully create new user', async () => {
    //post.send.expect.then
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: `newUser${generatedKey}@somecompany.com`,
        username: `newUser${generatedKey}`,
        password: `newPassword123`,
      });

    // Check the response
    console.log(response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('result');
    expect(response.body.result).toBe(
      `New account created. Username: newUser${generatedKey}`,
    );

    // Check the data in the database
    const newUser = await User.findOne({ username: `newUser${generatedKey}` });
    expect(newUser).toBeDefined();
  });

  it('Unhappy case - Throws error when trying to register an existing email', async () => {
    // set the existing with an existing email and new username
    existingUser.username = `newUserTest`;
    existingUser.email = `newUser${generatedKey}@somecompany.com`;

    const response = await request(app)
      .post('/api/auth/signup')
      .send(existingUser);

    // Check the response
    console.log(response.body);
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe(
      `Email: ${existingUser.email} is already registered!`,
    );
  });

  it('Unhappy case - Throws error when trying to register an existing username', async () => {
    // set the existing with an existing username and new emailuser
    existingUser.username = `newUser${generatedKey}`;
    existingUser.email = `newUserTest@somecompany.com`;

    const response = await request(app)
      .post('/api/auth/signup')
      .send(existingUser);

    // Check the response
    console.log(response.body);
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe(
      `Username: ${existingUser.username} is already taken!`,
    );
  });

  // Closing database connection after each test.
  afterAll(async () => {
    await mongoose.close();
    serviceOffline();
  });
});
