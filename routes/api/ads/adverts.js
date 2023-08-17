const express = require('express');
const router = express.Router();
const { Advert } = require('../../../models');
const upload = require('../../../lib/uploadConfigure');
const jwtAuthApiMiddlewar = require('../../../lib/jwtAuthApiMiddleware');

//DONE I create an ad
/**
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

      const imageFilename = req.file ? req.file.filename : '';
      //NOTE Url for the image that is saved in the DB
      //const imageUrl = `${process.env.IMAGE_URL}${imageFilename}`;
      let imageUrl = '';

      if (imageFilename) {
        imageUrl = `${process.env.IMAGE_URL}${imageFilename}`;
      }

      adData.image = imageUrl;

      //NOTE I create an instance of Agent in memory
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

// Returns a list of ads
router.get('/', async (req, res, next) => {
  try {
    // Order
    const sort = req.query.sort;

    // Pagination
    const skip = req.query.skip;
    const limit = req.query.limit;

    // Fields
    const fields = req.query.fields;

    /* Filters
    const filterByName = req.query.name;
    const filter = {};
    if (filterByName) {
      filter.name = { $regex: filterByName, $options: 'i' }; //Obvia mayúsculas y minúsculas y permite búsqueda por palabras
    }*/

    const advertsList = await Advert.list(
      /*filter,*/ skip,
      limit,
      sort,
      fields
    );

    res.json({ results: advertsList });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
