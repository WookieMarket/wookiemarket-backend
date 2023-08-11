const express = require("express");
const router = express.Router();
const { Advert } = require("../../../models");

//DONE I create an ad
/**
 *  POST api/ads/adverts/create (body)
 *  Create an advert
 */
router.post("/create", async (req, res, next) => {
  try {
    const adData = req.body;

    adData.img = req.file ? req.file.filename : "";

    //NOTE I create an instance of Agent in memory
    const ad = new Advert(adData);

    //NOTE we persist it in the DB
    const saveAd = await ad.save();
    res.json({ result: saveAd });

    console.log(
      `Creado con éxito anuncio con id ${saveAd.id} y nombre ${saveAd.name}`,
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
