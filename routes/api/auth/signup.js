const express = require('express');
const router = express.Router();
const { User } = require('../../../models');
const createError = require('http-errors');

/**
 *  POST /auth/signup (body)
 *  Create a user account, the corresponding session and returns a JWT Token,
 *  if no error encountered
 */
router.post('/', async (req, res, next) => {
  try {
    // retrieve user data
    const { username, password, email } = req.body;

    // Register new user
    const hashedPassword = await User.hashPassword(password);
    const addedUser = await User.create({
      email,
      username,
      password: hashedPassword,
      resetpassword: '',
    });
    //console.log(`New account created.'${addedUser}`);
    res.json({ result: `New account created. Username: ${username}` });
  } catch (err) {
    const { username, email } = req.body;
    if (err.code == 11000) {
      let message;
      if (err.keyValue.username) {
        message = `Username: ${username} is already taken!`;
      } else if (err.keyValue.email) {
        message = `Email: ${email} is already registered!`;
      }
      next(createError(400, message));
    } else {
      next(err);
    }
  }
});

module.exports = router;
