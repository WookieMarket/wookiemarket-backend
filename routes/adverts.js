var express = require('express');
var router = express.Router();

/*GET advert page. */
router.get('/', async function (req, res, next) {
  try {
    const adverts = await Advert.find();

    res.locals.adverts = adverts;
    res.render('index', { title: 'Adverts from WookieMaarker MongoDb' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
