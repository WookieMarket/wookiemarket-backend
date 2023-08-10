const express = require("express");
const router = express.Router();
const { Advert } = require("../../../models");

/**
 *  POST /ads/adverts (body)
 *  Create an advert
 */
router.post("/create", async (req, res, next) => {
  try {
    const adData = req.body;

    adData.img = req.file ? req.file.filename : "";

    const ad = new Advert(adData);

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
