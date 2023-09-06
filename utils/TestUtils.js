'use strict';

// Import local variable values
require('dotenv').config();

const connection = require('../lib/connectMongoose');
const { Adverts, User } = require('../models');
const { addUsers, addAdverts } = require('../bin/initDB');

async function prepareTestData() {
  await addUsers('./utils/TestUsers.json');
  await addAdverts('./utils/TestAdverts.json');
}

module.export = prepareTestData;
