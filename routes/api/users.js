const express = require("express");
const router = express.Router();
const { User } = require("../../models");

router.get("/", async (req, res, next) => {
  try {
    let users = {};
    users = await User.usersAll();

    res.json({ results: users });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
