'use strict';
require('dotenv').config();

const { Advert, User } = require('../models');
const connection = require('../lib/connectMongoose');
const users = require('./users');
const advertData = require('./adverts');

main().catch((err) => console.log('There was a error', err));

async function main() {
    // initialize user collection
    await initUsers();

    // initialize advert collection
    await initAdverts();

    // close connection
    connection.close();
}

async function initUsers() {
    const deleted = await User.deleteMany();
    console.log(`Eliminated ${deleted.deletedCount} users.`);

    // get initial users
    const emailAndPasswords = await getEmailAndPasswords(users);

    const inserted = await User.insertMany(emailAndPasswords);

    console.log(`Created ${inserted.length} users.`);
}

const getEmailAndPasswords = async (users) => {
    const emailAndPasswords = await Promise.all(
        users.map(async (user) => {
            const { email, password, username } = user;
            const hashedPassword = await User.hashPassword(password);
            return { email, password: hashedPassword, username };
        })
    );
    console.log(emailAndPasswords);
    return emailAndPasswords;
};

async function initAdverts() {
    // Delete all documents in the advert collection
    const deleted = await Advert.deleteMany();
    console.log(`Deleted ${deleted.deletedCount} adverts.`);

    // Create initial advertisements
    const inserted = await Advert.insertMany(advertData);

    console.log(`Created ${inserted.length} adverts.`);
}
