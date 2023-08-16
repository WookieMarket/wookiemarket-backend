const express = require("express");
const router = express.Router();
const { User } = require("../../models");
const jwt = require("jsonwebtoken");

//DONE returns all users
/**
 *  GET /users
 *  returns all users
 */
router.get("/", async (req, res, next) => {
  try {
    let users = {};
    users = await User.usersAll();

    res.json({ results: users });
  } catch (error) {
    next(error);
  }
});

//DONE returns the user searched for by email
/**
 *  GET /users/email (body)
 *  returns the user searched for by email
 */
router.get("/email/:email", async (req, res, next) => {
  try {
    let email = req.params.email;
    emailUser = await User.findByEmail(email);

    res.json({ results: emailUser });
  } catch (error) {
    next(error);
  }
});

//DONE Route to send a password recovery email
/**
 *  POST /users/email-password (body)
 *  returns an email with a url that has the resetpassword token and the user's email
 */
router.post("/email-password", async (req, res) => {
  const { to } = req.body;

  try {
    await User.microEmailService(to);

    res.status(200).json({
      message: "Password recovery email sent successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error sending password recovery email.",
    });
  }
});

//DONE Route to request password recovery
/**
 *  POST /users/recover-password (body)
 *  if the url token and the token inside resetpassword match, the password is changed
 */
router.post("/recover-password", async (req, res) => {
  const { email, token, newPassword } = req.body;

  try {
    //NOTE Check if the URL token is valid and decode it
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    //NOTE Get user ID from decoded token
    const userId = decodedToken.userId;

    console.log("token decodi", decodedToken);

    //NOTE Get user from database using user id
    const user = await User.findUserById(userId);
    console.log("usuario", user);

    //NOTE Check if the token stored in the database matches the token in the URL
    if (user && user.resetpassword === token) {
      //NOTE If the token matches, proceed to change the password
      await User.resetPassword(email, token, newPassword);

      return res.status(200).json({
        message: "Password changed successfully",
      });
    } else {
      return res.status(400).json({
        error: "Invalid or expired token.",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to change password.",
    });
  }
});

module.exports = router;
