'use strict';

// Import local variable values
require('dotenv').config();

const { Advert, User } = require('../models');
const connection = require('../lib/connectMongoose');

main().catch(err => console.log('There was a error', err));

async function main() {
  // Adds some prelimiar data to user collection
  await addUsers('./models/Users.json');

  // initialize Advert collection
  await addAdverts('./models/Adverts.json');

  // close connection
  connection.close();
}

/**
 * Loads user data and create Users instances
 *
 * @param {String} fileName string file name for the data set to be imported
 */
async function addUsers(fileName) {
  // Drop data from Users collection
  const deleted = await User.deleteMany();
  console.log(`Eliminated ${deleted.deletedCount} users.`);

  // Load users
  const list = await loadDataFrom(fileName);

  try {
    const users = await Promise.all(
      list.map(async user => {
        const { email, password, username, resetpassword } = user;
        const hashedPassword = await User.hashPassword(password);
        return { email, password: hashedPassword, username, resetpassword };
      }),
    );

    console.log(users);
    const inserted = await User.create(users);
    console.log(`Importing users...'${inserted}`);
  } catch (error) {
    console.log('error', error);
  }
}

/**
 * Loads Advert data and create Adverts instances
 *
 * @param {String} fileName string file name for the data set to be imported
 */
async function addAdverts(fileName) {
  // Delete all documents in the advert collection
  const deleted = await Advert.deleteMany();
  console.log(`Deleted ${deleted.deletedCount} adverts.`);

  // Load advert
  const adsList = await loadDataFrom(fileName);

  try {
    const inserted = await Advert.create(adsList);
    console.log(`Importing adverts...'${inserted}`);
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

module.exports = { addUsers, addAdverts };
