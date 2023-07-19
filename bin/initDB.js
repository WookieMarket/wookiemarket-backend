"use strict";

require("dotenv").config();

const { User } = require("../models");
const connection = require("../lib/connectMongoose");
const users = require("./users");

main().catch(err => console.log("There was a error", err));

async function main() {
  // initialize user collection
  await initUsers();

  // close connection
  connection.close();
}

async function initUsers() {
  const deleted = await User.deleteMany();
  console.log(`Eliminated ${deleted.deletedCount} users.`);

  // get initial users
  const emailAndPasswords = await getEmailAndPasswords(users);

  const inserted = await User.insertMany(emailAndPasswords);

  console.log(`created ${inserted.length} users.`);
}

const getEmailAndPasswords = async users => {
  const emailAndPasswords = await Promise.all(
    users.map(async user => {
      const { email, password, username } = user;
      const hashedPassword = await User.hashPassword(password);
      return { email, password: hashedPassword, username };
    }),
  );
  console.log(emailAndPasswords);
  return emailAndPasswords;
};
