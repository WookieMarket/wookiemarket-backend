const express = require('express');
const router = express.Router();
const { Advert, User } = require('../../../models');
const upload = require('../../../lib/uploadConfigure');
const jwtAuthApiMiddlewar = require('../../../lib/jwtAuthApiMiddleware');

/**
 *  Returns a list of ads
 *
 *  GET api/ads/adverts
 *  Returns a list of ads
 */
router.get('/', async (req, res, next) => {
  try {
    // Order
    const sort = req.query.sort;

    // Pagination
    const skip = req.query.skip;
    const limit = req.query.limit;

    // Fields
    const fields = req.query.fields;

    // Filters
    const filterByName = req.query.name;
    const filter = {};
    if (filterByName) {
      // Option i, ignores uppercase and allows search by words
      filter.name = { $regex: filterByName, $options: 'i' };
    }

    // TODO añadir resto de campos de filtardo
    const advertsList = await Advert.list(filter, skip, limit, sort, fields);

    res.json({ results: advertsList });
  } catch (error) {
    next(error);
  }
});

/**
 *  Creates an ad
 *
 *  POST api/ads/adverts/create (body)
 *  Create an advert
 */
router.post(
  '/create',
  jwtAuthApiMiddlewar,
  upload.single('image'),
  async (req, res, next) => {
    try {
      const adData = req.body;
      // Get the ID of the authenticated user from the JWT token
      const userId = req.user.id;

      //console.log('anunciooooo', userId);

      // Makes a query by UserId
      const user = await User.findUserById(userId);
      console.log('ooooo', user);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const imageFilename = req.file ? req.file.filename : '';
      // Url for the image that is saved in the DB
      //const imageUrl = `${process.env.IMAGE_URL}${imageFilename}`;
      let imageUrl = '';

      if (imageFilename) {
        imageUrl = `${process.env.IMAGE_URL}${imageFilename}`;
      }

      adData.image = imageUrl;

      // Add the current date to the ad
      adData.createdAt = new Date();

      adData.username = user.username;

      // Creates an instance of Agent in memory
      const ad = new Advert(adData);

      // We persist it in the DB
      const saveAd = await ad.save();
      res.json({ result: saveAd });

      console.log(
        `Successfully created ad with id ${saveAd.id} and name ${saveAd.name}`,
      );
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
