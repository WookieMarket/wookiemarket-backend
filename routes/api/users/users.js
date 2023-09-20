const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const upload = require('../../../lib/uploadConfigure');
const { User, Advert, Notifications } = require('../../../models');
const {
  microEmailService,
  microEmailServiceBuy,
  resetPassword,
} = require('../../../lib/microServiceEmailConfig');
const jwtAuthApiMiddleware = require('../../../lib/jwtAuthApiMiddleware');
const { ObjectId } = require('bson');

/**
 *  GET /api/users/
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
 *  GET /api/users/email (params)
 *  searches a user by email
 *  returns a {User}
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
 *  GET /api/users/id/:id (params)
 *  searches a user by id
 *  returns a {User}
 */
router.get('/id/:id', async (req, res, next) => {
  try {
    let id = req.params.id;
    const user = await User.findUserById(id);

    res.json({ results: user });
  } catch (error) {
    next(error);
  }
});

/**
 *  GET /api/users/:user/ads (params)
 *  Search all ads of user
 *  returns [Advert] list of ads
 */
router.get('/:user/ads', async (req, res, next) => {
  try {
    let user = req.params.user;
    if (!user) {
      return res.status(400).json({
        error: "Missing parameter 'user'",
      });
    }
    const filter = { username: user };
    const ads = await Advert.list(filter);
    res.json({ results: ads });
  } catch (error) {
    next(error);
  }
});

/**
 *  POST /api/users/email-password (body)
 *  Post a job to microserviceEmail to send a email with an embedded token url and user email to reset password
 *  returns {String} message ok otherwise error
 */
router.post('/email-password', async (req, res, next) => {
  const { to } = req.body;

  try {
    await microEmailService(to);

    res.status(200).json({
      message: 'Password recovery email sent successfully.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 *  POST /api/users/email-buy (body)
 *  Post a job to microserviceEmail to send an email
 *  to the ad's owner with the message and the buyer's email
 *  returns {String} message ok otherwise error
 */
router.post('/email-buy', jwtAuthApiMiddleware, async (req, res, next) => {
  const { adOwnerId, custom_message } = req.body;

  try {
    // search for the owner of the ad by the id
    const idOwnerArticle = await Advert.findById(adOwnerId);
    console.log('anuncio', idOwnerArticle);

    if (!idOwnerArticle) {
      throw new Error('ad not found');
    }

    const ownerArticle = await User.userId(idOwnerArticle.userId);

    // ad owner email
    to = ownerArticle.email;
    console.log('correo', to);

    // obtain the email of the user who is registered
    const userId = req.user.id;
    const registeredUser = await User.userId(userId);
    const userFrom = registeredUser.email;

    await microEmailServiceBuy(to, custom_message, userFrom);

    res.status(200).json({
      message: 'Contact owner email sent successfully.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 *  POST /api/users/recover-password (body)
 *  if the url token and the token inside resetpassword match, the password is changed
 *  returns {} object message otherwise error
 */
router.post('/recover-password', async (req, res, next) => {
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
    next(error);
  }
});

/**
 *  POST /api/users/deleted-user (body)
 *  Finds user by provided email, check auth, and drops the user from database
 *  returns {} object ok message, otherwise error
 */
router.post('/deleted-user', jwtAuthApiMiddleware, async (req, res, next) => {
  const { email } = req.body;
  try {
    // gets the authenticated user from the req.user object
    const authenticatedUser = req.user;

    // finds user by the provided email
    const userToDelete = await User.findByEmail(email);

    if (!userToDelete) {
      return res.status(400).json({
        error: 'Usuario no encontrado.',
      });
    }

    // checks if the authenticated user matches the user to delete
    if (authenticatedUser.id.toString() !== userToDelete._id.toString()) {
      return res.status(403).json({
        error: 'You do not have permissions to delete this user.',
      });
    }

    // generates the token using generateToken
    await User.generateToken(userToDelete._id);

    // gets the updated user with the new token
    const userWithToken = await User.findById(userToDelete._id);

    try {
      // checks the token in resetpassword
      const decodedToken = jwt.verify(
        userWithToken.resetpassword,
        process.env.JWT_SECRET,
      );

      // if the id of the token in resetpassword matches the id of the user's token I delete it
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
    next(error);
  }
});

/**
 * POST /api/users/user-info (body| query)
 * updates user information
 * returns {User} updated user, otherwise error
 */
router.post(
  '/user-info',
  jwtAuthApiMiddleware,
  upload.none(),
  async (req, res, next) => {
    let token = req.get('Authorization' || req.body.jwt || req.query.jwt);
    token = token.replace('Bearer ', '');

    const data = req.body;
    console.log('data:', data);

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decodedToken._id;

      // Get the current user
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if the current password was provided and if it is correct
      if (data.password) {
        const passwordMatch = await user.comparePassword(data.password);
        if (!passwordMatch) {
          return res.status(400).json({ error: 'Incorrect password' });
        }
      }

      // Update user data
      // If a new password is provided, encrypt it
      if (data.newPassword) {
        const hashedPassword = await User.hashPassword(data.newPassword);
        user.password = hashedPassword;
      }

      user.email = data.email;
      user.username = data.username;

      // Save the updated user to the database
      await user.save();

      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },
);

/**
 *  POST /api/users/favorites/:adId (params)
 *  Ads a given ad into the current user favorite list
 *  returns {Advert} added ad and message ok, otherwise error
 */
router.post(
  '/favorites/:adId',
  jwtAuthApiMiddleware,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const adId = req.params.adId;

      if (!adId) {
        return res.status(400).json({
          error: "I can't find the ad id",
        });
      }
      const user = await User.findUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      // Check if the ad ID already exists in the user's favorites list
      if (user.favorites.some(favorite => favorite.toString() === adId)) {
        return res.status(400).json({
          error: 'Ad already added to favorites',
        });
      }

      user.favorites.push(adId);

      await user.save();

      // Get the newly added ad
      const addedAd = await Advert.findById(adId);

      return res.status(200).json({
        message: 'Ad added to favorites successfully',
        addedAd: addedAd,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 *  DELETE /api/users/delete-favorite/adId (params)
 *  Retrieve the user and remove Ad id from user's favorite list
 *  returns {String} message ok, otherwise error
 */
router.delete(
  '/delete-favorite/:adId',
  jwtAuthApiMiddleware,
  async (req, res, next) => {
    const userId = req.user.id;
    const adId = req.params.adId;

    try {
      if (!adId) {
        return res.status(400).json({
          error: "I can't find the ad id",
        });
      }
      const user = await User.findUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      // Check if the ad ID exists in the user's favorites list
      if (user.favorites.some(favorite => favorite.toString() === adId)) {
        // Filter the favorites list to remove the ad ID
        user.favorites = user.favorites.filter(
          favorite => favorite.toString() !== adId,
        );

        // Save the updated user in the database
        await user.save();

        return res.status(200).json({
          message: 'Ad removed from favorites successfully',
        });
      } else {
        return res.status(400).json({
          error: 'Ad is not in favorites',
        });
      }
    } catch (error) {
      next(error);
    }
  },
);

/**
 *  GET /api/users/favorite-adverts
 *  Retrieves the list of favorite ad's ids of teh user
 *  returns {[Advert.Id]} the ad's ids, error otherwise
 */
router.get(
  '/favorite-adverts',
  jwtAuthApiMiddleware,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const favoriteAdverts = await User.favoriteAds(userId);

      res.status(200).json(favoriteAdverts);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/users/notification
 * Retrieves all notification for the provided user id
 * returns {[Notifications]} the list of notifications, error otherwise
 */
router.get('/notification', jwtAuthApiMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifications = await User.getAllNotificationsById(userId);
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/isread
 * Sets a notifcation as read
 * returns {String} message ok, otherwise error
 */
router.put('/isread', jwtAuthApiMiddleware, async (req, res, next) => {
  try {
    const { notificationId } = req.body;
    const _id = new ObjectId(notificationId);
    const userId = req.user.id;

    const user = await User.userId(userId);

    console.log('user', user, _id);

    const userNotification = user.notifications.find(userNotification =>
      userNotification._id.equals(_id),
    );

    console.log('userNotification', userNotification);

    if (!userNotification) {
      return res.status(400).json({
        error: "I can't find the notification",
      });
    }

    // Mark the notification as read
    userNotification.readAt = Date.now();

    // Save the updated notification to the database
    await user.save();

    return res.status(200).json({
      message: 'Notification marked as read',
      result: userNotification,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
