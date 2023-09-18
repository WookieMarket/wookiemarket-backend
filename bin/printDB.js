'use strict';

// Import local variable values
require('dotenv').config();

const { Advert, User, Notifications } = require('../models');
const connection = require('../lib/connectMongoose');

main().catch(err => console.log('There was a error', err));

async function main() {
  // Print users
  await printUsers();

  // Print Ads
  await printAds();

  // close connection
  connection.close();
}

async function printUsers() {
  try {
    const users = await User.list();
    console.log(`Users...'${users}`);
  } catch (error) {
    console.log('error', error);
  }
}

async function printAds() {
  try {
    const ads = await Advert.list();
    console.log(`Ads...'${ads}`);
  } catch (error) {
    console.log('error', error);
  }
}
