const express = require('express');
const router = express.Router();
const Advert = require('../../models/Advert');
//const upload = require('../../lib/upLoadConfigure');
//const { Requester } = require('cote');

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

        // Filters
        const filterByName = req.query.name;
        const filter = {};
        if (filterByName) {
            filter.name = { $regex: filterByName, $options: 'i' }; //Obvia mayúsculas y minúsculas y permite búsqueda por palabras
        }

        const advertsList = await Advert.list(
            filter,
            skip,
            limit,
            sort,
            fields
        );

        if (req.originalUrl.startsWith('/adverts')) {
            res.json({ results: advertsList });
        } else {
            res.locals.advertsList = advertsList;
            res.render('index');
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
