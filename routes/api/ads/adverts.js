const express = require('express');
const router = express.Router();
const { Advert, User, Notifications } = require('../../../models');
const upload = require('../../../lib/uploadConfigure');
const jwtAuthApiMiddleware = require('../../../lib/jwtAuthApiMiddleware');
const path = require('path');
const fs = require('fs');
const { ObjectId } = require('bson');

/**
 *  GET /api/ads/adverts/ (query)
 *  returns {[Adverts]} list of all ads, error otherwise
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
 * GET api/ads/adverts/categories
 * returns {[String]} a list of unique categories
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
 *  GET api/ads/adverts/filter (query)
 *  Fetch ads list according to filter provided parameters
 *  returns {[Adverts]} a list of filtered ads
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
    const filterByMinPrice = req.query.minPrice || 0;
    const filterByMaxPrice = req.query.maxPrice || Infinity;
    const filterByPrice = req.query.price;
    const filter = {};
    if (filterByName) {
      filter.name = { $regex: filterByName, $options: 'i' }; //Case-sensitive and case-insensitive and word-searchable
    }
    if (filterByCategory) {
      const categories = filterByCategory
        .split(',')
        .map(category => new RegExp(category, 'i')); //Case-sensitive and case-insensitive
      filter.category = { $all: categories };
    }
    if (filterByMinPrice) {
      filter.price = { ...filter.price, $gte: Number(filterByMinPrice) };
    }
    if (filterByMaxPrice) {
      filter.price = { ...filter.price, $lte: Number(filterByMaxPrice) };
    }
    if (filterByPrice) {
      filter.price = Number(filterByPrice);
    }

    const [advertsList, total] = await Promise.all([
      Advert.list(filter, skip, limit, sort, fields),
      Advert.count(filter),
    ]);

    const totalCountAds = await Advert.countAds(filter);
    console.log(`Total count of matching adverts: ${totalCountAds}`);

    res.json({ results: advertsList, totalCountAds });
  } catch (error) {
    next(error);
  }
});

/**
 *  GET api/ads/adverts/:id (params)
 *  returns {Advert} an Advert or empty object if not found, error otherwise
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
 *  POST api/ads/adverts/create (body)
 *  Create an advert
 *  returns {String} message ok otherwise error
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

      // Makes a query by UserId
      const user = await User.findUserById(userId);
      console.log('ooooo', user);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const imageFilename = req.file ? req.file.filename : '';
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
 *  PUT api/ads/adverts/update/id (params|body)
 *  modify an ad if it belongs to the user
 *  returns {Advert} updated ad, error otherwise
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
      const io = req.app.get('io'); // Obtener 'io' del objeto 'app'

      // Search for the ad by its ID and owner
      const advert = await Advert.findById(adId);
      const advertCopyToCompare = JSON.parse(JSON.stringify(advert));

      let imageUrl;

      // I get the path of the old image if it exists
      const oldImagePath = advert.image;

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
        imageUrl = `${process.env.IMAGE_URL}${imageFilename}`;

        updatedData.image = imageUrl;

        // If an old image exists and the new image is different
        if (oldImagePath && oldImagePath !== imageUrl) {
          // Delete the old image from the public folder
          const oldImageFileName = oldImagePath.split('/').pop();

          const oldImagePathOnDisk = path.join(
            'public',
            'images',
            oldImageFileName,
          );

          fs.unlink(oldImagePathOnDisk, err => {
            if (err) {
              console.error('Error al eliminar la imagen antigua:', err);
            } else {
              console.log(
                'Imagen antigua eliminada con éxito.',
                oldImagePathOnDisk,
              );
            }
          });
        }
      }

      // Add the current date to the ad
      updatedData.createdAt = new Date();

      // Merge updated data into the existing ad
      Object.assign(advert, updatedData);

      // Save the updated ad
      const updatedAd = await advert.save();

      console.log('ads, despues, antes', updatedAd, advertCopyToCompare);

      if (
        updatedAd.price !== advertCopyToCompare.price ||
        updatedAd.status !== advertCopyToCompare.status
      ) {
        const notificacionData = {
          advert: new ObjectId(adId),
          status: updatedAd.status,
          price: updatedAd.price,
        };

        const newNotification = new Notifications(notificacionData);

        // Create an instance of the notification and save it to the database
        await newNotification.save();

        // Find users who have this ad in their favorites list
        const usersWithFavorite = await User.find({ favorites: adId });
        console.log('favorites', usersWithFavorite);
        console.log(
          'favoritesid',
          usersWithFavorite.map(user => user._id.toString()),
        );

        // send notifications to the corresponding users
        usersWithFavorite.forEach(async user => {
          user.notifications.push({ notification: newNotification._id });
          await user.save();
          console.log('Notificacion añadida al usuario', user);
        });
      }

      res.json({ result: updatedAd });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET api/ads/adverts/find/:id (params)
 * Retrieves an Ad by id
 * returns {Advert} an Ad, or empty object, error otherwise
 */
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

/**
 * DELETE api/ads/adverts/:id (params)
 * Cheks auth and drops an Ad if fount
 * returns {Object} string message ok and Ad.Id of the deleted Ad, error otherwise
 */
router.delete('/:id', jwtAuthApiMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const ad = await Advert.findById(id);

    const fileName = ad.image.split('/').pop();
    console.log('anuncio eliminado', fileName);

    const imagePath = path.join('public', 'images', fileName);

    await Advert.findByIdAndDelete(id);

    // Delete the file in the public folder
    fs.unlink(imagePath, err => {
      if (err) {
        console.error('Error deleting file:', err);
      } else {
        console.log('Successfully deleted file:', imagePath);
      }
    });

    // Get the list of users who have the ad in their favorites
    const usersToUpdate = await User.find({ favorites: ad._id });

    // Update each user's favorites list
    usersToUpdate.forEach(async user => {
      const index = user.favorites.indexOf(ad._id);
      if (index !== -1) {
        // If the ad ID is found in the user's favorites list, delete it
        user.favorites.splice(index, 1);
        // Save changes to the database
        await user.save();
      }
    });

    // Sends a response to the client indicating that the advertisement was successfully removed.
    res.status(200).send({
      message: 'Advert deleted successfully',
      adDeleted: ad._id,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
