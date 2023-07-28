const express = require('express');
const router = express.Router();
const Advert = require('../models/Advert');

/* GET home page. */
router.get('/', async function (req, res, next) {
    try {
        const advertList = await Advert.find();

        res.locals.advertList = advertList;
        res.render('index', { title: 'Mandalorians' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
