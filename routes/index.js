var express = require('express');
var router = express.Router();
const Advert = require('../models/Advert');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Mandalorians' });
});

module.exports = router;

/*GET advert page. */
router.get('/adverts', async function (req, res, next) {
    try {
        const adverts = await Advert.find();

        res.locals.adverts = adverts;
        res.render('index', { title: 'Adverts from WookieMaarker MongoDb' });
    } catch (error) {
        next(error);
    }
});
