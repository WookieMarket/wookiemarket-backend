const request = require('supertest');
require('dotenv').config();
const app = require('../../app');
const dbConnection = require('../../lib/connectMongoose');
const { User } = require('../../models');

describe('Test POST /api/auth/signup endpoint', () => {
  let generatedKey, userData;

  beforeAll(() => {
    generatedKey = Math.random();
    userData = {
      username: `user${generatedKey}`,
      email: `user${generatedKey}@test.com`,
      pasword: `${generatedKey}-${generatedKey}`,
    };
  });

  test('Happy case - Successfully create new user and return a JWT', async () => {
    //post.send.expect.then
    const response = await request(app).post('/api/auth/signup').send(userData);

    // Check the response
    expect(response.statusCode).toBe(200);

    // Check the data in the database
    const newUser = await User.findOne({ username: userData.username });
    expect(newUser).toBeDefined();
  });

  test('Unhappy case - Throws error when trying to register an existing username', async () => {
    let data = {
      username: `userXYZ`,
      email: `user${generatedKey}@test.com`,
      pasword: `${generatedKey}-${generatedKey}`,
    };
    // create user
    await request(app).post('/api/auth/signup').send(data);
    // create a second user with the same username
    const response = await request(app).post('/api/auth/signup').send(data);
    expect(response.body).toHaveProperty('error');
  });

  test('Unhappy case - Throws error when trying to register an existing email', async () => {
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

  afterAll(done => {
    // Closing the DB connection allows Jest to exit successfully.
    dbConnection.close();
    done();
  });
});
