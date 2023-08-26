const express = require('express');
const router = express.Router();
const { User } = require('../../models');
const jwt = require('jsonwebtoken');
const {
  microEmailService,
  resetPassword,
} = require('../../lib/microServiceEmailConfig');
const jwtAuthApiMiddleware = require('../../lib/jwtAuthApiMiddleware');

/**
 *  GET /users
 *  returns all users
 */
router.get('/', async (req, res, next) => {
  try {
    let users = {};
    users = await User.usersAll();

    res.json({ results: users });
  } catch (error) {
    next(error);
  }
});

/**
 *  GET /users/email (body)
 *  returns the user searched for by email
 */
router.get('/email/:email', async (req, res, next) => {
  try {
    let email = req.params.email;
    emailUser = await User.findByEmail(email);

    res.json({ results: emailUser });
  } catch (error) {
    next(error);
  }
});

/**
 *  POST /users/email-password (body)
 *  returns an email with a url that has the resetpassword token and the user's email
 */
router.post('/email-password', async (req, res) => {
  const { to } = req.body;

  try {
    await microEmailService(to);

    res.status(200).json({
      message: 'Password recovery email sent successfully.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error sending password recovery email.',
    });
  }
});

/**
 *  POST /users/recover-password (body)
 *  if the url token and the token inside resetpassword match, the password is changed
 */
router.post('/recover-password', async (req, res) => {
  const { email, token, newPassword } = req.body;

  try {
    // Checks if the URL token is valid and decode it
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Gets user ID from decoded token
    const userId = decodedToken.userId;

    console.log('token decodi', decodedToken);

    // Gets user from database using user id
    const user = await User.findUserById(userId);
    console.log('usuario', user);

    // Checks if the token stored in the database matches the token in the URL
    if (user && user.resetpassword === token) {
      // If the token matches, proceed to change the password
      await resetPassword(email, token, newPassword);

      return res.status(200).json({
        message: 'Password changed successfully',
      });
    } else {
      return res.status(400).json({
        error: 'Invalid or expired token.',
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Failed to change password.',
    });
  }
});

//DONE Route to delete a user by his id
/**
 *  POST /users/deleted-user (body)
 *  asks for the email locates the user takes out his id and deletes it
 */
router.post('/deleted-user', jwtAuthApiMiddleware, async (req, res) => {
  const { email } = req.body;
  try {
    //NOTE I get the authenticated user from the req.user object
    const authenticatedUser = req.user;

    //NOTE I look for the user by the email provided
    const userToDelete = await User.findByEmail(email);

    if (!userToDelete) {
      return res.status(400).json({
        error: 'Usuario no encontrado.',
      });
    }

    //NOTE I check if the authenticated user matches the user to delete
    if (authenticatedUser.id.toString() !== userToDelete._id.toString()) {
      return res.status(403).json({
        error: 'You do not have permissions to delete this user.',
      });
    }

    //NOTE Generate the token using generateToken
    await User.generateToken(userToDelete._id);

    //NOTE Get the updated user with the new token
    const userWithToken = await User.findById(userToDelete._id);

    try {
      //NOTE Check the token in resetpassword
      const decodedToken = jwt.verify(
        userWithToken.resetpassword,
        process.env.JWT_SECRET,
      );

      //NOTE if the id of the token in resetpassword matches the id of the user's token I delete it
      if (decodedToken.userId === userWithToken._id.toString()) {
        await User.deleteUser(userWithToken._id);
        return res.status(200).json({
          message: 'User deleted successfully.',
        });
      } else {
        return res.status(400).json({
          error: 'Invalid token for this user.',
        });
      }
    } catch (tokenError) {
      console.error('Failed to verify token:', tokenError);
      return res.status(400).json({
        error: 'Invalid Token.',
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Failed to delete user.',
    });
  }
});

module.exports = router;
