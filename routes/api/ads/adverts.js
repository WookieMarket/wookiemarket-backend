const express = require('express');
const router = express.Router();
const { Advert, User } = require('../../../models');
const upload = require('../../../lib/uploadConfigure');
const jwtAuthApiMiddleware = require('../../../lib/jwtAuthApiMiddleware');

/**
 *  Returns all ads
 *
 *  GET api/ads/adverts
 *  Returns all ads
 */
router.get('/', async (req, res, next) => {
  try {
    // Pagination
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 10;

    let categories = {};
    categories = await Advert.find()
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));
    res.json({ result: categories });
  } catch (error) {
    next(error);
  }
});

/**
 * Returns a list of unique categories
 *
 * GET api/ads/adverts/categories
 * Returns a list of unique categories
 */
router.get('/categories', async (req, res, next) => {
  try {
    const getAllCategories = req.query.categories === 'true';

    let completeCategories = [];

    if (getAllCategories) {
      completeCategories = await Advert.getUniqueCategories();
    }

    res.json({ results: completeCategories });
  } catch (error) {
    next(error);
  }
});

/**
 *  Returns a list of ads
 *
 *  GET api/ads/adverts/filter
 *  Returns a list of ads
 */
router.get('/filter', async (req, res, next) => {
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
    const filterByCategory = req.query.category;

    const filter = {};
    if (filterByName) {
      // Option i, ignores uppercase and allows search by words
      filter.name = { $regex: filterByName, $options: 'i' };
    }

    if (filterByCategory) {
      const categories = filterByCategory
        .split(',')
        .map(category => new RegExp(category, 'i')); //Case-sensitive and case-insensitive
      filter.category = { $all: categories };
    }

    // TODO añadir resto de campos de filtardo
    const advertsList = await Advert.list(filter, skip, limit, sort, fields);
    const totalCountAds = advertsList.length;
    res.json({ results: advertsList, totalCountAds });
  } catch (error) {
    next(error);
  }
});

//
/**
 * Returns an advert by Id
 *
 *  GET api/ads/adverts/:id
 *  Returns an ad if found
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const advert = await Advert.findById(id);
    res.json({ result: advert });
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
  jwtAuthApiMiddleware,
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
      adData.userId = userId;

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

/**
 *  modify an ad
 *
 *  PUT api/ads/adverts/update/id (body)
 *  modify an ad if it belongs to the user
 */
router.put(
  '/update/:id',
  jwtAuthApiMiddleware,
  upload.single('image'),
  async (req, res, next) => {
    try {
      const adId = req.params.id;
      const userId = req.user.id;
      const updatedData = req.body;

      // Search for the ad by its ID and owner
      const advert = await Advert.findById(adId);

      if (!advert) {
        return res.status(404).json({ error: 'ad not found' });
      }

      // Verify if the ad belongs to the user
      if (advert.userId !== userId) {
        return res
          .status(403)
          .json({ error: 'You do not have permissions to update this ad' });
      }

      // Handle image update
      if (req.file) {
        const imageFilename = req.file.filename;
        const imageUrl = `${process.env.IMAGE_URL}${imageFilename}`;
        updatedData.image = imageUrl;
      }

      // Merge updated data into the existing ad
      Object.assign(advert, updatedData);

      // Save the updated ad
      const updatedAd = await advert.save();

      res.json({ result: updatedAd });
    } catch (error) {
      next(error);
    }
  },
);

router.get('/find/:id', async (req, res, next) => {
  try {
    const adId = req.params.id;

    // Search for the ad by its ID and owner
    const advert = await Advert.findById(adId);

    if (!advert) {
      return res.status(404).json({ error: 'ad not found' });
    }

    res.json({ result: advert });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await Advert.findByIdAndDelete(id);

    // Sends a response to the client indicating that the advertisement was successfully removed.
    res.status(200).send({ message: 'Advert deleted successfully' });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
