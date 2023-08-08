const express = require("express");
const router = express.Router();
const { User } = require("../../../models");
const createError = require("http-errors");

/**
 *  POST /auth/signup (body)
 *  Create a user account, the corresponding session and returns a JWT Token,
 *  if no error encountered
 */
router.post("/", async (req, res, next) => {
  try {
    // retrieve user data
    const { username, password, email } = req.body;

    // Register new user
    const hashedPassword = await User.hashPassword(password);
    const addedUser = await User.create({
      email,
      password: hashedPassword,
      username,
      resetpassword: "",
    });
    console.log(`New account created.'${addedUser}`);

    // Trigger login, in order to auth and returns a JWT token
    next();
  } catch (err) {
    if (err.code == 11000) {
      let m = "";
      if (err.keyValue.username) {
        message = `Username: ${err.keyValue.username} is already taken!`;
      } else if (err.keyValue.email) {
        message = `Email: ${err.keyValue.email} is already registered!`;
      }
      const error = createError(400, message);
      next(error);
    } else {
      next(err);
    }
  }
});

module.exports = router;
