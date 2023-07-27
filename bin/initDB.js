'use strict';

// Import local variable values
require('dotenv').config();

const { User } = require('../models');
const connection = require('../lib/connectMongoose');

main().catch(err => console.log('There was a error', err));

async function main() {
  // initialize user collection
  await initUsers();

  // close connection
  connection.close();
}

/**
 *  Loads user data and create Users instances
 */
async function initUsers() {
  // Drop data from Users collection
  const deleted = await User.deleteMany();
  console.log(`Eliminated ${deleted.deletedCount} users.`);

  // Load users
  const list = await loadDataFrom('./models/Users.json');

  try {
    const users = await Promise.all(
      list.map(async user => {
        const { email, password, username } = user;
        const hashedPassword = await User.hashPassword(password);
        return { email, password: hashedPassword, username };
      })
    );

    console.log(users);
    const inserted = await User.create(users);
    console.log(`Importing users...'${inserted}`);
  } catch (error) {
    console.log('error', error);
  }
}

/**
 * This loads data from a given file path
 * @param {String} path where the JSON file is allocated
 * @returns list of items
 */
async function loadDataFrom(path) {
  const fs = require('fs');
  const items = await JSON.parse(fs.readFileSync(path, 'utf-8'));
  //console.log('Reading JSON', items);
  return items;
}
