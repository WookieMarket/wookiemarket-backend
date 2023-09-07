const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const upload = require('../../../lib/uploadConfigure');
const { User, Advert } = require('../../../models');
const {
  microEmailService,
  resetPassword,
} = require('../../../lib/microServiceEmailConfig');
const jwtAuthApiMiddleware = require('../../../lib/jwtAuthApiMiddleware');

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
 *  GET /users/id/:id (params)
 *  returns the user searched for by id
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
 *  GET /users/:user/ads (params)
 *  returns list of ads for the given username
 */
router.get('/:user/ads', async (req, res, next) => {
  try {
    // console.log(req.params);
    let user = req.params.user;
    if (!user) {
      return res.status(400).json({
        error: "Missing parameter 'user'",
      });
    }
    const filter = { username: user };
    const ads = await Advert.list(filter);
    // console.log(ads);
    res.json({ results: ads });
  } catch (error) {
    next(error);
  }
});

/**
 *  POST /users/email-password (body)
 *  returns an email with a url that has the resetpassword token and the user's email
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
 *  POST /users/recover-password (body)
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
 *  POST /users/deleted-user (body)
 *  asks for the email locates the user takes out his id and deletes it
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
 * POST /users/user-info (body| query)
 * updates user information
 *
 * returns updated user object or error
 */
router.post('/user-info', upload.none(), async (req, res, next) => {
  let token = req.get('Authorization' || req.body.jwt || req.query.jwt);
  token = token.replace('Bearer ', '');

  const data = req.body;
  console.log('data:', data);

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken._id;

    // Obtén el usuario actual
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verifica si se proporcionó la contraseña actual y si es correcta
    if (data.password) {
      const passwordMatch = await user.comparePassword(data.password);
      if (!passwordMatch) {
        return res.status(400).json({ error: 'Contraseña incorrecta' });
      }
    }

    // Si se proporciona una nueva contraseña, cámbiala
    if (data.newPassword) {
      const hashedPassword = await User.hashPassword(data.newPassword);
      user.password = hashedPassword;
    }

    // Actualiza otros datos del usuario según sea necesario
    user.email = data.email;
    user.username = data.username;

    // Guarda el usuario actualizado en la base de datos
    await user.save();

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

/**
 *  POST /favorites/:adId (params)
 *  Ads a given ad into the current user favorite list
 *
 */
router.post(
  '/favorites/:adId',
  jwtAuthApiMiddleware,
  async (req, res, next) => {
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decodedToken._id;
      //const userId = req.user._id;
      const adId = req.params.adId;
      console.log('userid', userId);
      console.log('id', adId);

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
      // Agregar el ID del anuncio a la lista de favoritos del usuario
      user.favorites.push(adId);

      // Guardar el usuario actualizado en la base de datos
      await user.save();

      return res.status(200).json({
        message: 'Ad added to favorites successfully',
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 *  DELETE /delete-favorite/adId
 *  return it searches for the user by his id and if it finds it, it deletes the id of the ad saved in the favorites property
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
 *  GET /favorite-adverts
 *  returns all the ads that this user has saved
 */
router.get(
  '/favorite-adverts',
  jwtAuthApiMiddleware,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const favoriteAdverts = await User.favoriteAds(userId);

      res.status(200).json({ favoriteAdverts });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
