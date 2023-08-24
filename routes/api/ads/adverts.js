const express = require("express");
const router = express.Router();
const { Advert, User } = require('../../../models');
const upload = require('../../../lib/uploadConfigure');
const jwtAuthApiMiddlewar = require('../../../lib/jwtAuthApiMiddleware');

/* GET api/ads/adverts*/
// Returns a list of ads

router.get('/', async (req, res, next) => {
  try {
        // Order by "created at"
    const sort = req.query.sort;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

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
        .map((category) => new RegExp(category, 'i')); //Case-sensitive and case-insensitive
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

    res.json({ results: advertsList, total });

  } catch (error) {
    next(error);
  }
});

// Returns a list of available categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Advert.distinctCategories();
    res.json({ result: categories });
  } catch (error) {
    next(error);
  }
});

//return an advert by Id
router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const advert = await Advert.findById(id);
    res.json({ result: advert });
  } catch (error) {
    next(error);
  }
});


/*POST api/ads/adverts/create (body) */

//Create an advert
router.post(
  '/create',
  jwtAuthApiMiddlewar,
  upload.single('image'),
  async (req, res, next) => {
    try {
      const adData = req.body;
      //NOTE Get the ID of the authenticated user from the JWT token
      const userId = req.user.id;

      console.log('anunciooooo', userId);

      //Query the database to obtain the user name
      const user = await User.findUserById(userId); // Asumiendo que 'User' es el modelo de usuario
      console.log('ooooo', user);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const imageFilename = req.file ? req.file.filename : '';
      //NOTE Url for the image that is saved in the DB
      //const imageUrl = `${process.env.IMAGE_URL}${imageFilename}`;
      let imageUrl = '';

      if (imageFilename) {
        imageUrl = `${process.env.IMAGE_URL}${imageFilename}`;
      }

      adData.image = imageUrl;

      //NOTE Add the current date to the ad
      adData.createdAt = new Date();

      adData.username = user.username;

      //NOTE I create an instance of Advert in memory
      const ad = new Advert(adData);

      //NOTE we persist it in the DB
      const saveAd = await ad.save();
      res.json({ result: saveAd });

      console.log(
        `Successfully created ad with id ${saveAd.id} and name ${saveAd.name}`
      );
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
