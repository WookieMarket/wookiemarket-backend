const express = require('express');
const router = express.Router();
const { User } = require('../../../models');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');

/**
 *  POST /auth/login (body)
 *  Creates a session and returns a JWT Token, if no error encountered
 */
router.post('/', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    //NOTE Search the user in the DB
    const user = await User.findOne({ username: username });

    //NOTE If it does not exist or the password does not match --> error
    if (!user || !(await user.comparePassword(password))) {
      const error = createError(401, 'invalid credentials');
      next(error);
      return;
    }

    //NOTE If it exists and the password matches
    const tokenApi = jwt.sign({ _id: user._id, username: user.username}, process.env.JWT_SECRET, {
      expiresIn: '2d',
    });

    res.json({ jwt: tokenApi });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
